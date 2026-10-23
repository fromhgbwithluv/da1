<script lang="ts">
  import {
    isCheckoutOpen,
    closeCheckout,
    checkoutJobs,
    favoriteJobs
  } from '../stores/favorites';
  import { currentUser, openAuthModal, recordApplication } from '../stores/auth';
  import UniversitySelect from './UniversitySelect.svelte';
  import Modal from './Modal.svelte';

  let step = $state<'form' | 'success'>('form');
  let isSubmitting = $state(false);

  // Form Fields
  let fullName = $state('');
  let email = $state('');
  let phone = $state('');
  let university = $state('');
  let academicYear = $state('Năm 1');
  let major = $state('');
  let cvLink = $state('');
  let note = $state('');
  
  // Payment / Support Plan
  let paymentMethod = $state<'free' | 'qr_support'>('free');

  // Generated Application Code
  let applicationCode = $state('');

  // Auto-fill from logged-in user profile
  $effect(() => {
    if ($currentUser) {
      fullName = $currentUser.fullName;
      email = $currentUser.email;
      phone = $currentUser.phone;
      university = $currentUser.university;
      academicYear = $currentUser.academicYear;
      major = $currentUser.major;
      cvLink = $currentUser.portfolioLink || ($currentUser.cvFile ? `[CV ĐÍNH KÈM: ${$currentUser.cvFile.name}]` : cvLink);
      if ($currentUser.bio) {
        note = $currentUser.bio;
      }
    }
  });

  function generateAppCode() {
    return 'TSV-' + Math.floor(1000 + Math.random() * 9000);
  }

  function handleClose() {
    step = 'form';
    closeCheckout();
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    isSubmitting = true;

    // Simulate network latency
    setTimeout(() => {
      applicationCode = generateAppCode();
      isSubmitting = false;
      step = 'success';

      // Record into user's application history
      recordApplication($checkoutJobs, {
        applicationCode,
        paymentMethod,
        cvName: $currentUser?.cvFile?.name || ($currentUser?.fullName ? `Hồ sơ ${$currentUser.fullName}` : 'Hồ sơ trực tuyến'),
        note: note.trim() || undefined,
      });
    }, 500);
  }
</script>

<Modal
  isOpen={$isCheckoutOpen && $currentUser?.role !== 'company'}
  onClose={handleClose}
  title={step === 'form' ? 'Xác nhận hồ sơ ứng tuyển' : 'Hồ sơ đã gửi thành công'}
  subtitle={step === 'form' ? 'Quy trình chuẩn hóa • Bảo vệ sinh viên 100%' : 'Mã số hồ sơ đã ghi nhận'}
  iconText="TSV"
  maxWidth="2xl"
  bodyClass="p-0"
