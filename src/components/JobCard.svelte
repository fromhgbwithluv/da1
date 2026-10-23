<script lang="ts">
  import type { Job } from '../types/job';
  import { favoriteJobs, toggleFavorite, openJobDetail, openCheckout } from '../stores/favorites';
  import { currentUser, openPostJobModal, deleteJob } from '../stores/auth';
  import { getCategoryLabel } from '../utils/formatters';
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

<div class="group relative flex flex-col justify-between rounded-swiss-md border border-swiss-300 bg-white p-4 shadow-swiss-card transition-all duration-150 hover:border-black hover:shadow-swiss-hover">
  <!-- Top Details & Image -->
  <div>
    <!-- Image Box with Hairline Border -->
    <div class="relative mb-3.5 h-40 w-full overflow-hidden rounded-swiss-sm border border-swiss-200 bg-swiss-100">
      <img
        src={displayImage}
        alt={job.title}
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

      <!-- Category & Target Group in Monospace -->
      <div class="absolute top-2.5 left-2.5 flex flex-wrap gap-1 max-w-[65%]">
        <Badge variant="black" text={job.targetGroup} size="sm" />
        {#if job.categories && job.categories.length > 1}
          {#each job.categories as cat}
            <Badge variant="white" text={getCategoryLabel(cat)} size="xs" />
          {/each}
        {/if}
      </div>

      <!-- Actions in top-right: Edit (if author) & Bookmark -->
      <div class="absolute top-2.5 right-2.5 flex items-center gap-1.5">
        {#if isAuthor}
          <button
            type="button"
            onclick={(e) => {
              e.stopPropagation();
              openPostJobModal(job);
            }}
            class="flex h-7 items-center gap-1 rounded-swiss-sm bg-white/95 px-2 font-mono text-[10px] font-bold uppercase text-black border border-swiss-300 hover:bg-black hover:text-white hover:border-black transition-colors shadow-xs"
            title="Chỉnh sửa bài đăng này"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <span>Sửa</span>
          </button>
        {/if}

        {#if $currentUser?.role !== 'company'}
          <button
            type="button"
            onclick={() => toggleFavorite(job)}
            class="flex h-7 w-7 items-center justify-center rounded-swiss-sm border transition-colors shadow-xs
            {isSaved 
              ? 'bg-black text-white border-black' 
              : 'bg-white/90 text-black border-swiss-300 hover:bg-white hover:border-black'}"
            title={isSaved ? 'Bỏ ghim' : 'Ghim việc'}
            aria-label={isSaved ? 'Bỏ ghim' : 'Ghim việc'}
          >
            <svg class="h-3.5 w-3.5 {isSaved ? 'fill-white' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Salary & Verified at bottom of image -->
      <div class="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
        <span class="font-mono text-xs font-black tracking-tight bg-black/90 px-2.5 py-1 rounded-swiss-sm border border-neutral-700">
          {job.salary}
        </span>

        {#if job.verified}
          <Badge variant="emerald" text="VERIFIED ✓" size="xs" />
        {/if}
      </div>
    </div>

    <!-- Company & Posted Time -->
    <div class="mb-1.5 flex items-center justify-between text-xs text-swiss-500 font-mono">
      {#if job.companyUsername}
        <a
          href={`/profile/${job.companyUsername}`}
          class="font-bold text-black uppercase tracking-tight truncate max-w-[70%] hover:underline flex items-center gap-1 group/company"
          title={`Xem hồ sơ doanh nghiệp ${job.company}`}
        >
          <span class="truncate">{job.company}</span>
          <span class="text-[10px] font-normal text-swiss-500 lowercase group-hover/company:text-black shrink-0">({job.companyUsername})</span>
        </a>
      {:else}
        <span class="font-bold text-black uppercase tracking-tight truncate max-w-[70%]">{job.company}</span>
      {/if}
      <span class="text-[10px] text-swiss-400 shrink-0">{job.postedAt}</span>
    </div>

    <!-- Job Title -->
    <h3 class="mb-2 text-sm font-black tracking-tight text-black line-clamp-2 leading-snug">
      <button 
        type="button" 
        class="text-left hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
        onclick={() => openJobDetail(job)}
      >
        {job.title}
      </button>
    </h3>

    <!-- Summary description -->
    <p class="mb-3 text-xs leading-relaxed text-swiss-600 line-clamp-2">
      {job.summary}
    </p>

    <!-- Location & Schedule rows -->
    <div class="mb-3 space-y-1 text-xs text-swiss-700 font-mono border-t border-b border-swiss-100 py-2">
      <div class="flex items-center gap-2 truncate text-[11px]">
        <span class="text-swiss-400 font-bold shrink-0">LOC /</span>
        <span class="truncate">{job.location}</span>
        {#if job.wardName}
          <span class="text-[9px] font-mono bg-swiss-100 text-black px-1.5 py-0.2 rounded-swiss-xs border border-swiss-200 shrink-0 font-bold tracking-tight">
            {job.wardName}
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2 truncate text-[11px]">
        <span class="text-swiss-400 font-bold shrink-0">TIME/</span>
        <span class="truncate">{job.schedule}</span>
      </div>
    </div>

    <!-- Tags in Monospace -->
    <div class="mb-3 flex flex-wrap gap-1">
      {#each job.tags.slice(0, 3) as tag}
        <span class="font-mono text-[10px] text-swiss-600 bg-swiss-100 px-1.5 py-0.5 rounded-swiss-sm border border-swiss-200">
          #{tag}
        </span>
      {/each}
    </div>
  </div>

  <!-- Bottom CTA Actions & Author Bar -->
  <div>
    <div class="pt-2.5 border-t border-swiss-200 flex items-center gap-2">
      <!-- View Details -->
      <button
        type="button"
        onclick={() => openJobDetail(job)}
        class="flex-1 rounded-swiss-sm border border-swiss-300 bg-white py-1.5 text-xs font-bold uppercase tracking-wide text-black hover:border-black hover:bg-swiss-50 transition-colors text-center"
      >
        Chi tiết
      </button>

      {#if $currentUser?.role !== 'company'}
        <!-- Quick Bookmark Button -->
        <button
          type="button"
          onclick={() => toggleFavorite(job)}
          class="inline-flex items-center justify-center gap-1 rounded-swiss-sm border px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors
          {isSaved 
            ? 'border-black bg-black text-white' 
            : 'border-swiss-300 bg-white text-black hover:border-black'}"
        >
          <svg class="h-3.5 w-3.5 {isSaved ? 'fill-white' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span class="font-mono text-[10px]">{isSaved ? 'Đã ghim' : 'Ghim'}</span>
        </button>

        <!-- Apply now button -->
        <button
          type="button"
          onclick={() => openCheckout([job])}
          class="rounded-swiss-sm bg-black px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors shadow-swiss-card"
        >
          Ứng tuyển
        </button>
      {/if}
    </div>

    {#if isAuthor}
      <!-- Author Quick Actions Toolbar -->
      <div class="mt-2.5 pt-2 border-t border-dashed border-swiss-300 flex items-center justify-between font-mono text-[10px]">
        <span class="text-swiss-500 font-bold uppercase tracking-tight flex items-center gap-1">
          <span class="h-1.5 w-1.5 rounded-full bg-signal-emerald inline-block"></span>
          Bài đăng của bạn
        </span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => openPostJobModal(job)}
            class="font-bold text-black hover:underline"
          >
            [ Sửa tin ]
          </button>
          <span class="text-swiss-300">•</span>
          <button
            type="button"
            onclick={handleDeleteJob}
            class="text-signal-crimson hover:underline"
          >
            [ Xóa ]
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
