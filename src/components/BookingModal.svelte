<script lang="ts">
  import {
    isBookingModalOpen,
    selectedBookingService,
    closeBookingModal,
  } from '../stores/services';
  import { currentUser, openAuthModal } from '../stores/auth';
  import { showToast } from '../stores/toast';
  import { formatCurrency, isValidVietnamesePhone } from '../utils/formatters';
  import { url } from '../utils/url';
  import Modal from './Modal.svelte';

  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const qrImageUrl = `${baseUrl}vietqr-demo.png`;

  let fullName = $state('');
  let email = $state('');
  let phone = $state('');
  let note = $state('');
  let paymentMethod = $state<'qr' | 'postpaid'>('qr');
  let isSubmitting = $state(false);

  // Auto fill user details when modal opens
  $effect(() => {
    if ($isBookingModalOpen) {
      if ($currentUser) {
        fullName = $currentUser.fullName || '';
        email = $currentUser.email || '';
        phone = $currentUser.phone || '';
      } else {
        fullName = '';
        email = '';
        phone = '';
      }
      note = '';
      paymentMethod = 'qr';
      isSubmitting = false;
    }
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!$currentUser) {
      showToast('Vui lòng đăng nhập để hoàn tất đặt dịch vụ!', 'remove');
      closeBookingModal();
      openAuthModal('login');
      return;
    }
    if (!fullName.trim()) {
      showToast('Vui lòng nhập họ và tên của bạn!', 'remove');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ!', 'remove');
      return;
    }
    if (!isValidVietnamesePhone(phone)) {
      showToast(
        'Số điện thoại không đúng định dạng di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)!',
        'remove'
      );
      return;
    }

    isSubmitting = true;
    setTimeout(() => {
      isSubmitting = false;
      closeBookingModal();
      showToast(
        'Đăng ký thành công! Đội ngũ TopSiVi sẽ liên hệ qua Zalo/Email trong 15 phút.',
        'success'
      );
    }, 400);
  }
</script>

<Modal
  isOpen={$isBookingModalOpen}
  onClose={closeBookingModal}
  hideHeader={true}
  maxWidth="2xl"
  dialogClass="rounded-3xl border-2 border-obsidian-900 bg-alabaster-50 shadow-[0_24px_60px_rgba(14,20,18,0.22)] max-h-[90vh] flex flex-col !my-0"
  bodyClass="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
  ariaLabel="Xác nhận và thanh toán dịch vụ"