>
  {#if step === 'form'}
        <!-- STEP 1: FORM -->
        <form onsubmit={handleSubmit} class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <!-- AUTO-FILL ALERT BANNER (Swiss Minimalist) -->
          {#if $currentUser}
            <div class="rounded-swiss-sm border border-black bg-swiss-50 p-3.5 flex items-start justify-between gap-3">
              <div class="flex items-start gap-2.5">
                <span class="font-mono text-xs font-bold text-signal-emerald shrink-0 mt-0.5">[✓]</span>
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-tight text-black">
                    Tự động điền từ Hồ sơ: {$currentUser.fullName}
                  </h4>
                  <p class="font-mono text-[11px] text-swiss-600 mt-0.5 leading-relaxed">
                    Dữ liệu cá nhân & file CV ({$currentUser.cvFile?.name || 'Đã liên kết'}) đã được nạp sẵn từ Database JSON.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onclick={() => openAuthModal('profile')}
                class="font-mono text-[10px] uppercase font-bold text-black hover:underline shrink-0 bg-white border border-swiss-300 px-2 py-1 rounded-swiss-sm"
              >
                Chỉnh sửa
              </button>
            </div>
          {:else}
            <div class="rounded-swiss-sm border border-swiss-300 bg-swiss-50 p-3 flex items-center justify-between gap-2">
              <span class="font-mono text-xs text-swiss-700">
                [!] Đăng nhập để tự động điền thông tin và đính kèm CV lưu sẵn.
              </span>
              <button
                type="button"
                onclick={() => openAuthModal('login')}
                class="rounded-swiss-sm bg-black px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-white hover:bg-neutral-800 shrink-0"
              >
                Đăng nhập
              </button>
            </div>
          {/if}

          <!-- Jobs summary box -->
          <div class="rounded-swiss-sm border border-swiss-300 bg-white p-3.5 space-y-2">
            <div class="flex items-center justify-between border-b border-swiss-200 pb-2">
              <span class="font-mono text-xs font-bold uppercase tracking-wide text-black">
                Vị trí nộp hồ sơ ({$checkoutJobs.length}):
              </span>
              <span class="font-mono text-[10px] uppercase font-bold text-signal-emerald">
                LỆ PHÍ: 0 VNĐ
              </span>
            </div>
            <div class="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {#each $checkoutJobs as job}
                <div class="flex items-center justify-between text-xs font-mono py-1 border-b border-swiss-100 last:border-b-0">
                  <div class="font-bold text-black truncate mr-2">
                    • {job.title} <span class="text-swiss-400 font-normal">({job.company})</span>
                  </div>
                  <span class="font-bold text-signal-emerald shrink-0">{job.salary}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Section 1: Candidate Information -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 border-b border-black pb-1.5">
              <span class="font-mono text-xs font-black text-black">01 //</span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-black">
                Thông tin ứng viên sinh viên
              </h3>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label for="checkout-name" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  id="checkout-name"
                  bind:value={fullName}
                  required
                  placeholder="Nguyễn Văn A"
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label for="checkout-email" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Email sinh viên *</label>
                <input
                  type="email"
                  id="checkout-email"
                  bind:value={email}
                  required
                  placeholder="sinhvien@gmail.com"
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label for="checkout-phone" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Số điện thoại / Zalo *</label>
                <input
                  type="tel"
                  id="checkout-phone"
                  bind:value={phone}
                  required
                  placeholder="0912 345 678"
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label for="checkout-university" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
                  Trường ĐH / Cao đẳng (Bộ GD&ĐT)
                </label>
                <UniversitySelect
                  id="checkout-university"
                  bind:value={university}
                  placeholder="Tìm hoặc chọn từ 327 trường ĐH / CĐ..."
                />
              </div>

              <div>
                <label for="checkout-academic-year" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Đối tượng sinh viên</label>
                <select
                  id="checkout-academic-year"
                  bind:value={academicYear}
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="Năm 1">Sinh viên Năm 1 (Part-time)</option>
                  <option value="Năm 2">Sinh viên Năm 2 (Part-time)</option>
                  <option value="Năm 3">Sinh viên Năm 3 (Thực tập)</option>
                  <option value="Năm 4">Sinh viên Năm 4 (Thực tập / Đồ án)</option>
                  <option value="Mới tốt nghiệp">Mới tốt nghiệp (Fresher)</option>
                </select>
              </div>

              <div>
                <label for="checkout-cv" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Link CV / Portfolio</label>
                <input
                  type="text"
                  id="checkout-cv"
                  bind:value={cvLink}
                  placeholder="https://github.com/..."
                  class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <!-- Attached CV file row -->
            {#if $currentUser?.cvFile}
              <div class="rounded-swiss-sm border border-black bg-swiss-50 p-2.5 flex items-center justify-between text-xs font-mono">
                <div class="flex items-center gap-2 truncate">
                  <span class="bg-black text-white px-1.5 py-0.5 rounded-swiss-sm text-[10px] font-bold">PDF</span>
                  <span class="font-bold text-black truncate">{$currentUser.cvFile.name}</span>
                  <span class="text-signal-emerald text-[10px]">[ĐÍNH KÈM TỰ ĐỘNG]</span>
                </div>
                <button
                  type="button"
                  onclick={() => openAuthModal('profile')}
                  class="text-[10px] uppercase font-bold text-black hover:underline shrink-0 ml-2"
                >
                  Đổi file
                </button>
              </div>
            {/if}

            <div>
              <label for="checkout-note" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">Ghi chú lịch rảnh & kỹ năng</label>
              <textarea
                id="checkout-note"
                bind:value={note}
                rows="2"
                placeholder="Ví dụ: Em có thể làm ca sáng hoặc chiều thứ 3, 5, 7..."
                class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              ></textarea>
            </div>
          </div>

          <!-- Section 2: Payment / Support Mode -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 border-b border-black pb-1.5">
              <span class="font-mono text-xs font-black text-black">02 //</span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-black">
                Phương thức hồ sơ & Xác nhận thử nghiệm
              </h3>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <!-- Free 0đ option -->
              <label class="relative flex cursor-pointer rounded-swiss-sm border p-3.5 transition-all
                {paymentMethod === 'free'
                  ? 'border-black bg-black text-white'
                  : 'border-swiss-300 bg-white text-black hover:border-black'}">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="free"
                  bind:group={paymentMethod}
                  class="sr-only"
                />
                <div class="flex flex-col w-full">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-tight">Ứng tuyển tiêu chuẩn</span>
                    <span class="font-mono text-xs font-black {paymentMethod === 'free' ? 'text-signal-emerald' : 'text-signal-emerald'}">0 VNĐ</span>
                  </div>
                  <p class="mt-1 font-mono text-[10px] {paymentMethod === 'free' ? 'text-swiss-300' : 'text-swiss-500'} leading-relaxed">
                    Hồ sơ được gửi trực tiếp đến phòng nhân sự doanh nghiệp đã xác thực.
                  </p>
                </div>
              </label>

              <!-- QR Support Mockup option -->
              <label class="relative flex cursor-pointer rounded-swiss-sm border p-3.5 transition-all
                {paymentMethod === 'qr_support'
                  ? 'border-black bg-black text-white'
                  : 'border-swiss-300 bg-white text-black hover:border-black'}">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="qr_support"
                  bind:group={paymentMethod}
                  class="sr-only"
                />
                <div class="flex flex-col w-full">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase tracking-tight">Gói đồng hành VIP</span>
                    <span class="font-mono text-xs font-black {paymentMethod === 'qr_support' ? 'text-signal-amber' : 'text-signal-amber'}">QUÉT QR 0Đ</span>
                  </div>
                  <p class="mt-1 font-mono text-[10px] {paymentMethod === 'qr_support' ? 'text-swiss-300' : 'text-swiss-500'} leading-relaxed">
                    Mô phỏng hỗ trợ CV sửa lỗi & xếp lịch phỏng vấn ưu tiên.
                  </p>
                </div>
              </label>
            </div>

            <!-- QR Code Simulation Box if selected -->
            {#if paymentMethod === 'qr_support'}
              <div class="rounded-swiss-sm border border-black bg-swiss-50 p-4">
                <div class="flex flex-col sm:flex-row items-center gap-4">
                  <!-- Minimalist QR Code Box -->
                  <div class="flex flex-col items-center justify-center p-2.5 bg-white border border-black rounded-swiss-sm shrink-0">
                    <div class="w-24 h-24 bg-black p-1.5 rounded-swiss-sm flex flex-col justify-between">
                      <div class="flex justify-between">
                        <div class="w-6 h-6 bg-white border-2 border-black"></div>
                        <div class="w-6 h-6 bg-white border-2 border-black"></div>
                      </div>
                      <div class="text-center font-mono text-[8px] font-bold text-white tracking-widest">
                        TOPSIVI
                      </div>
                      <div class="flex justify-between">
                        <div class="w-6 h-6 bg-white border-2 border-black"></div>
                        <div class="w-3 h-3 bg-white"></div>
                      </div>
                    </div>
                    <span class="font-mono text-[9px] uppercase font-bold text-black mt-1">VIETQR MOCK</span>
                  </div>

                  <!-- Bank Info Monospace -->
                  <div class="space-y-1 font-mono text-xs text-swiss-800 flex-1">
                    <div class="font-bold text-black uppercase tracking-wide">THÔNG TIN MÔ PHỎNG CHUYỂN KHOẢN:</div>
                    <div>• NGÂN HÀNG: <strong class="text-black">MB BANK (QUÂN ĐỘI)</strong></div>
                    <div>• SỐ TÀI KHOẢN: <strong class="text-black font-black">8888 6868 9999</strong></div>
                    <div>• CHỦ TÀI KHOẢN: <strong class="text-black">TOPSIVI STARTUP VIETNAM</strong></div>
                    <div>• SỐ TIỀN THỬ: <strong class="text-signal-emerald">0 VNĐ</strong> (DEMO ĐỒ ÁN)</div>
                    <div>• NỘI DUNG: <strong class="text-black">TSV UNG TUYEN {fullName.slice(0, 10).toUpperCase()}</strong></div>
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Submit Buttons -->
          <div class="pt-3 border-t border-black flex items-center justify-end gap-3">
            <button
              type="button"
              onclick={handleClose}
              class="rounded-swiss-sm px-4 py-2 font-mono text-xs font-bold uppercase text-swiss-600 hover:text-black transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              class="inline-flex items-center gap-2 rounded-swiss-sm bg-black px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {#if isSubmitting}
                <span>Đang xử lý hồ sơ...</span>
              {:else}
                <span>Xác nhận gửi hồ sơ →</span>
              {/if}
            </button>
          </div>
        </form>
      {:else}
        <!-- STEP 2: SUCCESS COMPLETE SCREEN (Swiss Style) -->
        <div class="p-8 text-center space-y-6">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-swiss-sm bg-black text-white font-mono text-xl font-bold">
            ✓
          </div>

          <div>
            <span class="inline-block font-mono text-xs font-black uppercase tracking-wider border border-black bg-swiss-100 px-3 py-1 rounded-swiss-sm mb-2">
              MÃ HỒ SƠ: {applicationCode}
            </span>
            <h3 class="text-xl font-black uppercase tracking-tight text-black">
              Hồ sơ đã được gửi thành công
            </h3>
            <p class="mt-2 font-mono text-xs text-swiss-600 max-w-md mx-auto leading-relaxed">
              Ứng viên <strong>{fullName}</strong> đã hoàn tất nộp hồ sơ. Nhà tuyển dụng sẽ phản hồi qua email đăng ký.
            </p>
          </div>

          <!-- Summary card (Swiss Table) -->
          <div class="rounded-swiss-sm border border-black bg-swiss-50 p-4 text-left max-w-md mx-auto space-y-2 font-mono text-xs text-swiss-800">
            <div class="flex justify-between border-b border-swiss-200 pb-1.5">
              <span class="text-swiss-500 uppercase">Ứng viên:</span>
              <span class="font-bold text-black">{fullName} ({academicYear})</span>
            </div>
            <div class="flex justify-between border-b border-swiss-200 pb-1.5">
              <span class="text-swiss-500 uppercase">Email nhận kết quả:</span>
              <span class="font-bold text-black">{email}</span>
            </div>
            <div class="flex justify-between border-b border-swiss-200 pb-1.5">
              <span class="text-swiss-500 uppercase">File CV đính kèm:</span>
              <span class="font-bold text-signal-emerald">{$currentUser?.cvFile?.name || 'CV TRỰC TUYẾN'}</span>
            </div>
            <div class="flex justify-between border-b border-swiss-200 pb-1.5">
              <span class="text-swiss-500 uppercase">Số lượng vị trí:</span>
              <span class="font-bold text-black">{$checkoutJobs.length} vị trí</span>
            </div>
            <div class="flex justify-between">
              <span class="text-swiss-500 uppercase">Phản hồi dự kiến:</span>
              <span class="font-bold text-signal-emerald">24 – 48 GIỜ</span>
            </div>
          </div>

          <button
            type="button"
            onclick={handleClose}
            class="rounded-swiss-sm bg-black px-8 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
          >
            Hoàn tất & Tiếp tục khám phá việc làm
          </button>
        </div>
      {/if}
</Modal>
