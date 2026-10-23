<script lang="ts">
  import {
    isDrawerOpen,
    closeDrawer,
    favoriteJobs,
    removeFavorite,
    clearFavorites,
    openCheckout,
    openJobDetail
  } from '../stores/favorites';
  import Badge from './Badge.svelte';

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && $isDrawerOpen) {
      closeDrawer();
    }
  }

  function handleApplyAll() {
    if ($favoriteJobs.length === 0) return;
    openCheckout($favoriteJobs);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $isDrawerOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
    onclick={closeDrawer}
    aria-hidden="true"
  ></div>

  <!-- Drawer panel (Swiss Minimalist Side-Sheet) -->
  <div
    class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white border-l border-black shadow-swiss-elevated transition-transform duration-200 ease-out sm:max-w-lg"
    role="dialog"
    aria-modal="true"
    aria-label="Danh sách việc làm đã ghim"
    tabindex="-1"
  >
    <!-- Drawer Header -->
    <div class="flex items-center justify-between border-b border-black px-6 py-4 bg-swiss-50">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-swiss-sm bg-black text-white font-mono font-bold text-xs">
          TSV
        </div>
        <div>
          <h2 class="text-sm font-black uppercase tracking-tight text-black">Việc đã ghim</h2>
          <p class="font-mono text-[11px] text-swiss-500 uppercase tracking-wide">
            Đang chọn {$favoriteJobs.length} vị trí ứng tuyển
          </p>
        </div>
      </div>

      <!-- Close button -->
      <button
        type="button"
        onclick={closeDrawer}
        class="rounded-swiss-sm p-1.5 text-black hover:bg-swiss-200 transition-colors border border-transparent hover:border-black"
        aria-label="Đóng bảng việc đã ghim"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Drawer Content / Items list -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4">
      {#if $favoriteJobs.length === 0}
        <div class="flex h-full flex-col items-center justify-center text-center py-16">
          <span class="font-mono text-xs font-bold text-swiss-400 block mb-2">[ EMPTY CART ]</span>
          <h3 class="text-sm font-black uppercase text-black">Chưa có công việc nào được ghim</h3>
          <p class="mt-2 max-w-xs font-mono text-[11px] text-swiss-500 leading-relaxed">
            Ghim các vị trí phù hợp để gửi hồ sơ đồng loạt chỉ với 1 form đơn giản hoàn toàn miễn phí.
          </p>
          <button
            type="button"
            onclick={closeDrawer}
            class="mt-6 rounded-swiss-sm bg-black px-5 py-2 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors"
          >
            Khám phá việc làm
          </button>
        </div>
      {:else}
        <div class="flex items-center justify-between pb-2 border-b border-swiss-200">
          <span class="font-mono text-[11px] font-bold uppercase tracking-wide text-black">
            Danh sách chờ nộp [{$favoriteJobs.length}]
          </span>
          <button
            type="button"
            onclick={clearFavorites}
            class="font-mono text-[11px] text-signal-crimson hover:underline uppercase font-bold"
          >
            [ Xóa tất cả ]
          </button>
        </div>

        <div class="space-y-3">
          {#each $favoriteJobs as job (job.id)}
            <div class="relative flex gap-3 rounded-swiss-sm border border-swiss-300 bg-white p-3 transition-colors hover:border-black">
              <!-- Thumbnail -->
              <div class="h-16 w-16 shrink-0 overflow-hidden rounded-swiss-sm border border-swiss-200 bg-swiss-100">
                <img
                  src={job.imageUrl}
                  alt={job.title}
                  class="h-full w-full object-cover"
                />
              </div>

              <!-- Info -->
              <div class="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <Badge variant="gray" size="xs">{job.targetGroup}</Badge>
                    <button
                      type="button"
                      onclick={() => removeFavorite(job.id)}
                      class="text-swiss-400 hover:text-black p-0.5"
                      title="Xóa khỏi danh sách"
                      aria-label="Xóa"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <h4 class="mt-1 text-xs font-black text-black truncate leading-tight">
                    {job.title}
                  </h4>
                  <p class="font-mono text-[10px] text-swiss-500 truncate">{job.company}</p>
                </div>

                <div class="mt-2 flex items-center justify-between border-t border-swiss-100 pt-1.5">
                  <span class="font-mono text-xs font-bold text-signal-emerald">{job.salary}</span>
                  <button
                    type="button"
                    onclick={() => { closeDrawer(); openJobDetail(job); }}
                    class="font-mono text-[10px] uppercase font-bold text-black hover:underline"
                  >
                    Xem JD →
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Drawer Footer -->
    {#if $favoriteJobs.length > 0}
      <div class="border-t border-black bg-swiss-50 p-5 space-y-3.5">
        <div class="space-y-1.5 font-mono text-xs text-swiss-700">
          <div class="flex justify-between border-b border-swiss-200 pb-1.5">
            <span class="text-swiss-500 uppercase">Số lượng việc:</span>
            <span class="font-bold text-black">{$favoriteJobs.length} vị trí</span>
          </div>
          <div class="flex justify-between border-b border-swiss-200 pb-1.5">
            <span class="text-swiss-500 uppercase">Lệ phí ứng tuyển:</span>
            <span class="font-bold text-signal-emerald">0 VNĐ (MIỄN PHÍ)</span>
          </div>
          <div class="flex justify-between">
            <span class="text-swiss-500 uppercase">Bảo chứng:</span>
            <span class="font-bold text-black">100% XÁC THỰC</span>
          </div>
        </div>

        <button
          type="button"
          id="drawer-checkout-btn"
          onclick={handleApplyAll}
          class="w-full flex items-center justify-center gap-2 rounded-swiss-sm bg-black py-3 text-xs font-bold uppercase tracking-swiss-wide text-white hover:bg-neutral-800 transition-colors shadow-swiss-card"
        >
          <span>Tiến hành ứng tuyển ({$favoriteJobs.length})</span>
          <span class="font-mono">→</span>
        </button>

        <p class="text-center font-mono text-[10px] uppercase tracking-wide text-swiss-400">
          TOPSIVI • TRAO NIỀM TIN • NHẬN TÀI LỘC
        </p>
      </div>
    {/if}
  </div>
{/if}
