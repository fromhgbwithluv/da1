<script lang="ts">
  import {
    selectedJobDetail,
    closeJobDetail,
    favoriteJobs,
    toggleFavorite,
    openCheckout
  } from '../stores/favorites';
  import { currentUser, openPostJobModal, deleteJob } from '../stores/auth';
  import { renderMarkdown } from '../utils/markdown';
  import { getCategoryLabel } from '../utils/formatters';
  import { url } from '../utils/url';
  import Modal from './Modal.svelte';

  const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80';

  let isSaved = $derived(
    $selectedJobDetail ? $favoriteJobs.some((j) => j.id === $selectedJobDetail?.id) : false
  );

  let isAuthor = $derived(
    !!$currentUser && !!$selectedJobDetail && (
      $currentUser.id === $selectedJobDetail.authorId ||
      ('@' + $currentUser.username).toLowerCase() === $selectedJobDetail.companyUsername?.toLowerCase() ||
      ($currentUser.role === 'company' && $currentUser.fullName === $selectedJobDetail.company)
    )
  );

  let displayImage = $derived($selectedJobDetail?.imageUrl || FALLBACK_IMAGE);

  function handleApplyNow() {
    if (!$selectedJobDetail) return;
    const job = $selectedJobDetail;
    closeJobDetail();
    openCheckout([job]);
  }

  function handleEditJob() {
    if (!$selectedJobDetail) return;
    const job = $selectedJobDetail;
    closeJobDetail();
    openPostJobModal(job);
  }

  function handleDeleteJob() {
    if (!$selectedJobDetail) return;
    if (confirm(`Bạn có chắc muốn xóa tin tuyển dụng "${$selectedJobDetail.title}" không?`)) {
      const id = $selectedJobDetail.id;
      closeJobDetail();
      deleteJob(id);
    }
  }
</script>

<Modal
  isOpen={!!$selectedJobDetail}
  onClose={closeJobDetail}
  maxWidth="3xl"
  hideHeader={true}
  dialogClass="rounded-3xl border-2 border-obsidian-900 bg-alabaster-50 shadow-[0_24px_60px_rgba(14,20,18,0.22)] max-h-[90vh] flex flex-col !my-0"
  bodyClass="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
  ariaLabel={$selectedJobDetail?.title || 'Chi tiết việc làm'}