>
  <!-- Pinned Branded Organic Header -->
  <div
    class="relative shrink-0 overflow-hidden border-b border-obsidian-900/10 bg-alabaster-100/90 bg-organic-dots-light px-5 sm:px-6 pt-4 pb-4"
  >
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
        onclick={closeBookingModal}
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-obsidian-900/15 bg-alabaster-50 text-obsidian-800 transition-all duration-150 hover:border-obsidian-900 hover:bg-obsidian-900 hover:text-mint cursor-pointer"
        aria-label="Đóng"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="relative z-10 mt-3">
      <h2 class="font-display text-xl font-extrabold tracking-tight text-obsidian-900">
        Xác nhận & thanh toán dịch vụ
      </h2>
      <p class="mt-0.5 text-xs text-obsidian-600">
        Thanh toán mô phỏng • Đồ án tốt nghiệp TopSiVi
      </p>
    </div>
  </div>

  {#if $selectedBookingService}
    <form onsubmit={handleSubmit} class="flex flex-col flex-1 min-h-0 overflow-hidden">
      <!-- Scrollable Body -->
      <div class="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 bg-alabaster-50">
        <!-- Service Summary Card -->
        <div class="rounded-2xl border border-mint-500/35 bg-mint/15 p-4 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full border border-obsidian-900/10 bg-alabaster-50 px-2.5 py-0.5 font-display text-[11px] font-bold text-obsidian-900">
                <span class="h-1.5 w-1.5 rounded-full bg-mint-500"></span>
                <span>{$selectedBookingService.badge}</span>
              </span>
              <span class="inline-flex items-center gap-1 rounded-full border border-obsidian-900/10 bg-alabaster-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-obsidian-700">
                <svg class="h-3 w-3 text-mint-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{$selectedBookingService.duration}</span>
              </span>
            </div>

            <span class="font-display text-xl sm:text-2xl font-extrabold text-obsidian-900 tracking-tight">
              {formatCurrency($selectedBookingService.price)}
            </span>
          </div>

          <div>
            <h4 class="font-display text-sm sm:text-base font-extrabold text-obsidian-900 leading-snug">
              {$selectedBookingService.title}
            </h4>
            <p class="text-xs text-obsidian-600 mt-1 leading-relaxed">
              {$selectedBookingService.description}
            </p>
          </div>
        </div>

        <!-- Section 1: User Information -->
        <div class="space-y-3.5">
          <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2">
            <span class="h-2 w-2 rounded-full bg-mint-500"></span>
            <h3 class="font-display text-sm font-extrabold text-obsidian-900">
              Thông tin người đặt dịch vụ
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label for="booking-fullname" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                Họ và tên <span class="text-signal-crimson">*</span>
              </label>
              <input
                id="booking-fullname"
                type="text"
                required
                bind:value={fullName}
                placeholder="Nguyễn Văn A"
                class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
              />
            </div>

            <div>
              <label for="booking-phone" class="block text-xs font-bold text-obsidian-800 mb-1.5">
                Số điện thoại / Zalo (10 số) <span class="text-signal-crimson">*</span>
              </label>
              <input
                id="booking-phone"
                type="tel"
                required
                maxlength="12"
                bind:value={phone}
                placeholder="0987 654 321"
                class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label for="booking-email" class="block text-xs font-bold text-obsidian-800 mb-1.5">
              Email nhận kết quả / lịch hẹn <span class="text-signal-crimson">*</span>
            </label>
            <input
              id="booking-email"
              type="email"
              required
              bind:value={email}
              placeholder="sinhvien@daihoc.edu.vn"
              class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
            />
          </div>

          <div>
            <label for="booking-note" class="block text-xs font-bold text-obsidian-800 mb-1.5">
              Ghi chú thêm (Link CV, ngành học hoặc khung giờ rảnh)
            </label>
            <textarea
              id="booking-note"
              rows="2"
              bind:value={note}
              placeholder="Ví dụ: Cần chấm điểm CV nộp thực tập Frontend tuần tới / Khung giờ rảnh: Tối thứ 7..."
              class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-100/60 px-3.5 py-2.5 text-xs font-medium text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Section 2: Payment Method Selector -->
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-mint-500"></span>
              <h3 class="font-display text-sm font-extrabold text-obsidian-900">
                Phương thức thanh toán thử nghiệm
              </h3>
            </div>
            <span class="rounded-full bg-amber-100/80 border border-amber-300/70 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-900">
              Demo không mất phí
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Option 1: QR Simulation -->
            <label
              class="relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all
              {paymentMethod === 'qr'
                ? 'border-2 border-mint-500 bg-mint/15 shadow-sm'
                : 'border-obsidian-900/15 bg-alabaster-50 hover:border-obsidian-900/40 hover:bg-alabaster-100/60'}"
            >
              <input
                type="radio"
                name="payment"
                value="qr"
                bind:group={paymentMethod}
                class="sr-only"
              />
              <span
                class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors
                {paymentMethod === 'qr'
                  ? 'border-mint-500 bg-mint-500 text-alabaster-50'
                  : 'border-obsidian-900/30 bg-alabaster-50 text-transparent'}"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
              </span>
              <div>
                <span class="font-display text-xs sm:text-[13px] font-extrabold text-obsidian-900 block">
                  Chuyển khoản QR (Mô phỏng)
                </span>
                <span class="mt-1 text-[11px] text-obsidian-600 block leading-relaxed">
                  Mã QR giả lập tự động xác thực ngay lập tức.
                </span>
              </div>
            </label>

            <!-- Option 2: Postpaid -->
            <label
              class="relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all
              {paymentMethod === 'postpaid'
                ? 'border-2 border-mint-500 bg-mint/15 shadow-sm'
                : 'border-obsidian-900/15 bg-alabaster-50 hover:border-obsidian-900/40 hover:bg-alabaster-100/60'}"
            >
              <input
                type="radio"
                name="payment"
                value="postpaid"
                bind:group={paymentMethod}
                class="sr-only"
              />
              <span
                class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors
                {paymentMethod === 'postpaid'
                  ? 'border-mint-500 bg-mint-500 text-alabaster-50'
                  : 'border-obsidian-900/30 bg-alabaster-50 text-transparent'}"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
              </span>
              <div>
                <span class="font-display text-xs sm:text-[13px] font-extrabold text-obsidian-900 block">
                  Thanh toán sau khi hoàn tất
                </span>
                <span class="mt-1 text-[11px] text-obsidian-600 block leading-relaxed">
                  0đ trước • Thanh toán sau khi nhận dịch vụ.
                </span>
              </div>
            </label>
          </div>

          <!-- Simulated QR Box when QR is selected -->
          {#if paymentMethod === 'qr'}
            <div class="rounded-2xl border border-dashed border-obsidian-900/25 bg-alabaster-100/75 p-4 flex flex-col sm:flex-row items-center gap-4">
              <!-- VietQR Code Image -->
              <div class="flex flex-col items-center justify-center rounded-xl border border-obsidian-900/15 bg-alabaster-50 p-2.5 shrink-0">
                <img
                  src={qrImageUrl}
                  alt="VietQR Demo"
                  class="h-24 w-24 sm:h-28 sm:w-28 object-contain"
                  loading="eager"
                />
                <span class="font-mono text-[10px] font-bold mt-1 text-obsidian-700">VIETQR DEMO</span>
              </div>

              <div class="text-xs space-y-1.5 text-obsidian-700 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-obsidian-600">Ngân hàng:</span>
                  <strong class="text-obsidian-900">VietinBank (Mô phỏng)</strong>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-obsidian-600">Số tiền:</span>
                  <strong class="font-mono text-sm font-extrabold text-mint-700">
                    {formatCurrency($selectedBookingService.price)}
                  </strong>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-obsidian-600">Nội dung:</span>
                  <span class="rounded-lg border border-obsidian-900/10 bg-alabaster-50 px-2 py-0.5 font-mono text-[11px] font-bold text-obsidian-900">
                    TSV-{$selectedBookingService.id.toUpperCase()}-{(phone || 'TEST').slice(-4)}
                  </span>
                </div>
                <p class="text-[11px] text-obsidian-600 italic pt-0.5">
                  * Đây là giao dịch giả lập đồ án, bạn chỉ cần bấm "Xác nhận đặt lịch" bên dưới.
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Pinned Action Footer -->
      <div class="shrink-0 border-t border-obsidian-900/10 bg-alabaster-100/90 px-5 sm:px-6 py-3.5 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onclick={closeBookingModal}
          class="rounded-full px-4 py-2 font-display text-xs font-bold text-obsidian-600 hover:text-obsidian-900 hover:bg-alabaster-200/70 transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          class="inline-flex items-center gap-2 rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 transition-all duration-150 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <span>{isSubmitting ? 'Đang xác nhận...' : 'Xác nhận đặt lịch →'}</span>
        </button>
      </div>
    </form>
  {/if}
</Modal>
