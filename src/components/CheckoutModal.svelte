<script lang="ts">
  import {
    isCheckoutOpen,
    closeCheckout,
    checkoutJobs,
  } from '../stores/favorites';
  import {
    currentUser,
    recordApplication,
    getUserCVs,
    uploadCVFile,
  } from '../stores/auth';
  import { showToast } from '../stores/toast';
  import { isValidVietnamesePhone } from '../utils/formatters';
  import { url } from '../utils/url';
  import UniversitySelect from './UniversitySelect.svelte';
  import Modal from './Modal.svelte';

  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const qrImageUrl = `${baseUrl}vietqr-demo.png`;

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

  // Multi-CV Vault selection & inline upload
  let userCVs = $derived(getUserCVs($currentUser));
  let selectedCvId = $state<string>('');
  let selectedCv = $derived(userCVs.find((c) => c.id === selectedCvId) || null);
  let newCvLabel = $state('');
  let isUploadingCv = $state(false);
  let hasUserDeselectedCv = $state(false);
  let submittedCvName = $state('');

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
      university = $currentUser.university || '';
      academicYear = $currentUser.academicYear || 'Năm 1';
      major = $currentUser.major || '';
      cvLink = $currentUser.portfolioLink || '';
      if ($currentUser.bio) {
        note = $currentUser.bio;
      }
    }
  });

  // Auto-select default CV from user's vault unless explicitly deselected
  $effect(() => {
    if ($isCheckoutOpen && userCVs.length > 0 && !hasUserDeselectedCv) {
      if (!selectedCvId || !userCVs.some((c) => c.id === selectedCvId)) {
        selectedCvId = userCVs[0].id || '';
      }
    }
  });

  async function handleCheckoutCVUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    isUploadingCv = true;
    const uploaded = await uploadCVFile(file, newCvLabel);
    if (uploaded?.id) {
      hasUserDeselectedCv = false;
      selectedCvId = uploaded.id;
    }
    newCvLabel = '';
    input.value = '';
    isUploadingCv = false;
  }

  function getFileExt(name: string): string {
    const ext = name.split('.').pop()?.toUpperCase();
    return ext && ext.length <= 5 ? ext : 'FILE';
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function generateAppCode() {
    return 'TSV-' + Math.floor(1000 + Math.random() * 9000);
  }

  function handleClose() {
    step = 'form';
    hasUserDeselectedCv = false;
    newCvLabel = '';
    selectedCvId = '';
    closeCheckout();
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!isValidVietnamesePhone(phone)) {
      showToast(
        'Số điện thoại không đúng chuẩn di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)!',
        'remove'
      );
      return;
    }

    const chosenCvName = selectedCv
      ? selectedCv.label
        ? `${selectedCv.label} (${selectedCv.name})`
        : selectedCv.name
      : cvLink.trim()
        ? `Link: ${cvLink.trim()}`
        : $currentUser?.fullName
          ? `Hồ sơ ${$currentUser.fullName}`
          : 'Hồ sơ trực tuyến';
    submittedCvName = chosenCvName;

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
        cvId: selectedCv?.id,
        cvName: chosenCvName,
        note: note.trim() || undefined,
      });
    }, 500);
  }
</script>

<Modal
  isOpen={$isCheckoutOpen && $currentUser?.role !== 'company'}
  onClose={handleClose}
  hideHeader={true}
  maxWidth="2xl"
  dialogClass="rounded-3xl border-2 border-obsidian-900 bg-alabaster-50 shadow-[0_24px_60px_rgba(14,20,18,0.22)] max-h-[90vh] flex flex-col !my-0"
  bodyClass="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
  ariaLabel={step === 'form' ? 'Xác nhận hồ sơ ứng tuyển' : 'Hồ sơ đã gửi thành công'}
