<script lang="ts">
  import {
    isUpgradeModalOpen,
    closeUpgradeModal,
    currentUser,
    getCompanyMonthlyJobStats,
    upgradePlan,
    openPostJobModal
  } from '../stores/auth';

  import Modal from './Modal.svelte';
  import Badge from './Badge.svelte';

  let selectedBilling = $state<'monthly' | 'yearly'>('monthly');
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
</script>

<Modal
  isOpen={$isUpgradeModalOpen}
  onClose={closeUpgradeModal}
  maxWidth="4xl"
  iconText="PRO"
  title="Gói dịch vụ tuyển dụng Doanh nghiệp"
  subtitle="Mở rộng giới hạn đăng tin tuyển dụng sinh viên & tiếp cận nhân tài"
  bodyClass="p-0"
  ariaLabel="Nâng cấp gói tuyển dụng doanh nghiệp"
>
  {#snippet headerExtra()}
    <Badge variant="emerald" size="xs">TIẾT KIỆM 90% CHI PHÍ</Badge>
  {/snippet}

  {#snippet footer()}
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono w-full">
      <span class="text-swiss-500 text-[11px]">
        * Hạn mức bài đăng làm mới vào ngày 01 hàng tháng. Không tự động gia hạn phát sinh phí.
      </span>

      <div class="flex items-center gap-3">
        <button
          type="button"
          onclick={closeUpgradeModal}
          class="text-swiss-600 hover:text-black uppercase font-bold text-xs cursor-pointer"
        >
          Đóng
        </button>
        {#if $currentUser?.role === 'company'}
          <button
            type="button"
            onclick={() => { closeUpgradeModal(); openPostJobModal(); }}
            class="rounded-swiss-sm bg-black px-4 py-1.5 font-bold uppercase text-white hover:bg-neutral-800 cursor-pointer"
          >
            + Đăng tin việc
          </button>
        {/if}
      </div>
    </div>
  {/snippet}

      <!-- Current Usage Quota Banner (Swiss Architectural Bar) -->
      {#if $currentUser && stats}
        <div class="bg-black text-white px-6 py-3 border-b border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div class="flex items-center gap-3">
            <span class="text-[10px] text-neutral-400 uppercase tracking-wider">HẠN MỨC THÁNG NÀY:</span>
            <span class="font-bold text-signal-emerald uppercase">
              {stats.tier === 'enterprise' ? 'Enterprise (Không giới hạn)' : stats.tier === 'premium' ? 'Premium (50 bài)' : 'Gói Miễn phí (10 bài/tháng)'}
            </span>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-neutral-400">Đã đăng:</span>
              <span class="font-bold text-white bg-neutral-800 px-2 py-0.5 rounded-swiss-sm border border-neutral-700">
                {stats.usedCount} / {stats.maxPosts === Infinity ? '∞' : stats.maxPosts} bài
              </span>
            </div>
            {#if stats.isLimitReached}
              <Badge variant="crimson" size="xs">ĐÃ ĐẠT GIỚI HẠN</Badge>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Modal Body -->
      <div class="p-6 max-h-[68vh] overflow-y-auto space-y-6">
        {#if activeTab === 'plans'}
          <!-- Header Intro -->
          <div class="text-center max-w-xl mx-auto space-y-1.5">
            <h3 class="text-lg font-black uppercase tracking-tight text-black sm:text-xl">
              Chọn gói phù hợp với quy mô tuyển dụng
            </h3>
            <p class="font-mono text-xs text-swiss-600 leading-relaxed">
              Mặc định tài khoản Doanh nghiệp mới được cấp <strong>10 bài đăng miễn phí mỗi tháng</strong>. Nâng cấp gói Premium để mở rộng hạn mức và gia tăng độ tin cậy.
            </p>
          </div>

          <!-- Pricing Grid (3 Swiss Columns) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <!-- TIER 1: FREE -->
            <div class="rounded-swiss-sm border border-swiss-300 p-5 bg-white flex flex-col justify-between space-y-5 hover:border-black transition-colors {currentTier === 'free' ? 'ring-2 ring-black' : ''}">
              <div>
                <div class="flex items-center justify-between border-b border-swiss-200 pb-3">
                  <div>
                    <h4 class="font-mono text-xs font-black uppercase text-black">GÓI MIỄN PHÍ</h4>
                    <span class="font-mono text-[10px] text-swiss-500">Mặc định khi đăng ký</span>
                  </div>
                  {#if currentTier === 'free'}
                    <Badge variant="black" size="xs">HIỆN TẠI</Badge>
                  {/if}
                </div>

                <div class="my-4">
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-black text-black">0đ</span>
                    <span class="font-mono text-xs text-swiss-500">/ tháng</span>
                  </div>
                  <p class="font-mono text-[11px] text-swiss-600 mt-1">Phù hợp nhu cầu tuyển dụng nhỏ, thời vụ</p>
                </div>

                <div class="space-y-2.5 text-xs text-swiss-800 border-t border-swiss-100 pt-3 font-medium">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span><strong>10 bài đăng</strong> tuyển dụng / tháng</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span>Soạn bài định dạng Markdown</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span>Hồ sơ công ty dạng <code>@username</code></span>
                  </div>
                  <div class="flex items-center gap-2 text-swiss-400">
                    <span class="font-mono text-swiss-300">✕</span>
                    <span>Không có huy hiệu Premium</span>
                  </div>
                  <div class="flex items-center gap-2 text-swiss-400">
                    <span class="font-mono text-swiss-300">✕</span>
                    <span>Không được ghim vị trí ưu tiên</span>
                  </div>
                </div>
              </div>

              <div>
                {#if currentTier === 'free'}
                  <button
                    type="button"
                    disabled
                    class="w-full rounded-swiss-sm border border-swiss-300 bg-swiss-100 py-2 font-mono text-xs font-bold uppercase text-swiss-500 cursor-default text-center"
                  >
                    Gói đang sử dụng
                  </button>
                {:else}
                  <button
                    type="button"
                    disabled
                    class="w-full rounded-swiss-sm border border-swiss-200 bg-white py-2 font-mono text-xs font-bold uppercase text-swiss-400 cursor-not-allowed text-center"
                  >
                    Gói cơ bản
                  </button>
                {/if}
              </div>
            </div>

            <!-- TIER 2: PREMIUM (RECOMMENDED) -->
            <div class="relative rounded-swiss-sm border-2 border-black p-5 bg-white flex flex-col justify-between space-y-5 shadow-swiss-card {currentTier === 'premium' ? 'ring-2 ring-signal-emerald' : ''}">
              <!-- Top highlight badge -->
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-0.5 rounded-swiss-sm font-mono text-[9px] font-bold uppercase tracking-wider shadow-xs">
                KHUYÊN DÙNG ✦ PHỔ BIẾN
              </div>

              <div>
                <div class="flex items-center justify-between border-b border-black pb-3 pt-1">
                  <div>
                    <h4 class="font-mono text-xs font-black uppercase text-black flex items-center gap-1.5">
                      <span>PREMIUM DOANH NGHIỆP</span>
                      <span class="text-amber-500">✦</span>
                    </h4>
                    <span class="font-mono text-[10px] text-swiss-600">Tuyển dụng liên tục & tối ưu</span>
                  </div>
                  {#if currentTier === 'premium'}
                    <Badge variant="emerald" size="xs">HIỆN TẠI</Badge>
                  {/if}
                </div>

                <div class="my-4">
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-black text-black">499.000đ</span>
                    <span class="font-mono text-xs text-swiss-500">/ tháng</span>
                  </div>
                  <span class="inline-block font-mono text-[10px] font-bold text-signal-emerald bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-swiss-sm mt-1">
                    MÔ PHỎNG 0Đ SANDBOX
                  </span>
                </div>

                <div class="space-y-2.5 text-xs text-swiss-900 border-t border-swiss-200 pt-3 font-medium">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span><strong>50 bài đăng</strong> tuyển dụng / tháng (Gấp 5 lần)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span><strong>Huy hiệu Doanh nghiệp Premium Gold ✦</strong></span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span>Ghim nổi bật bài đăng lên đầu chuyên mục</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span>Báo cáo tương tác & lượt xem bài chi tiết</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span>Hỗ trợ duyệt bài cấp tốc 24/7 qua Zalo OA</span>
                  </div>
                </div>
              </div>

              <div>
                {#if currentTier === 'premium'}
                  <button
                    type="button"
                    disabled
                    class="w-full rounded-swiss-sm bg-signal-emerald py-2 font-mono text-xs font-bold uppercase text-white cursor-default text-center shadow-xs"
                  >
                    ✓ Đang sử dụng gói Premium
                  </button>
                {:else}
                  <button
                    type="button"
                    onclick={() => handleSelectUpgrade('premium')}
                    class="w-full rounded-swiss-sm bg-black py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors shadow-swiss-card text-center"
                  >
                    Nâng cấp Premium ngay →
                  </button>
                {/if}
              </div>
            </div>

            <!-- TIER 3: ENTERPRISE -->
            <div class="rounded-swiss-sm border border-swiss-300 p-5 bg-white flex flex-col justify-between space-y-5 hover:border-black transition-colors {currentTier === 'enterprise' ? 'ring-2 ring-black' : ''}">
              <div>
                <div class="flex items-center justify-between border-b border-swiss-200 pb-3">
                  <div>
                    <h4 class="font-mono text-xs font-black uppercase text-black">GÓI ENTERPRISE</h4>
                    <span class="font-mono text-[10px] text-swiss-500">Tập đoàn & Quy mô lớn</span>
                  </div>
                  {#if currentTier === 'enterprise'}
                    <Badge variant="black" size="xs">HIỆN TẠI</Badge>
                  {/if}
                </div>

                <div class="my-4">
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-black text-black">999.000đ</span>
                    <span class="font-mono text-xs text-swiss-500">/ tháng</span>
                  </div>
                  <p class="font-mono text-[11px] text-swiss-600 mt-1">Đăng bài không giới hạn & độc quyền</p>
                </div>

                <div class="space-y-2.5 text-xs text-swiss-800 border-t border-swiss-100 pt-3 font-medium">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span><strong>KHÔNG GIỚI HẠN</strong> số lượng bài tuyển dụng</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span>Huy hiệu Doanh nghiệp VIP Độc quyền</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span>Tiếp cận kho hồ sơ sinh viên tài năng 327 trường ĐH</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-signal-emerald font-bold">✓</span>
                    <span>Đại diện tại các ngày hội việc làm Job Fair</span>
                  </div>
                </div>
              </div>

              <div>
                {#if currentTier === 'enterprise'}
                  <button
                    type="button"
                    disabled
                    class="w-full rounded-swiss-sm bg-black py-2 font-mono text-xs font-bold uppercase text-white cursor-default text-center"
                  >
                    ✓ Đang sử dụng Enterprise
                  </button>
                {:else}
                  <button
                    type="button"
                    onclick={() => handleSelectUpgrade('enterprise')}
                    class="w-full rounded-swiss-sm border border-black bg-white py-2 font-mono text-xs font-bold uppercase text-black hover:bg-swiss-100 transition-colors text-center"
                  >
                    Chọn Enterprise →
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <!-- QR / SIMULATED CHECKOUT VIEW -->
          <div class="max-w-md mx-auto space-y-5 text-center">
            <div class="rounded-swiss-sm border border-black p-4 bg-swiss-50 space-y-2 text-left">
              <div class="flex items-center justify-between border-b border-swiss-300 pb-2">
                <span class="font-mono text-xs font-black text-black">XÁC NHẬN NÂNG CẤP GÓI</span>
                <span class="font-mono text-xs font-bold text-signal-emerald uppercase">
                  {pendingTier === 'enterprise' ? 'Enterprise (Không giới hạn)' : 'Premium (50 bài/tháng)'}
                </span>
              </div>
              <div class="flex justify-between font-mono text-xs pt-1">
                <span class="text-swiss-600">Doanh nghiệp:</span>
                <span class="font-bold text-black">{$currentUser?.fullName}</span>
              </div>
              <div class="flex justify-between font-mono text-xs">
                <span class="text-swiss-600">Hạn mức mới:</span>
                <span class="font-bold text-signal-emerald">{pendingTier === 'enterprise' ? 'Không giới hạn bài đăng' : '50 bài đăng / tháng'}</span>
              </div>
              <div class="flex justify-between font-mono text-xs">
                <span class="text-swiss-600">Phí thử nghiệm (Sandbox):</span>
                <span class="font-bold text-black">0đ (Thử nghiệm miễn phí)</span>
              </div>
            </div>

            <!-- Simulated QR Code Card -->
            <div class="rounded-swiss-sm border border-dashed border-black p-6 bg-white inline-block">
              <div class="mx-auto h-40 w-40 bg-swiss-100 border border-black flex flex-col items-center justify-center p-3 relative">
                <!-- QR Mock Visual -->
                <svg class="h-32 w-32 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
                <span class="absolute bottom-1 font-mono text-[9px] uppercase font-bold text-swiss-600 bg-white/90 px-1 border border-swiss-300">
                  SANDBOX 0Đ
                </span>
              </div>
              <p class="font-mono text-[11px] text-swiss-500 mt-3">
                Quét mã hoặc bấm nút bên dưới để kích hoạt ngay gói {pendingTier.toUpperCase()}.
              </p>
            </div>

            <div class="flex items-center justify-center gap-3">
              <button
                type="button"
                onclick={() => (activeTab = 'plans')}
                class="rounded-swiss-sm border border-swiss-300 px-4 py-2 font-mono text-xs font-bold uppercase text-swiss-700 hover:border-black hover:text-black"
              >
                ← Chọn gói khác
              </button>

              <button
                type="button"
                onclick={handleConfirmUpgrade}
                disabled={isProcessing}
                class="rounded-swiss-sm bg-signal-emerald px-6 py-2 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 transition-colors shadow-swiss-card flex items-center gap-2"
              >
                {#if isProcessing}
                  <svg class="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang kích hoạt...</span>
                {:else}
                  <span>Kích hoạt gói {pendingTier.toUpperCase()} ngay ✓</span>
                {/if}
              </button>
            </div>
          </div>
        {/if}
      </div>
</Modal>
