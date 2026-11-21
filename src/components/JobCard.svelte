<script lang="ts">
  import type { Job } from '../types/job';
  import { favoriteJobs, toggleFavorite, openJobDetail, openCheckout } from '../stores/favorites';
  import { currentUser, openPostJobModal, deleteJob } from '../stores/auth';
  import { getCategoryLabel } from '../utils/formatters';
  import { shareJob } from '../utils/share';
  import { url } from '../utils/url';

  let { job } = $props<{ job: Job }>();

  let isSaved = $derived($favoriteJobs.some((item) => item.id === job.id));
  let justShared = $state(false);

  async function handleShare(e: MouseEvent) {
    e.stopPropagation();
    const result = await shareJob(job);
    if (result === 'copied' || result === 'shared') {
      justShared = true;
      setTimeout(() => {
        justShared = false;
      }, 1800);
    }
  }

  let isAuthor = $derived(
    !!$currentUser && (
      $currentUser.id === job.authorId ||
      ('@' + $currentUser.username).toLowerCase() === job.companyUsername?.toLowerCase() ||
      ($currentUser.role === 'company' && $currentUser.fullName === job.company)
    )
  );

  let displayImage = $derived(
    job.imageUrl?.trim() ||
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
  );

  function handleDeleteJob() {
    if (confirm(`Bạn có chắc chắn muốn xóa tin tuyển dụng "${job.title}" không?`)) {
      deleteJob(job.id);
    }
  }
</script>

<article
  class="group relative flex flex-col justify-between rounded-3xl border border-obsidian-900/15 bg-alabaster-50 p-4 sm:p-5 shadow-swiss-card transition-all duration-200 hover:-translate-y-1 hover:border-obsidian-900 hover:shadow-swiss-hover"
