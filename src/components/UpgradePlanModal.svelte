<script lang="ts">
  import {
    isUpgradeModalOpen,
    closeUpgradeModal,
    currentUser,
    getCompanyMonthlyJobStats,
    upgradePlan,
    openPostJobModal
  } from '../stores/auth';
  import { url } from '../utils/url';
  import Modal from './Modal.svelte';

  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const qrImageUrl = `${baseUrl}vietqr-demo.png`;

  let isProcessing = $state(false);
  let activeTab = $state<'plans' | 'qr'>('plans');
  let pendingTier = $state<'premium' | 'enterprise'>('premium');

  let stats = $derived(
    $currentUser ? getCompanyMonthlyJobStats($currentUser.id) : null
  );

  let currentTier = $derived($currentUser?.subscriptionTier || 'free');

  function handleSelectUpgrade(tier: 'premium' | 'enterprise') {
    pendingTier = tier;
    activeTab = 'qr';
  }

  function handleConfirmUpgrade() {
    isProcessing = true;
    setTimeout(() => {
      upgradePlan(pendingTier);
      isProcessing = false;
      activeTab = 'plans';
    }, 600);
  }

  function handleClose() {
    activeTab = 'plans';
    closeUpgradeModal();
  }
</script>

<Modal
  isOpen={$isUpgradeModalOpen}
  onClose={handleClose}
  hideHeader={true}
  maxWidth="5xl"
  dialogClass="rounded-3xl border-2 border-obsidian-900 bg-alabaster-50 shadow-[0_24px_60px_rgba(14,20,18,0.22)] max-h-[92vh] flex flex-col !my-0"
  bodyClass="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
  ariaLabel="Nâng cấp gói tuyển dụng doanh nghiệp"
