<script lang="ts">
  import {
    isBookingModalOpen,
    selectedBookingService,
    closeBookingModal
  } from '../stores/services';
  import { currentUser } from '../stores/auth';
  import { showToast } from '../stores/toast';
  import { formatCurrency, isValidVietnamesePhone } from '../utils/formatters';
  import Modal from './Modal.svelte';

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
    if (!fullName.trim()) {
      showToast('Vui lòng nhập họ và tên của bạn!', 'remove');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ!', 'remove');
      return;
    }
    if (!isValidVietnamesePhone(phone)) {
      showToast('Số điện thoại không đúng định dạng di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)!', 'remove');
      return;
    }

    isSubmitting = true;
    setTimeout(() => {
      isSubmitting = false;
      closeBookingModal();
      showToast('Đăng ký thành công! Đội ngũ TopSiVi sẽ liên hệ qua Zalo/Email trong 15 phút.', 'success');
    }, 400);
  }
</script>

<Modal
  isOpen={$isBookingModalOpen}
  onClose={closeBookingModal}
  title="XÁC NHẬN & THANH TOÁN DỊCH VỤ"
  subtitle="Thanh toán mô phỏng • Đồ án tốt nghiệp TopSiVi"
  iconText="04"
  maxWidth="2xl"
>
  {#if $selectedBookingService}
    <form onsubmit={handleSubmit} class="space-y-5">
      <!-- Service Summary Box -->
      <div class="rounded-xl border-[2.5px] border-black bg-swiss-50 p-4 shadow-[3px_3px_0px_0px_#000]">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-black/15 pb-2.5 mb-2.5">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-black bg-white">
              {$selectedBookingService.badge}
            </span>
            <span class="font-mono text-xs text-swiss-600">
              ⏱ {$selectedBookingService.duration}
            </span>
          </div>

          <div class="text-right">
            <span class="font-mono text-lg font-black text-black">
              {formatCurrency($selectedBookingService.price)}
            </span>
          </div>
        </div>

        <h4 class="text-sm font-black uppercase text-black">
          {$selectedBookingService.title}
        </h4>
        <p class="text-xs text-swiss-600 font-sans mt-1">
          {$selectedBookingService.description}
        </p>
      </div>

      <!-- User Information Form -->
      <div class="space-y-3.5 border-t border-swiss-200 pt-3">
        <span class="font-mono text-[11px] font-black uppercase tracking-wider text-black block">
          [ 01 // THÔNG TIN NGƯỜI ĐẶT DỊCH VỤ ]
        </span>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="booking-fullname" class="block font-mono text-xs font-bold uppercase text-black mb-1">
              Họ và tên *
            </label>
            <input
              id="booking-fullname"
              type="text"
              required
              bind:value={fullName}
              placeholder="Nguyễn Văn A"
              class="w-full rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-medium text-black placeholder-swiss-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label for="booking-phone" class="block font-mono text-xs font-bold uppercase text-black mb-1">
              Số điện thoại / Zalo (10 số di động) *
            </label>
            <input
              id="booking-phone"
              type="tel"
              required
              maxlength="12"
              bind:value={phone}
              placeholder="0987 654 321"
              class="w-full rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-medium text-black placeholder-swiss-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label for="booking-email" class="block font-mono text-xs font-bold uppercase text-black mb-1">
            Email nhận kết quả / lịch hẹn *
          </label>
          <input
            id="booking-email"
            type="email"
            required
            bind:value={email}
            placeholder="sinhvien@daihoc.edu.vn"
            class="w-full rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-medium text-black placeholder-swiss-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label for="booking-note" class="block font-mono text-xs font-bold uppercase text-black mb-1">
            Ghi chú thêm (Link CV, ngành học hoặc khung giờ rảnh)
          </label>
          <textarea
            id="booking-note"
            rows="2"
            bind:value={note}
            placeholder="Ví dụ: Cần chấm điểm CV nộp thực tập Frontend tuần tới / Khung giờ rảnh: Tối thứ 7..."
            class="w-full rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-medium text-black placeholder-swiss-400 focus:outline-none focus:ring-2 focus:ring-black resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Test Payment Method Selector -->
      <div class="space-y-3 border-t border-swiss-200 pt-3">
        <div class="flex items-center justify-between">
          <span class="font-mono text-[11px] font-black uppercase tracking-wider text-black">
            [ 02 // PHƯƠNG THỨC THANH TOÁN THỬ NGHIỆM ]
          </span>
          <span class="font-mono text-[10px] bg-amber-100 text-amber-900 border border-amber-400 px-1.5 py-0.5 rounded font-bold">
            DEMO KHÔNG MẤT PHÍ
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Option 1: QR Simulation -->
          <label
            class="relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all {paymentMethod === 'qr' ? 'border-black bg-swiss-50 shadow-[3px_3px_0px_0px_#000]' : 'border-swiss-300 hover:border-black'}"
          >
            <div class="flex items-center gap-2 mb-1">
              <input
                type="radio"
                name="payment"
                value="qr"
                bind:group={paymentMethod}
                class="accent-black h-4 w-4"
              />
              <span class="font-mono text-xs font-bold text-black uppercase">
                Chuyển khoản QR (Mô phỏng)
              </span>
            </div>
            <span class="text-[11px] text-swiss-600 pl-6">
              Mã QR giả lập tự động xác thực ngay lập tức.
            </span>
          </label>

          <!-- Option 2: Postpaid -->
          <label
            class="relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-all {paymentMethod === 'postpaid' ? 'border-black bg-swiss-50 shadow-[3px_3px_0px_0px_#000]' : 'border-swiss-300 hover:border-black'}"
          >
            <div class="flex items-center gap-2 mb-1">
              <input
                type="radio"
                name="payment"
                value="postpaid"
                bind:group={paymentMethod}
                class="accent-black h-4 w-4"
              />
              <span class="font-mono text-xs font-bold text-black uppercase">
                Thanh toán sau khi hoàn tất
              </span>
            </div>
            <span class="text-[11px] text-swiss-600 pl-6">
              0đ trước • Thanh toán sau khi nhận dịch vụ.
            </span>
          </label>
        </div>

        <!-- Simulated QR Box when QR is selected -->
        {#if paymentMethod === 'qr'}
          <div class="rounded-lg border-2 border-dashed border-black bg-white p-3.5 flex flex-col sm:flex-row items-center gap-4">
            <!-- Simulated QR Canvas/Graphic -->
            <div class="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded border-2 border-black bg-swiss-50 p-1 font-mono text-[9px] text-center shadow-xs">
              <div class="grid grid-cols-4 gap-1 p-1 bg-black text-white w-full h-full rounded items-center justify-center">
                <span class="h-2 w-2 bg-white"></span>
                <span class="h-2 w-2 bg-black"></span>
                <span class="h-2 w-2 bg-white"></span>
                <span class="h-2 w-2 bg-white"></span>
                <span class="h-2 w-2 bg-black"></span>
                <span class="h-2 w-2 bg-white"></span>
                <span class="h-2 w-2 bg-black"></span>
                <span class="h-2 w-2 bg-white"></span>
                <span class="h-2 w-2 bg-white"></span>
                <span class="h-2 w-2 bg-white"></span>
                <span class="h-2 w-2 bg-black"></span>
                <span class="h-2 w-2 bg-white"></span>
              </div>
              <span class="font-bold mt-0.5 text-black">VIETQR DEMO</span>
            </div>

            <div class="font-mono text-xs space-y-1 text-swiss-800">
              <div class="flex items-center gap-2">
                <span class="text-swiss-500 uppercase text-[10px]">NGÂN HÀNG:</span>
                <span class="font-bold text-black">VIETINBANK (MÔ PHỎNG)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-swiss-500 uppercase text-[10px]">SỐ TIỀN:</span>
                <span class="font-black text-signal-emerald text-sm">{formatCurrency($selectedBookingService.price)}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-swiss-500 uppercase text-[10px]">NỘI DUNG:</span>
                <span class="font-bold text-black bg-swiss-100 px-1 rounded">TSV-{$selectedBookingService.id.toUpperCase()}-{(phone || 'TEST').slice(-4)}</span>
              </div>
              <p class="text-[10px] text-swiss-500 font-sans italic pt-0.5">
                * Đây là giao dịch giả lập đồ án, bạn chỉ cần bấm "Xác nhận đặt lịch" bên dưới.
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 border-t border-swiss-200 pt-4">
        <button
          type="button"
          onclick={closeBookingModal}
          class="rounded-lg border-2 border-swiss-300 bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black hover:border-black transition-colors"
        >
          Hủy bỏ
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          class="rounded-lg border-2 border-black bg-black px-6 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-all shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] disabled:opacity-50"
        >
          {isSubmitting ? 'Đang xác nhận...' : 'Xác nhận đặt lịch →'}
        </button>
      </div>
    </form>
  {/if}
</Modal>