>
  <div>
    <!-- Clickable Thumbnail Image Container (No dark gradient smothering image, no black overlays) -->
    <div class="relative mb-4 h-44 w-full overflow-hidden rounded-2xl border border-obsidian-900/10 bg-alabaster-200">
      <button
        type="button"
        onclick={() => openJobDetail(job)}
        class="block h-full w-full text-left cursor-pointer focus-visible:outline-none"
        aria-label={`Xem chi tiết ${job.title}`}
      >
        <img
          src={displayImage}
          alt={job.title}
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <!-- Subtle hover-only scrim & pill affordance -->
        <div
          class="pointer-events-none absolute inset-0 bg-obsidian-950/0 group-hover:bg-obsidian-950/20 transition-colors flex items-center justify-center"
        >
          <span
            class="opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 rounded-full bg-alabaster-50/95 backdrop-blur-md px-3.5 py-1 font-display text-[11px] font-extrabold text-obsidian-900 shadow-sm"
          >
            Xem chi tiết →
          </span>
        </div>
      </button>

      <!-- Top-left Year / Target Group Frosted Badge (Pass clicks through to image button) -->
      <div class="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-alabaster-50/95 backdrop-blur-md border border-obsidian-900/15 px-3 py-1 font-display text-[11px] font-extrabold text-obsidian-900 shadow-sm"
        >
          <span class="h-2 w-2 rounded-full bg-mint-500 shrink-0"></span>
          <span>{job.targetGroup}</span>
        </span>
      </div>

      <!-- Bottom-left Salary Frosted Pill (Soft Mint — No Black Background!) -->
      <div class="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]">
        <span
          class="inline-flex items-center rounded-full bg-mint/95 backdrop-blur-md border border-obsidian-900/15 px-3 py-1 font-mono text-xs font-extrabold text-obsidian-900 shadow-sm truncate max-w-full"
        >
          {job.salary}
        </span>
      </div>

      <!-- Top-right Sibling Floating Actions -->
      <div class="absolute top-3 right-3 flex items-center gap-1.5">
        {#if isAuthor}
          <button
            type="button"
            onclick={(e) => {
              e.stopPropagation();
              openPostJobModal(job);
            }}
            class="flex h-8 items-center gap-1 rounded-full bg-alabaster-50/95 backdrop-blur-md px-3 font-mono text-[10px] font-bold uppercase text-obsidian-900 border border-obsidian-900/15 hover:bg-obsidian-900 hover:text-mint transition-colors shadow-sm cursor-pointer"
            title="Chỉnh sửa bài đăng này"
          >
            <span>Sửa</span>
          </button>
        {/if}

        <button
          type="button"
          onclick={handleShare}
          class="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md border shadow-sm transition-all cursor-pointer
          {justShared
            ? 'bg-mint text-obsidian-900 border-obsidian-900'
            : 'bg-alabaster-50/95 text-obsidian-900 border-obsidian-900/15 hover:bg-mint hover:border-obsidian-900'}"
          title={justShared ? 'Đã sao chép liên kết' : 'Chia sẻ tin tuyển dụng'}
          aria-label={`Chia sẻ ${job.title}`}
        >
          {#if justShared}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          {/if}
        </button>

        {#if $currentUser?.role !== 'company'}
          <button
            type="button"
            onclick={() => toggleFavorite(job)}
            class="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md border shadow-sm transition-all
            {isSaved
              ? 'bg-mint text-obsidian-900 border-obsidian-900'
              : 'bg-alabaster-50/95 text-obsidian-900 border-obsidian-900/15 hover:bg-mint hover:border-obsidian-900'}"
            title={isSaved ? 'Bỏ ghim' : 'Ghim việc'}
            aria-label={isSaved ? 'Bỏ ghim' : 'Ghim việc'}
          >
            <svg class="h-4 w-4 {isSaved ? 'fill-obsidian-900 text-obsidian-900' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Company & Verified Header Row -->
    <div class="flex items-center justify-between gap-2 text-xs">
      <div class="flex items-center gap-1.5 min-w-0">
        {#if job.companyUsername}
          <a
            href={url(`/profile/${job.companyUsername}`)}
            class="font-bold text-obsidian-800 hover:text-obsidian-900 hover:underline truncate"
            title={`Xem hồ sơ doanh nghiệp ${job.company}`}
          >
            {job.company}
          </a>
        {:else}
          <span class="font-bold text-obsidian-800 truncate">{job.company}</span>
        {/if}
        <span class="text-swiss-400 shrink-0">•</span>
        <span class="text-[11px] text-swiss-500 shrink-0">{job.postedAt}</span>
      </div>

      {#if job.verified}
        <span
          class="inline-flex items-center gap-1 rounded-full bg-mint-50 border border-mint-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-mint-800 whitespace-nowrap shrink-0"
        >
          <span>✓</span>
          <span>Xác thực</span>
        </span>
      {/if}
    </div>

    <!-- Job Title -->
    <h3 class="mt-1.5 mb-2.5 font-display text-base sm:text-[17px] font-extrabold tracking-tight text-obsidian-900 line-clamp-2 leading-snug">
      <button
        type="button"
        class="text-left hover:text-mint-700 transition-colors focus-visible:outline-none"
        onclick={() => openJobDetail(job)}
      >
        {job.title}
      </button>
    </h3>


    <!-- Summary -->
    <p class="mb-3 text-xs leading-relaxed text-obsidian-600 line-clamp-2">
      {job.summary}
    </p>

    <!-- Location & Schedule Metadata -->
    <div class="mb-3 space-y-1.5 text-xs text-obsidian-700 border-t border-b border-obsidian-900/10 py-2.5">
      <div class="flex items-center gap-2 min-w-0">
        <svg class="h-3.5 w-3.5 text-mint-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="truncate font-medium">{job.location}</span>
        {#if job.wardName}
          <span class="text-[10px] font-mono bg-alabaster-100 text-obsidian-800 px-2 py-0.5 rounded-full border border-obsidian-900/10 shrink-0 font-semibold">
            {job.wardName}
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2 min-w-0">
        <svg class="h-3.5 w-3.5 text-mint-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="truncate font-medium">{job.schedule}</span>
      </div>
    </div>

    <!-- Tags & Multi-Category Chips -->
    <div class="mb-4 flex flex-wrap gap-1.5">
      {#if job.categories && job.categories.length > 1}
        {#each job.categories as cat}
          <span class="font-mono text-[10px] font-bold text-obsidian-900 bg-mint/30 px-2.5 py-0.5 rounded-full border border-mint-500/30">
            {getCategoryLabel(cat)}
          </span>
        {/each}
      {/if}
      {#each job.tags.slice(0, 3) as tag}
        <span class="rounded-full bg-alabaster-100 border border-obsidian-900/10 px-2.5 py-0.5 text-[11px] font-medium text-obsidian-700">
          #{tag}
        </span>
      {/each}
    </div>
  </div>

  <!-- Bottom Actions -->
  <div>
    <div class="pt-3 border-t border-obsidian-900/10 flex items-center gap-2">
      <button
        type="button"
        onclick={() => openJobDetail(job)}
        class="flex-1 rounded-full border border-obsidian-900/15 bg-alabaster-100/80 py-2.5 px-4 font-display text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-alabaster-200/70 transition-all text-center"
      >
        Chi tiết
      </button>

      {#if $currentUser?.role !== 'company'}
        <button
          type="button"
          onclick={() => openCheckout([job])}
          class="group/apply flex-[1.2] inline-flex items-center justify-center gap-1.5 rounded-full bg-obsidian-900 py-2.5 px-4 font-display text-xs font-bold text-alabaster-50 hover:bg-obsidian-800 hover:shadow-mint-glow transition-all"
        >
          <span>Ứng tuyển</span>
          <span class="text-mint font-mono font-black transition-transform duration-200 group-hover/apply:translate-x-0.5">→</span>
        </button>
      {/if}
    </div>

    {#if isAuthor}
      <div class="mt-3 pt-2.5 border-t border-dashed border-obsidian-900/20 flex items-center justify-between font-mono text-[11px]">
        <span class="text-obsidian-700 font-bold flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-mint-500 inline-block"></span>
          Tin đăng của bạn
        </span>
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            onclick={() => openPostJobModal(job)}
            class="font-bold text-obsidian-900 hover:underline"
          >
            Sửa tin
          </button>
          <span>•</span>
          <button
            type="button"
            onclick={handleDeleteJob}
            class="text-signal-crimson font-bold hover:underline"
          >
            Xóa
          </button>
        </div>
      </div>
    {/if}
  </div>
</article>