>
  <!-- Pinned Branded Organic Header -->
  <div
    class="relative shrink-0 border-b border-obsidian-900/10 bg-alabaster-100/90 bg-organic-dots-light px-5 sm:px-6 py-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <img
          src={url('/favicon.svg')}
          alt="TopSiVi"
          class="h-7 w-auto object-contain shrink-0"
        />
        <span class="hidden sm:inline-block h-6 w-px bg-obsidian-900/15"></span>
        <div class="min-w-0">
          <h2 class="font-display text-lg sm:text-xl font-extrabold tracking-tight text-obsidian-900 truncate">
            Gói dịch vụ tuyển dụng Doanh nghiệp
          </h2>
          <p class="text-[11px] sm:text-xs text-obsidian-600 truncate">
            Mở rộng giới hạn đăng tin tuyển dụng sinh viên & tiếp cận nhân tài
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2.5 ml-auto">
        {#if $currentUser && stats}
          <div class="hidden md:flex items-center gap-2 rounded-full border border-obsidian-900/15 bg-alabaster-50 px-3 py-1 text-xs">
            <span class="h-2 w-2 rounded-full bg-mint-500 shrink-0"></span>
            <span class="text-obsidian-600 font-medium">
              {stats.tier === 'enterprise' ? 'Enterprise' : stats.tier === 'premium' ? 'Premium' : 'Gói Free'}:
            </span>
            <span class="font-mono font-extrabold text-obsidian-900">
              {stats.usedCount}/{stats.maxPosts === Infinity ? '∞' : stats.maxPosts} bài
            </span>
            {#if stats.isLimitReached}
              <span class="rounded-full bg-signal-crimson/15 px-2 py-0.5 font-mono text-[10px] font-bold text-signal-crimson">
                Hết lượt
              </span>
            {/if}
          </div>
        {/if}

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
    </div>

    <!-- Mobile Quota Strip -->
    {#if $currentUser && stats}
      <div class="mt-3 flex md:hidden items-center justify-between gap-2 rounded-xl border border-obsidian-900/10 bg-alabaster-50 px-3 py-1.5 text-xs">
        <span class="text-obsidian-700 font-medium">
          Gói hiện tại: <strong class="text-obsidian-900">{stats.tier === 'enterprise' ? 'Enterprise' : stats.tier === 'premium' ? 'Premium' : 'Miễn phí'}</strong>
        </span>
        <span class="font-mono font-extrabold text-obsidian-900">
          {stats.usedCount}/{stats.maxPosts === Infinity ? '∞' : stats.maxPosts} bài
        </span>
      </div>
    {/if}
  </div>

  <!-- Scrollable Modal Body -->
  <div class="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-6 space-y-6 bg-alabaster-50" data-lenis-prevent>
    {#if activeTab === 'plans'}
      <!-- Header Intro -->
      <div class="text-center max-w-2xl mx-auto space-y-2">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-mint-500/35 bg-mint/20 px-3 py-1 font-mono text-[11px] font-bold text-obsidian-900">
          <span class="h-1.5 w-1.5 rounded-full bg-mint-600"></span>
          <span>Tiết kiệm 90% chi phí • Mô phỏng Sandbox 0đ</span>
        </span>
        <h3 class="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-obsidian-900">
          Chọn gói phù hợp với quy mô tuyển dụng
        </h3>
        <p class="text-xs sm:text-sm text-obsidian-600 leading-relaxed">
          Mặc định tài khoản Doanh nghiệp được cấp <strong class="text-obsidian-900">10 bài đăng miễn phí mỗi tháng</strong>. Nâng cấp để mở rộng hạn mức và gia tăng độ tin cậy tuyển dụng.
        </p>
      </div>

      <!-- Pricing Grid (3 Uniform Organic Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        <!-- TIER 1: FREE -->
        <div class="rounded-3xl border border-obsidian-900 bg-alabaster-50 p-6 shadow-swiss-card flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-swiss-hover">
          <div>
            <div class="flex items-start justify-between gap-2 mb-3">
              <div>
                <h4 class="font-display text-base font-extrabold text-obsidian-900">Gói Miễn phí</h4>
                <span class="text-xs text-obsidian-600">Mặc định khi đăng ký</span>
              </div>
              {#if currentTier === 'free'}
                <span class="rounded-full border border-mint-500/40 bg-mint/30 px-2.5 py-0.5 font-display text-[11px] font-extrabold text-obsidian-900 shrink-0">
                  Hiện tại
                </span>
              {/if}
            </div>

            <!-- Uniform Price Box -->
            <div class="my-4 rounded-2xl border border-mint-500/30 bg-mint/15 px-4 py-3.5 flex flex-col justify-between min-h-[5.5rem]">
              <div class="flex items-baseline gap-1">
                <span class="font-display text-2xl font-extrabold text-obsidian-900 tracking-tight">0đ</span>
                <span class="text-xs font-medium text-obsidian-600">/ tháng</span>
              </div>
              <p class="text-[11px] text-obsidian-700 leading-snug">
                Phù hợp nhu cầu tuyển dụng nhỏ, thời vụ
              </p>
            </div>

            <div class="space-y-2.5 text-xs sm:text-[13px] text-obsidian-800 font-medium mb-6">
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span><strong class="text-obsidian-900">10 bài đăng</strong> tuyển dụng / tháng</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span>Soạn bài định dạng Markdown</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span>Hồ sơ công ty dạng <code class="font-mono text-[11px] bg-alabaster-100 px-1 rounded">@username</code></span>
              </div>
              <div class="flex items-start gap-2.5 text-swiss-400">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-alabaster-200 text-[10px] font-bold text-swiss-400 mt-0.5">✕</span>
                <span>Không có huy hiệu Premium</span>
              </div>
              <div class="flex items-start gap-2.5 text-swiss-400">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-alabaster-200 text-[10px] font-bold text-swiss-400 mt-0.5">✕</span>
                <span>Không được ghim vị trí ưu tiên</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-obsidian-900/10">
            {#if currentTier === 'free'}
              <button
                type="button"
                disabled
                class="w-full rounded-full border border-mint-500/40 bg-mint/25 py-3 px-4 font-display text-xs font-extrabold text-obsidian-900 cursor-default text-center"
              >
                ✓ Gói đang sử dụng
              </button>
            {:else}
              <button
                type="button"
                disabled
                class="w-full rounded-full border border-obsidian-900/15 bg-alabaster-100 py-3 px-4 font-display text-xs font-bold text-obsidian-600 cursor-not-allowed text-center"
              >
                Gói cơ bản
              </button>
            {/if}
          </div>
        </div>

        <!-- TIER 2: PREMIUM -->
        <div class="rounded-3xl border border-obsidian-900 bg-alabaster-50 p-6 shadow-swiss-card flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-swiss-hover">
          <div>
            <div class="flex items-start justify-between gap-2 mb-3">
              <div>
                <h4 class="font-display text-base font-extrabold text-obsidian-900">Premium Doanh nghiệp</h4>
                <span class="text-xs text-obsidian-600">Tuyển dụng liên tục & tối ưu</span>
              </div>
              {#if currentTier === 'premium'}
                <span class="rounded-full border border-mint-500/40 bg-mint/30 px-2.5 py-0.5 font-display text-[11px] font-extrabold text-obsidian-900 shrink-0">
                  Hiện tại
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 rounded-full border border-mint-500/40 bg-mint/35 px-2.5 py-0.5 font-display text-[11px] font-extrabold text-obsidian-900 shrink-0">
                  <span>✦</span>
                  <span>Phổ biến</span>
                </span>
              {/if}
            </div>

            <!-- Uniform Price Box -->
            <div class="my-4 rounded-2xl border border-mint-500/30 bg-mint/15 px-4 py-3.5 flex flex-col justify-between min-h-[5.5rem]">
              <div class="flex items-baseline gap-1">
                <span class="font-display text-2xl font-extrabold text-obsidian-900 tracking-tight">499.000đ</span>
                <span class="text-xs font-medium text-obsidian-600">/ tháng</span>
              </div>
              <p class="text-[11px] font-semibold text-mint-800 leading-snug">
                Mô phỏng 0đ Sandbox • Kích hoạt ngay
              </p>
            </div>

            <div class="space-y-2.5 text-xs sm:text-[13px] text-obsidian-800 font-medium mb-6">
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span><strong class="text-obsidian-900">50 bài đăng</strong> tuyển dụng / tháng (gấp 5 lần)</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span><strong class="text-obsidian-900">Huy hiệu Doanh nghiệp Premium ✦</strong></span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span>Ghim nổi bật bài đăng lên đầu chuyên mục</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span>Báo cáo tương tác & lượt xem bài chi tiết</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span>Hỗ trợ duyệt bài cấp tốc 24/7 qua Zalo OA</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-obsidian-900/10">
            {#if currentTier === 'premium'}
              <button
                type="button"
                disabled
                class="w-full rounded-full border border-mint-500/40 bg-mint/25 py-3 px-4 font-display text-xs font-extrabold text-obsidian-900 cursor-default text-center"
              >
                ✓ Đang sử dụng gói Premium
              </button>
            {:else}
              <button
                type="button"
                onclick={() => handleSelectUpgrade('premium')}
                class="group/btn flex w-full items-center justify-center gap-2 rounded-full bg-obsidian-900 py-3 px-4 font-display text-xs sm:text-[13px] font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 shadow-sm transition-all duration-150 cursor-pointer"
              >
                <span>Nâng cấp Premium ngay</span>
                <span class="transition-transform duration-150 group-hover/btn:translate-x-1">→</span>
              </button>
            {/if}
          </div>
        </div>

        <!-- TIER 3: ENTERPRISE -->
        <div class="rounded-3xl border border-obsidian-900 bg-alabaster-50 p-6 shadow-swiss-card flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-swiss-hover">
          <div>
            <div class="flex items-start justify-between gap-2 mb-3">
              <div>
                <h4 class="font-display text-base font-extrabold text-obsidian-900">Gói Enterprise</h4>
                <span class="text-xs text-obsidian-600">Tập đoàn & Quy mô lớn</span>
              </div>
              {#if currentTier === 'enterprise'}
                <span class="rounded-full border border-mint-500/40 bg-mint/30 px-2.5 py-0.5 font-display text-[11px] font-extrabold text-obsidian-900 shrink-0">
                  Hiện tại
                </span>
              {/if}
            </div>

            <!-- Uniform Price Box -->
            <div class="my-4 rounded-2xl border border-mint-500/30 bg-mint/15 px-4 py-3.5 flex flex-col justify-between min-h-[5.5rem]">
              <div class="flex items-baseline gap-1">
                <span class="font-display text-2xl font-extrabold text-obsidian-900 tracking-tight">999.000đ</span>
                <span class="text-xs font-medium text-obsidian-600">/ tháng</span>
              </div>
              <p class="text-[11px] text-obsidian-700 leading-snug">
                Đăng bài không giới hạn & đặc quyền VIP
              </p>
            </div>

            <div class="space-y-2.5 text-xs sm:text-[13px] text-obsidian-800 font-medium mb-6">
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span><strong class="text-obsidian-900">Không giới hạn</strong> số lượng bài tuyển dụng</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span>Huy hiệu Doanh nghiệp VIP độc quyền</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span>Tiếp cận kho hồ sơ sinh viên 327 trường ĐH</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">✓</span>
                <span>Đại diện tại các ngày hội việc làm Job Fair</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-obsidian-900/10">
            {#if currentTier === 'enterprise'}
              <button
                type="button"
                disabled
                class="w-full rounded-full border border-mint-500/40 bg-mint/25 py-3 px-4 font-display text-xs font-extrabold text-obsidian-900 cursor-default text-center"
              >
                ✓ Đang sử dụng Enterprise
              </button>
            {:else}
              <button
                type="button"
                onclick={() => handleSelectUpgrade('enterprise')}
                class="group/btn flex w-full items-center justify-center gap-2 rounded-full bg-obsidian-900 py-3 px-4 font-display text-xs sm:text-[13px] font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 shadow-sm transition-all duration-150 cursor-pointer"
              >
                <span>Chọn Enterprise</span>
                <span class="transition-transform duration-150 group-hover/btn:translate-x-1">→</span>
              </button>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <!-- QR / SIMULATED SANDBOX CHECKOUT VIEW -->
      <div class="max-w-lg mx-auto space-y-5">
        <div class="rounded-2xl border border-mint-500/35 bg-mint/15 p-4 sm:p-5 space-y-2.5 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-900/10 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-mint-500"></span>
              <span class="font-display text-sm font-extrabold text-obsidian-900">
                Xác nhận nâng cấp gói
              </span>
            </div>
            <span class="rounded-full bg-alabaster-50 border border-mint-500/35 px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-obsidian-900">
              {pendingTier === 'enterprise' ? 'Enterprise (Không giới hạn)' : 'Premium (50 bài/tháng)'}
            </span>
          </div>

          <div class="flex justify-between gap-3">
            <span class="text-obsidian-600">Doanh nghiệp</span>
            <span class="font-bold text-obsidian-900 text-right">{$currentUser?.fullName}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-obsidian-600">Hạn mức mới</span>
            <span class="font-bold text-mint-800 text-right">
              {pendingTier === 'enterprise' ? 'Không giới hạn bài đăng' : '50 bài đăng / tháng'}
            </span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-obsidian-600">Phí thử nghiệm (Sandbox)</span>
            <span class="font-mono font-extrabold text-obsidian-900 text-right">0đ (Miễn phí)</span>
          </div>
        </div>

        <!-- Simulated QR Code Card -->
        <div class="rounded-2xl border border-dashed border-obsidian-900/25 bg-alabaster-100/75 p-5 flex flex-col items-center text-center space-y-3">
          <div class="flex flex-col items-center justify-center rounded-xl border border-obsidian-900/15 bg-alabaster-50 p-3 shadow-xs">
            <img
              src={qrImageUrl}
              alt="VietQR Sandbox Demo"
              class="h-32 w-32 sm:h-36 sm:w-36 object-contain"
              loading="eager"
            />
            <span class="mt-1.5 rounded-full bg-mint/30 border border-mint-500/35 px-2.5 py-0.5 font-mono text-[10px] font-bold text-obsidian-900">
              SANDBOX 0Đ
            </span>
          </div>
          <p class="text-xs text-obsidian-600 max-w-sm leading-relaxed">
            Quét mã mô phỏng hoặc bấm nút bên dưới để kích hoạt ngay gói
            <strong class="text-obsidian-900">{pendingTier === 'enterprise' ? 'Enterprise' : 'Premium'}</strong>.
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onclick={() => (activeTab = 'plans')}
            class="rounded-full border border-obsidian-900/15 bg-alabaster-50 px-5 py-2.5 font-display text-xs font-bold text-obsidian-800 hover:border-obsidian-900 hover:bg-alabaster-100 transition-colors cursor-pointer"
          >
            ← Chọn gói khác
          </button>

          <button
            type="button"
            onclick={handleConfirmUpgrade}
            disabled={isProcessing}
            class="inline-flex items-center gap-2 rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 transition-all duration-150 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {#if isProcessing}
              <svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Đang kích hoạt...</span>
            {:else}
              <span>Kích hoạt gói {pendingTier === 'enterprise' ? 'Enterprise' : 'Premium'} ngay ✓</span>
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Pinned Footer -->
  <div class="shrink-0 border-t border-obsidian-900/10 bg-alabaster-100/90 px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
    <span class="text-[11px] text-obsidian-600 text-center sm:text-left">
      * Hạn mức bài đăng làm mới vào ngày 01 hàng tháng. Không tự động gia hạn phát sinh phí.
    </span>

    <div class="flex items-center gap-2.5 shrink-0">
      <button
        type="button"
        onclick={handleClose}
        class="rounded-full px-4 py-2 font-display text-xs font-bold text-obsidian-600 hover:text-obsidian-900 hover:bg-alabaster-200/70 transition-colors cursor-pointer"
      >
        Đóng
      </button>
      {#if $currentUser?.role === 'company'}
        <button
          type="button"
          onclick={() => {
            handleClose();
            openPostJobModal();
          }}
          class="rounded-full bg-obsidian-900 px-5 py-2 font-display text-xs font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 transition-colors shadow-sm cursor-pointer"
        >
          + Đăng tin việc
        </button>
      {/if}
    </div>
  </div>
</Modal>