>
  <!-- Pinned Branded Organic Header -->
  <div
    class="relative shrink-0 overflow-hidden border-b border-obsidian-900/10 bg-alabaster-100/90 bg-organic-dots-light px-5 sm:px-6 pt-4 pb-4"
  >
    <!-- Subtle ambient mint aura -->
    <div
      class="pointer-events-none absolute -top-12 right-8 h-32 w-32 rounded-full bg-mint/25 blur-2xl"
    ></div>

    <div class="relative z-10 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <img
          src={url('/favicon.svg')}
          alt="TopSiVi"
          class="h-7 w-auto object-contain"
        />
      </div>

      <button
        type="button"
        onclick={handleClose}
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-obsidian-900/15 bg-alabaster-50 text-obsidian-800 transition-all duration-150 hover:border-obsidian-900 hover:bg-obsidian-900 hover:text-mint cursor-pointer"
        aria-label="Đóng"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="relative z-10 mt-3">
      <h2 class="font-display text-xl font-extrabold tracking-tight text-obsidian-900 flex flex-wrap items-center gap-2">
        <span>{step === 'form' ? 'Xác nhận hồ sơ ứng tuyển' : 'Hồ sơ đã gửi thành công'}</span>
        {#if step === 'form' && $checkoutJobs.length > 0}
          <span class="inline-flex items-center justify-center rounded-full bg-mint px-2.5 py-0.5 font-mono text-xs font-extrabold text-obsidian-900">
            {$checkoutJobs.length} vị trí
          </span>
        {/if}
      </h2>
      <p class="mt-0.5 text-xs text-obsidian-600">
        {step === 'form'
          ? 'Quy trình chuẩn hóa • Miễn phí 100% và bảo vệ quyền lợi sinh viên.'
          : 'Mã số hồ sơ của bạn đã được hệ thống ghi nhận.'}
      </p>
    </div>
  </div>

  {#if step === 'form'}
    <!-- STEP 1: FORM WITH SCROLLABLE BODY & PINNED FOOTER -->
    <form onsubmit={handleSubmit} class="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div class="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 bg-alabaster-50">
        <!-- Jobs Summary Box -->
        <div class="rounded-2xl border border-obsidian-900/10 bg-alabaster-100/60 p-4 space-y-2.5">
          <div class="flex items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-mint-500"></span>
              <span class="font-display text-xs font-extrabold text-obsidian-900">
                Vị trí nộp hồ sơ ({$checkoutJobs.length})
              </span>
            </div>
            <span class="rounded-full bg-mint/30 border border-mint-500/30 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-obsidian-900">
              Lệ phí: 0 VNĐ
            </span>
          </div>
          <div class="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {#each $checkoutJobs as job}
              <div class="flex items-center justify-between gap-3 text-xs py-1 border-b border-obsidian-900/5 last:border-b-0">
                <div class="font-bold text-obsidian-900 truncate">
                  {job.title}
                  <span class="text-obsidian-600 font-normal">({job.company})</span>
                </div>
                <span class="font-mono text-[11px] font-extrabold text-mint-700 shrink-0">
                  {job.salary}
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Section 1: Candidate Information -->
        <div class="space-y-3.5">
          <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2">
            <span class="h-2 w-2 rounded-full bg-mint-500"></span>
            <h3 class="font-display text-sm font-extrabold text-obsidian-900">
              Thông tin ứng viên sinh viên
            </h3>
          </div>

          <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label for="checkout-name" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                Họ và tên <span class="text-signal-crimson">*</span>
              </label>
              <input
                type="text"
                id="checkout-name"
                bind:value={fullName}
                required
                placeholder="Nguyễn Văn A"
                class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
              />
            </div>

            <div>
              <label for="checkout-email" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                Email sinh viên <span class="text-signal-crimson">*</span>
              </label>
              <input
                type="email"
                id="checkout-email"
                bind:value={email}
                required
                placeholder="sinhvien@gmail.com"
                class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
              />
            </div>

            <div>
              <label for="checkout-phone" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                Số điện thoại / Zalo (10 số) <span class="text-signal-crimson">*</span>
              </label>
              <input
                type="tel"
                id="checkout-phone"
                bind:value={phone}
                required
                maxlength="12"
                placeholder="0912 345 678"
                class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
              />
            </div>

            <div>
              <label for="checkout-university" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                Trường ĐH / Cao đẳng
              </label>
              <UniversitySelect
                id="checkout-university"
                label=""
                bind:value={university}
                placeholder="Tìm hoặc chọn từ 327 trường ĐH / CĐ..."
              />
            </div>

            <div>
              <label for="checkout-academic-year" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                Đối tượng sinh viên
              </label>
              <select
                id="checkout-academic-year"
                bind:value={academicYear}
                class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
              >
                <option value="Năm 1">Sinh viên Năm 1 (Part-time)</option>
                <option value="Năm 2">Sinh viên Năm 2 (Part-time)</option>
                <option value="Năm 3">Sinh viên Năm 3 (Thực tập)</option>
                <option value="Năm 4">Sinh viên Năm 4 (Thực tập / Đồ án)</option>
                <option value="Mới tốt nghiệp">Mới tốt nghiệp (Fresher)</option>
              </select>
            </div>

            <div>
              <label for="checkout-cv" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                Link CV / Portfolio
              </label>
              <input
                type="text"
                id="checkout-cv"
                bind:value={cvLink}
                placeholder="https://github.com/..."
                class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
              />
            </div>
          </div>

          <!-- Multi-CV Picker + Inline Upload to CV Vault -->
          {#if $currentUser}
            <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/60 p-4 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-display text-xs font-extrabold text-obsidian-900">
                  Chọn file CV ứng tuyển ({userCVs.length} file trong kho)
                </span>
                <div class="flex items-center gap-3">
                  {#if selectedCvId !== ''}
                    <button
                      type="button"
                      onclick={() => {
                        hasUserDeselectedCv = true;
                        selectedCvId = '';
                      }}
                      class="text-[11px] font-semibold text-obsidian-600 hover:text-obsidian-900 underline cursor-pointer"
                    >
                      Không đính kèm file
                    </button>
                  {/if}
                  <a
                    href={url(`/profile/@${$currentUser.username}?tab=settings`)}
                    onclick={handleClose}
                    class="text-[11px] font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-700"
                  >
                    Quản lý kho CV →
                  </a>
                </div>
              </div>

              {#if userCVs.length > 0}
                <div class="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {#each userCVs as cv, idx (cv.id)}
                    {@const isChosen = selectedCvId === cv.id}
                    <button
                      type="button"
                      onclick={() => {
                        hasUserDeselectedCv = false;
                        selectedCvId = cv.id || '';
                      }}
                      class="w-full text-left flex items-center justify-between gap-3 rounded-xl p-3 transition-all cursor-pointer
                        {isChosen
                          ? 'border-2 border-mint-500 bg-mint/15 shadow-sm'
                          : 'border border-obsidian-900/15 bg-alabaster-50 hover:border-obsidian-900/40'}"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span
                          class="font-mono text-[10px] font-bold px-2 py-1 rounded-lg shrink-0
                            {isChosen
                              ? 'bg-alabaster-50 border border-mint-500/40 text-mint-800'
                              : 'bg-alabaster-200/80 text-obsidian-700'}"
                        >
                          {getFileExt(cv.name)}
                        </span>
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-1.5">
                            <span class="text-xs font-bold text-obsidian-900 truncate">{cv.name}</span>
                            {#if cv.label}
                              <span class="rounded-full bg-alabaster-50 border border-obsidian-900/15 px-2 py-0.5 font-mono text-[10px] font-bold text-obsidian-800">
                                {cv.label}
                              </span>
                            {/if}
                            {#if idx === 0}
                              <span class="rounded-full bg-mint/40 border border-mint-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-obsidian-900">
                                Mặc định
                              </span>
                            {/if}
                          </div>
                          <span class="font-mono text-[10px] text-obsidian-600 block mt-0.5">
                            {formatFileSize(cv.size)} • {new Date(cv.uploadedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      <span
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-colors
                          {isChosen ? 'bg-mint-500 text-alabaster-50' : 'border border-obsidian-900/25 bg-alabaster-50 text-transparent'}"
                      >
                        ✓
                      </span>
                    </button>
                  {/each}
                </div>
              {:else}
                <p class="text-xs text-obsidian-600 italic">
                  Kho CV đang trống. Bạn có thể tải file CV mới ngay bên dưới để đính kèm và lưu cho các lần sau.
                </p>
              {/if}

              <!-- Inline Upload New CV & Save to Vault -->
              <div class="pt-2.5 border-t border-obsidian-900/10 space-y-2">
                <div class="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    bind:value={newCvLabel}
                    placeholder="Nhãn gợi nhớ (VD: CV Marketing...)"
                    class="flex-1 rounded-xl border border-obsidian-900/15 bg-alabaster-50 px-3 py-2 text-xs text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:outline-none focus:ring-2 focus:ring-mint/50"
                  />
                  <label
                    class="inline-flex items-center justify-center gap-1.5 rounded-full border border-obsidian-900/20 bg-alabaster-50 px-4 py-2 font-display text-xs font-bold text-obsidian-900 transition-colors shrink-0
                      {isUploadingCv ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-mint-600 hover:bg-mint/20'}"
                  >
                    <span>{isUploadingCv ? 'Đang tải lên...' : '+ Tải CV mới & lưu vào kho'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      disabled={isUploadingCv}
                      onchange={handleCheckoutCVUpload}
                      class="sr-only"
                    />
                  </label>
                </div>
                <p class="text-[11px] text-obsidian-600">
                  File tải lên sẽ được chọn cho đơn này và lưu tự động vào Kho CV của bạn.
                </p>
              </div>
            </div>
          {/if}

          <div>
            <label for="checkout-note" class="block text-xs font-bold text-obsidian-800 mb-1.5">
              Ghi chú lịch rảnh & kỹ năng
            </label>
            <textarea
              id="checkout-note"
              bind:value={note}
              rows="2"
              placeholder="Ví dụ: Em có thể làm ca sáng hoặc chiều thứ 3, 5, 7..."
              class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
            ></textarea>
          </div>
        </div>

        <!-- Section 2: Payment / Support Mode -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2">
            <span class="h-2 w-2 rounded-full bg-mint-500"></span>
            <h3 class="font-display text-sm font-extrabold text-obsidian-900">
              Phương thức hồ sơ & Xác nhận thử nghiệm
            </h3>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <!-- Free 0đ option -->
            <label
              class="relative flex cursor-pointer rounded-2xl border p-4 transition-all
              {paymentMethod === 'free'
                ? 'border-2 border-mint-500 bg-mint/15 text-obsidian-900 shadow-sm'
                : 'border-obsidian-900/15 bg-alabaster-50 text-obsidian-900 hover:border-obsidian-900/40 hover:bg-alabaster-100/60'}"
            >
              <input
                type="radio"
                name="paymentMethod"
                value="free"
                bind:group={paymentMethod}
                class="sr-only"
              />
              <div class="flex flex-col w-full">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-display text-xs sm:text-[13px] font-extrabold text-obsidian-900">
                    Ứng tuyển tiêu chuẩn
                  </span>
                  <span class="rounded-full bg-mint/35 border border-mint-500/30 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-obsidian-900 shrink-0">
                    0 VNĐ
                  </span>
                </div>
                <p class="mt-1.5 text-[11px] text-obsidian-600 leading-relaxed">
                  Hồ sơ được gửi trực tiếp đến phòng nhân sự doanh nghiệp đã xác thực.
                </p>
              </div>
            </label>

            <!-- QR Support Mockup option -->
            <label
              class="relative flex cursor-pointer rounded-2xl border p-4 transition-all
              {paymentMethod === 'qr_support'
                ? 'border-2 border-mint-500 bg-mint/15 text-obsidian-900 shadow-sm'
                : 'border-obsidian-900/15 bg-alabaster-50 text-obsidian-900 hover:border-obsidian-900/40 hover:bg-alabaster-100/60'}"
            >
              <input
                type="radio"
                name="paymentMethod"
                value="qr_support"
                bind:group={paymentMethod}
                class="sr-only"
              />
              <div class="flex flex-col w-full">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-display text-xs sm:text-[13px] font-extrabold text-obsidian-900">
                    Gói đồng hành VIP
                  </span>
                  <span class="rounded-full bg-alabaster-200/80 border border-obsidian-900/10 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-obsidian-700 shrink-0">
                    Quét QR 0đ
                  </span>
                </div>
                <p class="mt-1.5 text-[11px] text-obsidian-600 leading-relaxed">
                  Mô phỏng hỗ trợ CV sửa lỗi & xếp lịch phỏng vấn ưu tiên.
                </p>
              </div>
            </label>
          </div>

          <!-- QR Code Simulation Box if selected -->
          {#if paymentMethod === 'qr_support'}
            <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/80 p-4">
              <div class="flex flex-col sm:flex-row items-center gap-4">
                <!-- VietQR Code Image Box -->
                <div class="flex flex-col items-center justify-center p-2.5 bg-alabaster-50 border border-obsidian-900/15 rounded-xl shrink-0">
                  <img
                    src={qrImageUrl}
                    alt="VietQR Mock"
                    class="h-24 w-24 sm:h-28 sm:w-28 object-contain"
                    loading="eager"
                  />
                  <span class="font-mono text-[10px] font-bold text-obsidian-700 mt-1">VIETQR DEMO</span>
                </div>

                <!-- Bank Info -->
                <div class="space-y-1 text-xs text-obsidian-700 flex-1">
                  <div class="font-display font-extrabold text-obsidian-900 mb-1.5">
                    Thông tin mô phỏng chuyển khoản
                  </div>
                  <div>• Ngân hàng: <strong class="text-obsidian-900">MB Bank (Quân đội)</strong></div>
                  <div>• Số tài khoản: <strong class="font-mono text-obsidian-900">8888 6868 9999</strong></div>
                  <div>• Chủ tài khoản: <strong class="text-obsidian-900">TOPSIVI STARTUP VIETNAM</strong></div>
                  <div>• Số tiền thử: <strong class="font-mono text-mint-700">0 VNĐ</strong> (Demo)</div>
                  <div>• Nội dung: <strong class="font-mono text-obsidian-900">TSV UNG TUYEN {fullName.slice(0, 10).toUpperCase()}</strong></div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Pinned Submit Footer -->
      <div class="shrink-0 border-t border-obsidian-900/10 bg-alabaster-100/90 px-5 sm:px-6 py-3.5 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onclick={handleClose}
          class="rounded-full px-4 py-2 font-display text-xs font-bold text-obsidian-600 hover:text-obsidian-900 hover:bg-alabaster-200/70 transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          class="inline-flex items-center gap-2 rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 transition-all duration-150 shadow-sm disabled:opacity-50 cursor-pointer"
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
    <!-- STEP 2: SUCCESS COMPLETE SCREEN -->
    <div class="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 text-center space-y-5 bg-alabaster-50">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-mint-500 bg-mint/25 text-mint-800 text-2xl font-black shadow-sm">
        ✓
      </div>

      <div>
        <span class="inline-block rounded-full bg-mint/30 border border-mint-500/35 px-4 py-1 font-mono text-xs font-extrabold text-obsidian-900 mb-2.5">
          Mã hồ sơ: {applicationCode}
        </span>
        <h3 class="font-display text-xl font-extrabold tracking-tight text-obsidian-900">
          Hồ sơ đã được gửi thành công
        </h3>
        <p class="mt-1.5 text-xs sm:text-[13px] text-obsidian-600 max-w-md mx-auto leading-relaxed">
          Ứng viên <strong class="text-obsidian-900">{fullName}</strong> đã hoàn tất nộp hồ sơ. Nhà tuyển dụng sẽ phản hồi qua email đăng ký.
        </p>
      </div>

      <!-- Summary card -->
      <div class="rounded-2xl border border-obsidian-900/10 bg-alabaster-100/70 p-4 text-left max-w-md mx-auto space-y-2.5 text-xs text-obsidian-700">
        <div class="flex justify-between gap-3 border-b border-obsidian-900/10 pb-2">
          <span class="text-obsidian-600">Ứng viên</span>
          <span class="font-bold text-obsidian-900 text-right">{fullName} ({academicYear})</span>
        </div>
        <div class="flex justify-between gap-3 border-b border-obsidian-900/10 pb-2">
          <span class="text-obsidian-600">Email nhận kết quả</span>
          <span class="font-bold text-obsidian-900 text-right break-all">{email}</span>
        </div>
        <div class="flex justify-between gap-3 border-b border-obsidian-900/10 pb-2">
          <span class="text-obsidian-600">File CV đính kèm</span>
          <span class="font-bold text-mint-700 text-right truncate max-w-[60%]">{submittedCvName || 'CV trực tuyến'}</span>
        </div>
        <div class="flex justify-between gap-3 border-b border-obsidian-900/10 pb-2">
          <span class="text-obsidian-600">Số lượng vị trí</span>
          <span class="font-bold text-obsidian-900 text-right">{$checkoutJobs.length} vị trí</span>
        </div>
        <div class="flex justify-between gap-3">
          <span class="text-obsidian-600">Phản hồi dự kiến</span>
          <span class="font-mono font-extrabold text-mint-700 text-right">24 – 48 giờ</span>
        </div>
      </div>

      <button
        type="button"
        onclick={handleClose}
        class="rounded-full bg-obsidian-900 px-8 py-3 font-display text-xs font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 transition-all duration-150 shadow-sm cursor-pointer"
      >
        Hoàn tất & Tiếp tục khám phá việc làm
      </button>
    </div>
  {/if}
</Modal>