>
  {#if $selectedJobDetail}
    <!-- Slim Pinned Top Bar (Always reachable) -->
    <div
      class="relative z-10 shrink-0 flex items-center justify-between gap-3 border-b border-obsidian-900/10 bg-alabaster-100/90 bg-organic-dots-light px-5 sm:px-6 py-3.5"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <img
          src={url('/favicon.svg')}
          alt="TopSiVi"
          class="h-6 sm:h-7 w-auto object-contain shrink-0"
        />
        <span class="hidden sm:inline-block h-4 w-px bg-obsidian-900/15"></span>
        <span class="hidden sm:inline-block font-mono text-[11px] font-bold text-obsidian-600 truncate">
          Chi tiết cơ hội việc làm
        </span>
      </div>

      <button
        type="button"
        onclick={closeJobDetail}
        class="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-obsidian-900/15 bg-alabaster-50 text-obsidian-800 transition-all duration-150 hover:border-obsidian-900 hover:bg-obsidian-900 hover:text-mint cursor-pointer"
        aria-label="Đóng"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Single Scrollable Middle Region (Hero + Body) -->
    <div class="flex-1 min-h-0 overflow-y-auto bg-alabaster-50">
      <!-- Organic Alabaster Hero Section with Unobstructed Image & Soft Mint Pills -->
      <div
        class="relative overflow-hidden border-b border-obsidian-900/10 bg-alabaster-100/70 bg-organic-dots-light px-5 sm:px-6 py-4 sm:py-5"
      >
        <!-- Subtle ambient mint aura -->
        <div
          class="pointer-events-none absolute -top-14 right-8 h-36 w-36 rounded-full bg-mint/25 blur-2xl"
        ></div>

        <!-- Clean Rounded Thumbnail Banner (No dark gradient smothering image) -->
        <div class="relative z-10 mb-4 h-40 sm:h-48 w-full overflow-hidden rounded-2xl border border-obsidian-900/10 bg-alabaster-200">
          <img
            src={displayImage}
            alt={$selectedJobDetail.title}
            class="h-full w-full object-cover"
          />

          <!-- Top-left Target Group & Category Frosted Pills -->
          <div class="pointer-events-none absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[70%]">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-alabaster-50/95 backdrop-blur-md border border-obsidian-900/15 px-3 py-1 font-display text-[11px] font-extrabold text-obsidian-900 shadow-sm"
            >
              <span class="h-2 w-2 rounded-full bg-mint-500 shrink-0"></span>
              <span>{$selectedJobDetail.targetGroup}</span>
            </span>
            {#if $selectedJobDetail.categories && $selectedJobDetail.categories.length > 1}
              {#each $selectedJobDetail.categories as cat}
                <span
                  class="inline-flex items-center rounded-full bg-alabaster-50/90 backdrop-blur-md border border-obsidian-900/15 px-2.5 py-1 font-display text-[11px] font-bold text-obsidian-800 shadow-sm"
                >
                  {getCategoryLabel(cat)}
                </span>
              {/each}
            {/if}
          </div>

          <!-- Top-right Verified Pill -->
          {#if $selectedJobDetail.verified}
            <div class="pointer-events-none absolute top-3 right-3">
              <span
                class="inline-flex items-center gap-1 rounded-full bg-alabaster-50/95 backdrop-blur-md border border-mint-500/40 px-3 py-1 font-display text-[11px] font-extrabold text-mint-700 shadow-sm"
              >
                <span>✓</span>
                <span>Xác thực</span>
              </span>
            </div>
          {/if}

          <!-- Bottom-left Salary Frosted Mint Pill -->
          <div class="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]">
            <span
              class="inline-flex items-center rounded-full bg-mint/95 backdrop-blur-md border border-obsidian-900/15 px-3.5 py-1.5 font-mono text-xs sm:text-sm font-extrabold text-obsidian-900 shadow-sm truncate max-w-full"
            >
              {$selectedJobDetail.salary}
            </span>
          </div>
        </div>

        <!-- Company, Job Title & Key Meta -->
        <div class="relative z-10">
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            {#if $selectedJobDetail.companyUsername}
              <a
                href={url(`/profile/${$selectedJobDetail.companyUsername}`)}
                class="inline-flex items-center gap-1.5 rounded-full border border-obsidian-900/15 bg-alabaster-50 px-3 py-1 text-xs font-bold text-obsidian-900 transition-colors hover:border-obsidian-900 hover:bg-mint/25"
              >
                <span>{$selectedJobDetail.company}</span>
                <span class="font-mono text-[11px] font-normal text-obsidian-600">
                  ({$selectedJobDetail.companyUsername})
                </span>
                <span class="text-[11px] font-extrabold text-mint-700">↗ Xem hồ sơ</span>
              </a>
            {:else}
              <span class="inline-flex items-center rounded-full border border-obsidian-900/10 bg-alabaster-50 px-3 py-1 text-xs font-bold text-obsidian-800">
                {$selectedJobDetail.company}
              </span>
            {/if}
          </div>

          <h2 class="font-display text-lg sm:text-2xl font-extrabold tracking-tight text-obsidian-900 leading-snug">
            {$selectedJobDetail.title}
          </h2>

          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-obsidian-600">
            {#if $selectedJobDetail.workType}
              <span class="inline-flex items-center gap-1.5 rounded-full bg-alabaster-50 border border-obsidian-900/10 px-2.5 py-1 font-medium text-obsidian-700">
                <span class="h-1.5 w-1.5 rounded-full bg-mint-500"></span>
                <span>{$selectedJobDetail.workType}</span>
              </span>
            {/if}
            {#if $selectedJobDetail.deadline}
              <span class="inline-flex items-center gap-1.5 rounded-full bg-alabaster-50 border border-obsidian-900/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-obsidian-700">
                <svg class="h-3.5 w-3.5 text-mint-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Hạn nộp: {$selectedJobDetail.deadline}</span>
              </span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Details Body Content -->
      <div class="px-5 sm:px-6 py-5 space-y-5">
      <!-- Location & Schedule Highlights -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="rounded-2xl border border-obsidian-900/10 bg-alabaster-100/70 p-4">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-mint/30 text-mint-700 shrink-0">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span class="text-[11px] font-bold text-obsidian-600">Địa điểm làm việc</span>
          </div>
          <div class="text-xs sm:text-[13px] font-semibold text-obsidian-900 leading-relaxed flex flex-wrap items-center gap-1.5">
            <span>{$selectedJobDetail.location}</span>
            {#if $selectedJobDetail.wardName}
              <span class="inline-flex items-center rounded-full bg-alabaster-50 border border-obsidian-900/10 px-2.5 py-0.5 text-[11px] font-bold text-obsidian-700">
                {$selectedJobDetail.wardName}
              </span>
            {/if}
          </div>
        </div>

        <div class="rounded-2xl border border-obsidian-900/10 bg-alabaster-100/70 p-4">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-mint/30 text-mint-700 shrink-0">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span class="text-[11px] font-bold text-obsidian-600">Thời gian làm việc</span>
          </div>
          <p class="text-xs sm:text-[13px] font-semibold text-obsidian-900 leading-relaxed">
            {$selectedJobDetail.schedule}
          </p>
        </div>
      </div>

      {#if $selectedJobDetail.markdownContent}
        <!-- Render Markdown Job Description -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-mint-500"></span>
            <h3 class="font-display text-sm font-extrabold text-obsidian-900 tracking-tight">
              Nội dung chi tiết tuyển dụng
            </h3>
          </div>
          <div class="rounded-2xl border border-obsidian-900/10 bg-alabaster-50 p-4 sm:p-5 shadow-sm">
            {@html renderMarkdown($selectedJobDetail.markdownContent)}
          </div>
        </div>
      {:else}
        <!-- Structured Fallback Lists -->
        <div class="space-y-4">
          {#if $selectedJobDetail.description && $selectedJobDetail.description.length > 0}
            <div class="rounded-2xl border border-obsidian-900/10 bg-alabaster-50 p-4 sm:p-5 space-y-2.5">
              <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2">
                <span class="h-2 w-2 rounded-full bg-mint-500"></span>
                <h3 class="font-display text-sm font-extrabold text-obsidian-900">
                  Mô tả công việc
                </h3>
              </div>
              <ul class="space-y-2 text-xs sm:text-[13px] text-obsidian-700 pl-4 list-disc leading-relaxed">
                {#each $selectedJobDetail.description as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if $selectedJobDetail.requirements && $selectedJobDetail.requirements.length > 0}
            <div class="rounded-2xl border border-obsidian-900/10 bg-alabaster-50 p-4 sm:p-5 space-y-2.5">
              <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2">
                <span class="h-2 w-2 rounded-full bg-mint-500"></span>
                <h3 class="font-display text-sm font-extrabold text-obsidian-900">
                  Yêu cầu ứng viên
                </h3>
              </div>
              <ul class="space-y-2 text-xs sm:text-[13px] text-obsidian-700 pl-4 list-disc leading-relaxed">
                {#each $selectedJobDetail.requirements as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if $selectedJobDetail.benefits && $selectedJobDetail.benefits.length > 0}
            <div class="rounded-2xl border border-mint-500/30 bg-mint/10 p-4 sm:p-5 space-y-2.5">
              <div class="flex items-center gap-2 border-b border-obsidian-900/10 pb-2">
                <span class="h-2 w-2 rounded-full bg-mint-600"></span>
                <h3 class="font-display text-sm font-extrabold text-obsidian-900">
                  Quyền lợi dành cho sinh viên
                </h3>
              </div>
              <ul class="space-y-2 text-xs sm:text-[13px] text-obsidian-800 pl-4 list-disc leading-relaxed">
                {#each $selectedJobDetail.benefits as item}
                  <li class="font-medium text-obsidian-900">{item}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Skill / Topic Tags -->
      {#if $selectedJobDetail.tags && $selectedJobDetail.tags.length > 0}
        <div class="pt-3 border-t border-obsidian-900/10">
          <span class="text-[11px] font-bold text-obsidian-600 mb-2 block">Từ khóa chuyên môn</span>
          <div class="flex flex-wrap gap-1.5">
            {#each $selectedJobDetail.tags as tag}
              <span class="rounded-full bg-alabaster-100 border border-obsidian-900/10 px-3 py-1 font-mono text-[11px] font-semibold text-obsidian-700">
                #{tag}
              </span>
            {/each}
          </div>
        </div>
      {/if}
      </div>
    </div>

    <!-- Modal Pinned Footer -->
    <div class="shrink-0 border-t border-obsidian-900/10 bg-alabaster-100/90 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        {#if $currentUser?.role !== 'company'}
          <button
            type="button"
            onclick={() => toggleFavorite($selectedJobDetail!)}
            class="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 font-display text-xs font-bold transition-all duration-150 cursor-pointer
            {isSaved
              ? 'border-obsidian-900 bg-obsidian-900 text-mint shadow-sm'
              : 'border-obsidian-900/15 bg-alabaster-50 text-obsidian-900 hover:border-obsidian-900 hover:bg-alabaster-100'}"
          >
            <svg class="h-3.5 w-3.5 {isSaved ? 'fill-mint' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>{isSaved ? 'Đã ghim' : 'Ghim việc'}</span>
          </button>
        {/if}

        {#if isAuthor}
          <button
            type="button"
            onclick={handleEditJob}
            class="inline-flex items-center gap-1.5 rounded-full border border-obsidian-900/15 bg-alabaster-50 px-4 py-2 font-display text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-obsidian-900 hover:text-mint transition-all duration-150 cursor-pointer"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Chỉnh sửa tin</span>
          </button>
          <button
            type="button"
            onclick={handleDeleteJob}
            class="rounded-full border border-signal-crimson/30 bg-alabaster-50 text-signal-crimson px-3.5 py-2 font-display text-xs font-bold hover:bg-signal-crimson hover:text-alabaster-50 hover:border-signal-crimson transition-all duration-150 cursor-pointer"
          >
            Xóa
          </button>
        {/if}
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onclick={closeJobDetail}
          class="rounded-full px-4 py-2 font-display text-xs font-bold text-obsidian-600 hover:text-obsidian-900 hover:bg-alabaster-200/70 transition-colors cursor-pointer"
        >
          Đóng
        </button>
        {#if $currentUser?.role !== 'company'}
          <button
            type="button"
            onclick={handleApplyNow}
            class="rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 transition-all duration-150 shadow-sm cursor-pointer"
          >
            Ứng tuyển ngay →
          </button>
        {/if}
      </div>
    </div>
  {/if}
</Modal>
