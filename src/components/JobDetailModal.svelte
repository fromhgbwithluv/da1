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
  import Badge from './Badge.svelte';

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
  bodyClass="p-0"
  ariaLabel={$selectedJobDetail?.title || 'Chi tiết việc làm'}
>
  {#if $selectedJobDetail}
    <!-- Top banner image (Swiss Layout) -->
    <div class="relative h-56 w-full overflow-hidden bg-black border-b border-black">
      <img
        src={$selectedJobDetail.imageUrl}
        alt={$selectedJobDetail.title}
        class="h-full w-full object-cover opacity-60"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

      <!-- Close button -->
      <button
        type="button"
        onclick={closeJobDetail}
        class="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-swiss-sm bg-black text-white border border-neutral-700 hover:border-white transition-colors cursor-pointer"
        aria-label="Đóng"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Category & Group Badge in Monospace -->
      <div class="absolute top-3.5 left-4 flex flex-wrap items-center gap-2 max-w-[65%]">
        <Badge variant="black" size="xs">{$selectedJobDetail.targetGroup}</Badge>
        {#if $selectedJobDetail.categories && $selectedJobDetail.categories.length > 1}
          {#each $selectedJobDetail.categories as cat}
            <Badge variant="white" size="xs">{getCategoryLabel(cat)}</Badge>
          {/each}
        {/if}
        {#if $selectedJobDetail.verified}
          <Badge variant="emerald" size="xs">VERIFIED ✓</Badge>
        {/if}
      </div>

        <!-- Bottom title on banner -->
        <div class="absolute bottom-4 left-6 right-6 text-white">
          {#if $selectedJobDetail.companyUsername}
            <a
              href={url(`/profile/${$selectedJobDetail.companyUsername}`)}
              class="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white hover:underline bg-black/60 px-2 py-0.5 rounded border border-neutral-700 hover:border-white transition-colors"
            >
              <span>{$selectedJobDetail.company}</span>
              <span class="text-neutral-400 lowercase font-normal">({$selectedJobDetail.companyUsername})</span>
              <span class="text-[10px] text-signal-emerald">↗ Xem hồ sơ công ty</span>
            </a>
          {:else}
            <span class="font-mono text-[11px] font-bold uppercase tracking-wide text-neutral-300">
              {$selectedJobDetail.company}
            </span>
          {/if}
          <h2 class="text-xl font-black uppercase tracking-tight sm:text-2xl mt-1 leading-snug">
            {$selectedJobDetail.title}
          </h2>
          <div class="mt-2 flex flex-wrap items-center gap-4 font-mono text-xs text-neutral-300">
            <span class="font-bold text-signal-emerald">{$selectedJobDetail.salary}</span>
            <span>• {$selectedJobDetail.workType}</span>
            <span>• HẠN: {$selectedJobDetail.deadline}</span>
          </div>
        </div>
      </div>

      <!-- Modal Body Content -->
      <div class="max-h-[58vh] overflow-y-auto p-6 space-y-6">
        <!-- Highlights Box in Monospace -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-swiss-sm bg-swiss-50 p-3.5 border border-swiss-300 font-mono text-xs">
          <div>
            <span class="text-swiss-400 text-[10px] uppercase font-bold block">ĐỊA ĐIỂM / LOCATION</span>
            <div class="font-bold text-black flex flex-wrap items-center gap-1.5">
              <span>{$selectedJobDetail.location}</span>
              {#if $selectedJobDetail.wardName}
                <Badge variant="black" size="xs">{$selectedJobDetail.wardName}</Badge>
              {/if}
            </div>
          </div>
          <div>
            <span class="text-swiss-400 text-[10px] uppercase font-bold block">THỜI GIAN / SCHEDULE</span>
            <span class="font-bold text-black">{$selectedJobDetail.schedule}</span>
          </div>
        </div>

        {#if $selectedJobDetail.markdownContent}
          <!-- Render Markdown Job Description -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 border-b border-black pb-1">
              <span class="font-mono text-xs font-black text-black">MARKDOWN //</span>
              <h3 class="text-xs font-black uppercase tracking-wider text-black">
                Nội dung chi tiết tuyển dụng
              </h3>
            </div>
            <div class="rounded-swiss-sm border border-swiss-200 bg-white p-4">
              {@html renderMarkdown($selectedJobDetail.markdownContent)}
            </div>
          </div>
        {:else}
          <!-- Structured Fallback Lists -->
          {#if $selectedJobDetail.description && $selectedJobDetail.description.length > 0}
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-black pb-1">
                <span class="font-mono text-xs font-black text-black">01 //</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-black">
                  Mô tả công việc (Job Description)
                </h3>
              </div>
              <ul class="space-y-1.5 text-xs text-swiss-800 pl-4 list-disc font-medium">
                {#each $selectedJobDetail.description as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if $selectedJobDetail.requirements && $selectedJobDetail.requirements.length > 0}
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-black pb-1">
                <span class="font-mono text-xs font-black text-black">02 //</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-black">
                  Yêu cầu ứng viên
                </h3>
              </div>
              <ul class="space-y-1.5 text-xs text-swiss-800 pl-4 list-disc font-medium">
                {#each $selectedJobDetail.requirements as item}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if $selectedJobDetail.benefits && $selectedJobDetail.benefits.length > 0}
            <div class="space-y-2">
              <div class="flex items-center gap-2 border-b border-black pb-1">
                <span class="font-mono text-xs font-black text-black">03 //</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-black">
                  Quyền lợi dành cho sinh viên
                </h3>
              </div>
              <ul class="space-y-1.5 text-xs text-swiss-800 pl-4 list-disc font-medium">
                {#each $selectedJobDetail.benefits as item}
                  <li class="font-bold text-black">{item}</li>
                {/each}
              </ul>
            </div>
          {/if}
        {/if}

        <!-- Tags in Monospace -->
        <div class="pt-2 border-t border-swiss-200">
          <span class="font-mono text-[10px] uppercase font-bold text-swiss-500 mb-2 block">Thẻ từ khóa chuyên môn:</span>
          <div class="flex flex-wrap gap-1.5">
            {#each $selectedJobDetail.tags as tag}
              <Badge variant="gray" size="xs">#{tag}</Badge>
            {/each}
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="border-t border-black bg-swiss-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          {#if $currentUser?.role !== 'company'}
            <button
              type="button"
              onclick={() => toggleFavorite($selectedJobDetail!)}
              class="inline-flex items-center gap-1.5 rounded-swiss-sm border px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors
              {isSaved 
                ? 'border-black bg-black text-white' 
                : 'border-swiss-300 bg-white text-black hover:border-black'}"
            >
              <svg class="h-3.5 w-3.5 {isSaved ? 'fill-white' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>{isSaved ? 'Đã ghim' : 'Ghim việc'}</span>
            </button>
          {/if}

          {#if isAuthor}
            <button
              type="button"
              onclick={handleEditJob}
              class="inline-flex items-center gap-1.5 rounded-swiss-sm border border-black bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wide text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <span>Chỉnh sửa tin</span>
            </button>
            <button
              type="button"
              onclick={handleDeleteJob}
              class="rounded-swiss-sm border border-signal-crimson/40 text-signal-crimson px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-signal-crimson hover:text-white transition-colors cursor-pointer"
            >
              Xóa
            </button>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={closeJobDetail}
            class="rounded-swiss-sm px-4 py-2 font-mono text-xs font-bold uppercase text-swiss-600 hover:text-black transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {#if $currentUser?.role !== 'company'}
            <button
              type="button"
              onclick={handleApplyNow}
              class="rounded-swiss-sm bg-black px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors shadow-swiss-card cursor-pointer"
            >
              Ứng tuyển ngay →
            </button>
          {/if}
        </div>
      </div>
  {/if}
</Modal>
