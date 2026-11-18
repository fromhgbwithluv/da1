<script lang="ts">
  import type { Job } from '../types/job';
  import { favoriteJobs, toggleFavorite, openJobDetail, openCheckout } from '../stores/favorites';
  import { currentUser, openPostJobModal, deleteJob } from '../stores/auth';
  import { getCategoryLabel } from '../utils/formatters';
  import { url } from '../utils/url';
  import Badge from './Badge.svelte';

  let { job } = $props<{ job: Job }>();

  let isSaved = $derived($favoriteJobs.some((item) => item.id === job.id));

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

<div class="group relative flex flex-col justify-between rounded-3xl border border-obsidian-900/15 bg-alabaster-50 p-5 shadow-swiss-card transition-all duration-200 hover:-translate-y-0.5 hover:border-obsidian-900 hover:shadow-swiss-hover">
  <div>
    <!-- Image Box -->
    <div class="relative mb-4 h-44 w-full overflow-hidden rounded-2xl border border-obsidian-900/10 bg-alabaster-200">
      <img
        src={displayImage}
        alt={job.title}
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-obsidian-950/85 via-obsidian-950/20 to-transparent"></div>

      <!-- Category & Target Group -->
      <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[68%]">
        <Badge variant="black" text={job.targetGroup} size="sm" />
        {#if job.categories && job.categories.length > 1}
          {#each job.categories as cat}
            <Badge variant="white" text={getCategoryLabel(cat)} size="xs" />
          {/each}
        {/if}
      </div>

      <!-- Top-right Actions -->
      <div class="absolute top-3 right-3 flex items-center gap-1.5">
        {#if isAuthor}
          <button
            type="button"
            onclick={(e) => {
              e.stopPropagation();
              openPostJobModal(job);
            }}
            class="flex h-8 items-center gap-1 rounded-full bg-alabaster-50/95 px-2.5 font-mono text-[10px] font-bold uppercase text-obsidian-900 border border-obsidian-900/20 hover:bg-obsidian-900 hover:text-mint transition-colors shadow-xs"
            title="Chỉnh sửa bài đăng này"
          >
            <span>Sửa</span>
          </button>
        {/if}

        {#if $currentUser?.role !== 'company'}
          <button
            type="button"
            onclick={() => toggleFavorite(job)}
            class="flex h-8 w-8 items-center justify-center rounded-full border transition-all shadow-xs
            {isSaved
              ? 'bg-obsidian-900 text-mint border-obsidian-900'
              : 'bg-alabaster-50/90 text-obsidian-900 border-obsidian-900/20 hover:bg-mint'}"
            title={isSaved ? 'Bỏ ghim' : 'Ghim việc'}
            aria-label={isSaved ? 'Bỏ ghim' : 'Ghim việc'}
          >
            <svg class="h-4 w-4 {isSaved ? 'fill-mint text-mint' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Salary & Verified -->
      <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span class="font-mono text-xs font-extrabold tracking-tight bg-obsidian-900/95 text-mint px-3 py-1 rounded-full border border-mint/30">
          {job.salary}
        </span>

        {#if job.verified}
          <Badge variant="emerald" text="Xác thực ✓" size="xs" />
        {/if}
      </div>
    </div>

    <!-- Company & Posted Time -->
    <div class="mb-1.5 flex items-center justify-between text-xs text-obsidian-600 font-mono">
      {#if job.companyUsername}
        <a
          href={url(`/profile/${job.companyUsername}`)}
          class="font-bold text-obsidian-900 truncate max-w-[72%] hover:underline flex items-center gap-1"
          title={`Xem hồ sơ doanh nghiệp ${job.company}`}
        >
          <span class="truncate">{job.company}</span>
          <span class="text-[10px] font-normal text-obsidian-500 shrink-0">({job.companyUsername})</span>
        </a>
      {:else}
        <span class="font-bold text-obsidian-900 truncate max-w-[72%]">{job.company}</span>
      {/if}
      <span class="text-[10px] text-obsidian-500 shrink-0">{job.postedAt}</span>
    </div>

    <!-- Job Title -->
    <h3 class="mb-2 font-display text-base font-extrabold tracking-tight text-obsidian-900 line-clamp-2 leading-snug">
      <button
        type="button"
        class="text-left hover:text-signal-emerald transition-colors focus-visible:outline-none"
        onclick={() => openJobDetail(job)}
      >
        {job.title}
      </button>
    </h3>

    <!-- Summary -->
    <p class="mb-3.5 text-xs leading-relaxed text-obsidian-700 line-clamp-2">
      {job.summary}
    </p>

    <!-- Location & Schedule -->
    <div class="mb-3.5 space-y-1.5 text-xs text-obsidian-800 border-t border-b border-obsidian-900/10 py-2.5">
      <div class="flex items-center gap-2 truncate text-xs">
        <span class="font-mono text-[10px] font-bold uppercase text-obsidian-500 shrink-0">Địa điểm:</span>
        <span class="truncate font-medium">{job.location}</span>
        {#if job.wardName}
          <span class="text-[10px] font-mono bg-alabaster-100 text-obsidian-900 px-2 py-0.5 rounded-full border border-obsidian-900/10 shrink-0 font-semibold">
            {job.wardName}
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2 truncate text-xs">
        <span class="font-mono text-[10px] font-bold uppercase text-obsidian-500 shrink-0">Lịch làm:</span>
        <span class="truncate font-medium">{job.schedule}</span>
      </div>
    </div>

    <!-- Tags -->
    <div class="mb-4 flex flex-wrap gap-1.5">
      {#each job.tags.slice(0, 3) as tag}
        <span class="font-mono text-[10px] text-obsidian-700 bg-alabaster-100 px-2.5 py-0.5 rounded-full border border-obsidian-900/10">
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
        class="flex-1 rounded-full border border-obsidian-900/20 bg-alabaster-100 py-2 text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-alabaster-200 transition-colors text-center"
      >
        Chi tiết
      </button>

      {#if $currentUser?.role !== 'company'}
        <button
          type="button"
          onclick={() => toggleFavorite(job)}
          class="inline-flex items-center justify-center gap-1 rounded-full border px-3 py-2 text-xs font-bold transition-colors
          {isSaved
            ? 'border-obsidian-900 bg-obsidian-900 text-mint'
            : 'border-obsidian-900/20 bg-alabaster-50 text-obsidian-900 hover:border-obsidian-900'}"
        >
          <svg class="h-3.5 w-3.5 {isSaved ? 'fill-mint text-mint' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span class="text-[11px]">{isSaved ? 'Đã ghim' : 'Ghim'}</span>
        </button>

        <button
          type="button"
          onclick={() => openCheckout([job])}
          class="rounded-full bg-mint border border-obsidian-900/20 px-4 py-2 text-xs font-extrabold text-obsidian-900 hover:bg-mint-400 transition-colors"
        >
          Ứng tuyển
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
</div>
