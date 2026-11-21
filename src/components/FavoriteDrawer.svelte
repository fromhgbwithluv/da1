<script lang="ts">
  import {
    isDrawerOpen,
    closeDrawer,
    favoriteJobs,
    removeFavorite,
    clearFavorites,
    openCheckout,
    openJobDetail,
    selectedJobDetail,
  } from "../stores/favorites";
  import { url } from "../utils/url";

  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80";

  // Multi-select state for bulk apply
  let selectedIds = $state<string[]>([]);
  let knownIds = new Set<string>();

  $effect(() => {
    const currentIds = $favoriteJobs.map((j) => j.id);
    const currentSet = new Set(currentIds);

    // Keep existing selections that are still in favorites
    const nextSelected = selectedIds.filter((id) => currentSet.has(id));

    // Auto-select any newly pinned jobs
    for (const id of currentIds) {
      if (!knownIds.has(id)) {
        nextSelected.push(id);
      }
    }

    knownIds = currentSet;

    if (
      nextSelected.length !== selectedIds.length ||
      nextSelected.some((id, idx) => id !== selectedIds[idx])
    ) {
      selectedIds = nextSelected;
    }
  });

  let selectedJobs = $derived(
    $favoriteJobs.filter((j) => selectedIds.includes(j.id)),
  );
  let allSelected = $derived(
    $favoriteJobs.length > 0 && selectedJobs.length === $favoriteJobs.length,
  );

  function toggleSelect(jobId: string) {
    if (selectedIds.includes(jobId)) {
      selectedIds = selectedIds.filter((id) => id !== jobId);
    } else {
      selectedIds = [...selectedIds, jobId];
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      selectedIds = [];
    } else {
      selectedIds = $favoriteJobs.map((j) => j.id);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && $isDrawerOpen && !$selectedJobDetail) {
      closeDrawer();
    }
  }

  function handleApplySelected() {
    if (selectedJobs.length === 0) return;
    openCheckout(selectedJobs);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $isDrawerOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-obsidian-950/65 backdrop-blur-sm transition-opacity duration-200"
    onclick={closeDrawer}
    aria-hidden="true"
  ></div>

  <!-- Drawer Panel (Organic Alabaster + Obsidian + Mint Theme) -->
  <div
    class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md sm:max-w-lg flex-col bg-alabaster-50 border-l-2 border-obsidian-900 sm:rounded-l-3xl overflow-hidden shadow-[0_24px_60px_rgba(14,20,18,0.25)] transition-transform duration-200 ease-out"
    role="dialog"
    aria-modal="true"
    aria-label="Danh sách việc làm đã ghim"
    tabindex="-1"
    data-lenis-prevent
  >
    <!-- Drawer Header -->
    <div
      class="relative overflow-hidden border-b border-obsidian-900/10 bg-alabaster-100/80 bg-organic-dots-light px-6 pt-5 pb-4 shrink-0"
    >
      <!-- Subtle ambient mint aura -->
      <div
        class="pointer-events-none absolute -top-12 right-6 h-32 w-32 rounded-full bg-mint/25 blur-2xl"
      ></div>

      <!-- Top Brand & Close Row -->
      <div class="relative z-10 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <img
            src={url("/favicon.svg")}
            alt="TopSiVi"
            class="h-7 w-auto object-contain"
          />
        </div>

        <button
          type="button"
          onclick={closeDrawer}
          class="flex h-9 w-9 items-center justify-center rounded-full border border-obsidian-900/15 bg-alabaster-50 text-obsidian-800 transition-all duration-150 hover:border-obsidian-900 hover:bg-obsidian-900 hover:text-mint cursor-pointer"
          aria-label="Đóng bảng việc đã ghim"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Title & Subtitle -->
      <div class="relative z-10 mt-3.5">
        <h2
          class="font-display text-xl font-extrabold tracking-tight text-obsidian-900 flex items-center gap-2"
        >
          <span>Việc đã ghim</span>
          {#if $favoriteJobs.length > 0}
            <span
              class="inline-flex items-center justify-center rounded-full bg-mint px-2.5 py-0.5 font-mono text-xs font-extrabold text-obsidian-900"
            >
              {$favoriteJobs.length}
            </span>
          {/if}
        </h2>
        <p class="mt-0.5 text-xs text-obsidian-600">
          {#if $favoriteJobs.length > 0}
            Đang chọn {selectedJobs.length} / {$favoriteJobs.length} vị trí sẵn sàng ứng tuyển đồng loạt.
          {:else}
            Ghim các cơ hội phù hợp để nộp hồ sơ đồng loạt chỉ trong 1 chạm.
          {/if}
        </p>
      </div>
    </div>

    <!-- Drawer Content / Items list -->
    <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
      {#if $favoriteJobs.length === 0}
        <div
          class="flex h-full flex-col items-center justify-center text-center py-16"
        >
          <div
            class="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-obsidian-900/15 bg-alabaster-100 text-obsidian-700"
          >
            <svg
              class="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <span
              class="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-alabaster-50 bg-mint"
            ></span>
          </div>

          <h3
            class="font-display text-base sm:text-lg font-extrabold text-obsidian-900"
          >
            Chưa có công việc nào được ghim
          </h3>
          <p
            class="mt-1.5 max-w-xs text-xs sm:text-sm text-obsidian-600 leading-relaxed"
          >
            Ghim các cơ hội phù hợp để nộp hồ sơ đồng loạt chỉ trong 1 chạm.
          </p>
          <button
            type="button"
            onclick={closeDrawer}
            class="group mt-6 inline-flex items-center gap-2.5 rounded-full bg-obsidian-900 px-6 py-3 font-display text-sm font-bold text-alabaster-50 hover:bg-obsidian-800 hover:shadow-mint-glow transition-all cursor-pointer"
          >
            <span>Khám phá việc làm</span>
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-obsidian-900 font-mono text-xs font-black transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </button>
        </div>
      {:else}
        <!-- Select All & Clear All Toolbar -->
        <div
          class="flex items-center justify-between gap-2 pb-2.5 border-b border-obsidian-900/10"
        >
          <button
            type="button"
            onclick={toggleSelectAll}
            class="inline-flex items-center gap-2 text-xs font-bold text-obsidian-800 hover:text-obsidian-900 transition-colors cursor-pointer"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-black transition-colors
              {allSelected
                ? 'border-mint-500 bg-mint-500 text-alabaster-50'
                : selectedJobs.length > 0
                  ? 'border-mint-500 bg-mint/30 text-obsidian-900'
                  : 'border-obsidian-900/25 bg-alabaster-50 text-transparent'}"
            >
              {allSelected ? "✓" : selectedJobs.length > 0 ? "–" : "✓"}
            </span>
            <span>{allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}</span>
            <span
              class="rounded-full bg-obsidian-900/5 px-2 py-0.5 font-mono text-[11px] font-bold text-obsidian-800"
            >
              {selectedJobs.length}/{$favoriteJobs.length}
            </span>
          </button>

          <button
            type="button"
            onclick={clearFavorites}
            class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-signal-crimson hover:bg-signal-crimson/10 transition-colors cursor-pointer"
          >
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Xóa tất cả</span>
          </button>
        </div>

        <div class="space-y-3">
          {#each $favoriteJobs as job (job.id)}
            {@const isSelected = selectedIds.includes(job.id)}
            <div
              class="group relative flex items-start gap-3 rounded-2xl border p-3.5 shadow-swiss-card transition-all duration-200
              {isSelected
                ? 'border-mint-500/80 bg-mint/10 hover:border-mint-600'
                : 'border-obsidian-900/15 bg-alabaster-50 hover:border-obsidian-900/40'}"
            >
              <!-- Select checkbox for bulk apply -->
              <button
                type="button"
                onclick={() => toggleSelect(job.id)}
                class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-black transition-all cursor-pointer
                {isSelected
                  ? 'border-mint-500 bg-mint-500 text-alabaster-50 shadow-xs'
                  : 'border-obsidian-900/25 bg-alabaster-50 text-transparent hover:border-mint-500'}"
                aria-label={isSelected
                  ? `Bỏ chọn ${job.title}`
                  : `Chọn ${job.title} để ứng tuyển`}
                aria-pressed={isSelected}
              >
                ✓
              </button>

              <!-- Clickable Thumbnail (opens JD without closing drawer) -->
              <button
                type="button"
                onclick={() => openJobDetail(job)}
                class="group/thumb relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-obsidian-900/10 bg-alabaster-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-500"
                aria-label={`Xem chi tiết ${job.title}`}
              >
                <img
                  src={job.imageUrl?.trim() || FALLBACK_IMAGE}
                  alt={job.title}
                  class="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                />
                <span
                  class="pointer-events-none absolute inset-0 bg-obsidian-950/0 group-hover/thumb:bg-obsidian-950/20 transition-colors"
                ></span>
              </button>

              <!-- Info -->
              <div class="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full bg-alabaster-50 border border-obsidian-900/10 px-2.5 py-0.5 font-display text-[11px] font-bold text-obsidian-800"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-mint-500 shrink-0"></span>
                      <span class="truncate">{job.targetGroup}</span>
                    </span>
                    <button
                      type="button"
                      onclick={() => removeFavorite(job.id)}
                      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-swiss-400 hover:bg-signal-crimson/10 hover:text-signal-crimson transition-colors cursor-pointer"
                      title="Xóa khỏi danh sách"
                      aria-label="Xóa"
                    >
                      <svg
                        class="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    onclick={() => openJobDetail(job)}
                    class="mt-1.5 text-left font-display text-sm font-extrabold text-obsidian-900 line-clamp-2 leading-snug hover:text-obsidian-700 transition-colors block w-full cursor-pointer"
                  >
                    {job.title}
                  </button>
                  <p
                    class="mt-0.5 text-xs font-medium text-obsidian-600 truncate"
                  >
                    {job.company}
                  </p>
                </div>

                <div
                  class="mt-2.5 flex items-center justify-between gap-2 border-t border-obsidian-900/10 pt-2.5"
                >
                  <span
                    class="inline-flex items-center rounded-lg bg-mint/40 px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-obsidian-900 truncate max-w-[65%]"
                  >
                    {job.salary}
                  </span>
                  <button
                    type="button"
                    onclick={() => openJobDetail(job)}
                    class="shrink-0 text-xs font-bold text-obsidian-900 underline decoration-mint decoration-2 underline-offset-4 hover:text-obsidian-700 transition-colors cursor-pointer"
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
      <div
        class="border-t border-obsidian-900/10 bg-alabaster-100/90 p-5 sm:p-6 space-y-4 shrink-0"
      >
        <div
          class="rounded-2xl border border-obsidian-900/10 bg-alabaster-50 p-3.5 space-y-2 text-xs"
        >
          <div
            class="flex items-center justify-between border-b border-obsidian-900/10 pb-2"
          >
            <span class="text-obsidian-600 font-medium"
              >Số lượng việc đã chọn</span
            >
            <span class="font-display font-extrabold text-obsidian-900"
              >{selectedJobs.length} / {$favoriteJobs.length} vị trí</span
            >
          </div>
          <div
            class="flex items-center justify-between border-b border-obsidian-900/10 pb-2"
          >
            <span class="text-obsidian-600 font-medium">Lệ phí ứng tuyển</span>
            <span
              class="inline-flex items-center rounded-full bg-mint/45 px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-obsidian-900"
            >
              0đ • Miễn phí
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-obsidian-600 font-medium">Cam kết pháp lý</span>
            <span
              class="inline-flex items-center gap-1.5 font-bold text-obsidian-900"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-mint-500"></span>
              <span>100% Xác thực</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          id="drawer-checkout-btn"
          disabled={selectedJobs.length === 0}
          onclick={handleApplySelected}
          class="group w-full flex items-center justify-center gap-3 rounded-full bg-obsidian-900 py-3.5 px-6 font-display text-sm font-bold text-alabaster-50 transition-all duration-200
          {selectedJobs.length === 0
            ? 'opacity-45 cursor-not-allowed'
            : 'hover:bg-obsidian-800 hover:shadow-mint-glow cursor-pointer'}"
        >
          <span>
            {selectedJobs.length === 0
              ? "Chọn ít nhất 1 việc để ứng tuyển"
              : `Tiến hành ứng tuyển (${selectedJobs.length})`}
          </span>
          {#if selectedJobs.length > 0}
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-obsidian-900 font-mono text-xs font-black transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          {/if}
        </button>

        <p class="text-center font-mono text-[11px] font-medium text-swiss-500">
          TopSiVi • Trao niềm tin, nhận tài lộc
        </p>
      </div>
    {/if}
  </div>
{/if}
