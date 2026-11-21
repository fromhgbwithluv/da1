<script lang="ts">
  import { onMount } from 'svelte';
  import { rankedDatabaseJobs, openPostJobModal, openAuthModal, currentUser } from '../stores/auth';
  import { getLenis } from '../utils/smoothScroll';
  import type { Job } from '../types/job';
  import FilterTabs from './FilterTabs.svelte';
  import JobCard from './JobCard.svelte';

  const ITEMS_PER_PAGE = 12;
  const VALID_CATEGORIES = ['part-time', 'internship', 'fresher', 'project'] as const;

  const CATEGORY_TITLES: Record<string, string> = {
    all: 'Tìm việc làm phân tầng sinh viên | TopSiVi',
    'part-time': 'Việc làm Năm 1, 2 • Part-time linh hoạt | TopSiVi',
    internship: 'Việc làm Năm 3, 4 • Thực tập sinh có dấu mộc | TopSiVi',
    fresher: 'Việc làm Mới tốt nghiệp • Fresher Full-time | TopSiVi',
    project: 'Việc làm theo Dự án • Thực chiến theo đầu việc | TopSiVi',
  };

  let { isHomePage = false, maxItems = 3, initialCategory = 'all' } = $props<{
    isHomePage?: boolean;
    maxItems?: number;
    initialCategory?: string;
  }>();

  let selectedCategory = $state<string>(initialCategory);
  let searchQuery = $state<string>('');
  let selectedLocation = $state<string>('all');
  let selectedWard = $state<string>('all');
  let currentPage = $state<number>(1);
  let listingsTopEl = $state<HTMLDivElement | null>(null);

  function getCategoryFromPathname(pathname: string): string {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const normalized = pathname.replace(/\/$/, '');
    const prefix = `${base}/jobs/`;
    if (normalized.startsWith(prefix)) {
      const segment = normalized.slice(prefix.length).split('/')[0];
      if ((VALID_CATEGORIES as readonly string[]).includes(segment)) {
        return segment;
      }
    }
    return 'all';
  }

  function syncUrlWithCategory(cat: string) {
    if (isHomePage || typeof window === 'undefined') return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const targetPath = cat === 'all' ? `${base}/jobs` : `${base}/jobs/${cat}`;
    const currentNormalized = window.location.pathname.replace(/\/$/, '');

    if (currentNormalized !== targetPath) {
      window.history.pushState({ category: cat }, '', targetPath);
    }

    if (CATEGORY_TITLES[cat]) {
      document.title = CATEGORY_TITLES[cat];
    }
  }

  onMount(() => {
    if (isHomePage) return;

    const urlCat = getCategoryFromPathname(window.location.pathname);
    if (urlCat !== selectedCategory) {
      selectedCategory = urlCat;
    }

    const onPopState = () => {
      const cat = getCategoryFromPathname(window.location.pathname);
      selectedCategory = cat;
      currentPage = 1;
      if (CATEGORY_TITLES[cat]) {
        document.title = CATEGORY_TITLES[cat];
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  });

  let allJobs = $derived($rankedDatabaseJobs);

  import { normalizeVietnamese } from '../data/provinces';

  // Group active posted jobs by location code (dựa vào những bài đã được đăng để liệt kê các thành phố)
  let activeLocations = $derived.by(() => {
    const locMap = new Map<string, { code: string; name: string; count: number }>();

    for (const job of allJobs) {
      const code = job.provinceCode || 'other';
      const name = job.provinceName || (code === 'remote' ? 'Online / Remote' : 'Khác');
      if (!locMap.has(code)) {
        locMap.set(code, { code, name, count: 0 });
      }
      locMap.get(code)!.count += 1;
    }

    return Array.from(locMap.values()).sort((a, b) => {
      if (a.code === 'remote') return 1;
      if (b.code === 'remote') return -1;
      return b.count - a.count || a.name.localeCompare(b.name, 'vi');
    });
  });

  // Group active wards in the currently selected province
  let activeWards = $derived.by(() => {
    if (selectedLocation === 'all' || selectedLocation === 'remote') return [];
    const wardMap = new Map<string, { code: string; name: string; count: number }>();
    for (const job of allJobs) {
      if (job.provinceCode === selectedLocation && job.wardCode) {
        if (!wardMap.has(job.wardCode)) {
          wardMap.set(job.wardCode, {
            code: job.wardCode,
            name: job.wardName || job.wardCode,
            count: 0
          });
        }
        wardMap.get(job.wardCode)!.count += 1;
      }
    }
    return Array.from(wardMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  });

  // Strict structured location & ward matching (Zero fragile keyword heuristics)
  function matchesLocation(job: Job, selectedLoc: string, selectedW: string): boolean {
    if (selectedLoc === 'all') return true;

    if (selectedLoc === 'remote') {
      return job.provinceCode === 'remote' || job.workType === 'Remote';
    }

    // Exact province code match
    if (job.provinceCode !== selectedLoc) {
      return false;
    }

    // Exact ward code match (if a specific ward is selected)
    if (selectedW !== 'all') {
      return job.wardCode === selectedW;
    }

    return true;
  }

  // Filter logic
  let filteredJobs = $derived(
    allJobs.filter((job) => {
      // Category match (supports multi-category jobs)
      if (selectedCategory !== 'all') {
        const cats = job.categories && job.categories.length > 0 ? job.categories : [job.category];
        if (!cats.includes(selectedCategory as any)) {
          return false;
        }
      }

      // Location match: EXACT province code & ward code
      if (!matchesLocation(job, selectedLocation, selectedWard)) {
        return false;
      }

      // Keyword match (title, company, description, tags)
      if (searchQuery.trim() !== '') {
        const q = normalizeVietnamese(searchQuery);
        const inTitle = normalizeVietnamese(job.title).includes(q);
        const inCompany = normalizeVietnamese(job.company).includes(q);
        const inSummary = normalizeVietnamese(job.summary || '').includes(q);
        const inTags = (job.tags || []).some((t) => normalizeVietnamese(t).includes(q));
        if (!inTitle && !inCompany && !inSummary && !inTags) {
          return false;
        }
      }

      return true;
    })
  );

  let totalPages = $derived(Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE)));

  let paginatedJobs = $derived.by(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredJobs.slice(start, start + ITEMS_PER_PAGE);
  });

  let displayedJobs = $derived(isHomePage ? filteredJobs.slice(0, maxItems) : paginatedJobs);

  let pageRangeStart = $derived(
    filteredJobs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  );
  let pageRangeEnd = $derived(Math.min(currentPage * ITEMS_PER_PAGE, filteredJobs.length));

  let visiblePages = $derived.by<(number | '...')[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push('...');
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  });

  $effect(() => {
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
  });

  function goToPage(page: number) {
    const clamped = Math.min(Math.max(1, page), totalPages);
    currentPage = clamped;
    if (listingsTopEl && typeof window !== 'undefined') {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(listingsTopEl, { offset: -96 });
      } else {
        const y = listingsTopEl.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  }

  // Tab counts
  let counts = $derived({
    all: allJobs.length,
    'part-time': allJobs.filter((j) => (j.categories && j.categories.length > 0 ? j.categories.includes('part-time') : j.category === 'part-time')).length,
    internship: allJobs.filter((j) => (j.categories && j.categories.length > 0 ? j.categories.includes('internship') : j.category === 'internship')).length,
    fresher: allJobs.filter((j) => (j.categories && j.categories.length > 0 ? j.categories.includes('fresher') : j.category === 'fresher')).length,
    project: allJobs.filter((j) => (j.categories && j.categories.length > 0 ? j.categories.includes('project') : j.category === 'project')).length,
  });

  function handleSelectCategory(cat: string) {
    selectedCategory = cat;
    currentPage = 1;
    syncUrlWithCategory(cat);
  }

  function handleSearchChange(query: string) {
    searchQuery = query;
    currentPage = 1;
  }

  function handleSelectLocation(loc: string) {
    selectedLocation = loc;
    selectedWard = 'all'; // Reset ward filter when changing city
    currentPage = 1;
  }

  function handleSelectWard(w: string) {
    selectedWard = w;
    currentPage = 1;
  }

  function handleReset() {
    selectedCategory = 'all';
    searchQuery = '';
    selectedLocation = 'all';
    selectedWard = 'all';
    currentPage = 1;
    syncUrlWithCategory('all');
  }
</script>

<div class="space-y-6">
  <!-- Filter Controls Island -->
  <FilterTabs
    {selectedCategory}
    {searchQuery}
    {selectedLocation}
    {selectedWard}
    {counts}
    {activeLocations}
    {activeWards}
    onSelectCategory={handleSelectCategory}
    onSearchChange={handleSearchChange}
    onSelectLocation={handleSelectLocation}
    onSelectWard={handleSelectWard}
    onReset={handleReset}
  />

  <!-- Results Header Bar -->
  <div
    bind:this={listingsTopEl}
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-obsidian-900/10 pb-4 pt-1"
  >
    <div>
      <div class="flex flex-wrap items-center gap-2.5">
        <h2 class="font-display text-lg sm:text-xl font-extrabold tracking-tight text-obsidian-900">
          Vị trí phù hợp
        </h2>
        <span class="inline-flex items-center rounded-full bg-mint px-3 py-0.5 font-mono text-xs font-extrabold text-obsidian-900">
          {filteredJobs.length} kết quả
        </span>
        {#if !isHomePage && filteredJobs.length > 0}
          <span class="font-mono text-xs font-medium text-swiss-500">
            Hiển thị {pageRangeStart}–{pageRangeEnd} / {filteredJobs.length} • Trang {currentPage}/{totalPages}
          </span>
        {/if}
      </div>
      <p class="text-xs sm:text-sm text-obsidian-600 mt-1">
        {#if selectedCategory === 'all'}
          Hiển thị toàn bộ cơ hội việc làm đã qua kiểm định TopSiVi
        {:else if selectedCategory === 'part-time'}
          Nhóm 01: Việc làm part-time an toàn, thời gian linh hoạt
        {:else if selectedCategory === 'internship'}
          Nhóm 02: Vị trí thực tập sinh có phụ cấp, dấu mộc & mentor
        {:else if selectedCategory === 'fresher'}
          Nhóm 03: Cơ hội việc làm Fresher Full-time cho sinh viên mới tốt nghiệp
        {:else}
          Nhóm 04: Việc làm theo dự án ngắn hạn — nhận đầu việc rõ ràng, thanh toán theo sản phẩm bàn giao
        {/if}
      </p>
    </div>

    {#if searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedWard !== 'all'}
      <button
        type="button"
        onclick={handleReset}
        class="inline-flex items-center gap-1.5 rounded-full border border-obsidian-900/20 bg-alabaster-50 px-4 py-2 text-xs font-bold text-obsidian-900 hover:border-obsidian-900 hover:bg-mint/25 transition-all self-start sm:self-auto"
      >
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Đặt lại bộ lọc</span>
      </button>
    {/if}
  </div>

  <!-- Job Cards Grid -->
  {#if displayedJobs.length > 0}
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each displayedJobs as job (job.id)}
        <JobCard {job} />
      {/each}
    </div>

    <!-- Pagination Controls Bar (12 items per page) -->
    {#if !isHomePage && totalPages > 1}
      <nav
        aria-label="Phân trang danh sách việc làm"
        class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-obsidian-900/15 bg-alabaster-50 px-5 py-4 shadow-swiss-card"
      >
        <p class="font-mono text-xs text-obsidian-600">
          Hiển thị <strong class="text-obsidian-900">{pageRangeStart}–{pageRangeEnd}</strong> trong
          <strong class="text-obsidian-900">{filteredJobs.length}</strong> việc làm (Trang {currentPage}/{totalPages})
        </p>

        <div class="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onclick={() => goToPage(currentPage - 1)}
            class="inline-flex items-center gap-1.5 rounded-full border border-obsidian-900/15 bg-alabaster-100/70 px-3.5 py-1.5 text-xs font-bold text-obsidian-800 transition-all hover:border-obsidian-900 hover:bg-mint/25 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>←</span>
            <span>Trang trước</span>
          </button>

          {#each visiblePages as item}
            {#if item === '...'}
              <span class="px-2 font-mono text-xs text-swiss-500">...</span>
            {:else}
              <button
                type="button"
                onclick={() => goToPage(item)}
                aria-current={currentPage === item ? 'page' : undefined}
                class="flex h-8 min-w-[2rem] items-center justify-center rounded-full px-2.5 font-mono text-xs transition-all
                  {currentPage === item
                    ? 'bg-obsidian-900 text-mint font-extrabold shadow-xs'
                    : 'border border-obsidian-900/15 bg-alabaster-100/70 text-obsidian-800 font-bold hover:border-obsidian-900 hover:bg-mint/25'}"
              >
                {item}
              </button>
            {/if}
          {/each}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onclick={() => goToPage(currentPage + 1)}
            class="inline-flex items-center gap-1.5 rounded-full border border-obsidian-900/15 bg-alabaster-100/70 px-3.5 py-1.5 text-xs font-bold text-obsidian-800 transition-all hover:border-obsidian-900 hover:bg-mint/25 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Trang sau</span>
            <span>→</span>
          </button>
        </div>
      </nav>
    {/if}

    {#if isHomePage && filteredJobs.length > maxItems}
      <!-- Call to Action Banner on Homepage -->
      <div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-obsidian-900/15 bg-alabaster-50 p-6 shadow-swiss-card">
        <div>
          <span class="inline-flex items-center rounded-full bg-mint px-3 py-0.5 font-mono text-[11px] font-extrabold text-obsidian-900">
            Gợi ý {displayedJobs.length} / {allJobs.length} việc làm ưu tiên
          </span>
          <h3 class="font-display text-base sm:text-lg font-extrabold tracking-tight text-obsidian-900 mt-2">
            Khám phá thêm hàng chục cơ hội việc làm tuyển chọn khác
          </h3>
          <p class="text-xs sm:text-sm text-obsidian-600 mt-0.5">
            Xem toàn bộ việc làm với đầy đủ bộ lọc phân tầng, tỉnh thành, phường xã và tìm kiếm chuyên sâu.
          </p>
        </div>

        <a
          href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/jobs`}
          class="group inline-flex items-center gap-2.5 rounded-full bg-obsidian-900 px-6 py-3 font-display text-xs sm:text-sm font-bold text-alabaster-50 hover:bg-obsidian-800 hover:shadow-mint-glow transition-all shrink-0"
        >
          <span>Xem tất cả công việc ({allJobs.length} việc)</span>
          <span class="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-obsidian-900 font-mono text-xs font-black transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </a>
      </div>
    {/if}
  {:else if allJobs.length === 0}
    <!-- Empty Database State -->
    <div class="rounded-3xl border border-dashed border-obsidian-900/20 bg-alabaster-50 p-12 text-center shadow-swiss-card">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-obsidian-900/15 bg-alabaster-100 text-obsidian-700">
        <svg class="h-6 w-6 text-mint-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="font-display text-base sm:text-lg font-extrabold text-obsidian-900 mb-2">
        Chưa có bài tuyển dụng nào trên hệ thống
      </h3>
      <p class="text-xs sm:text-sm text-obsidian-600 max-w-md mx-auto leading-relaxed mb-6">
        Doanh nghiệp có thể đăng ký tài khoản Doanh nghiệp và đăng bài tuyển dụng mới bằng Markdown ngay bây giờ.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        {#if $currentUser?.role === 'company'}
          <button
            type="button"
            onclick={() => openPostJobModal()}
            class="rounded-full bg-obsidian-900 px-6 py-3 font-display text-xs font-bold text-mint hover:bg-obsidian-800 hover:shadow-mint-glow transition-all"
          >
            + Đăng tin tuyển dụng (Markdown)
          </button>
        {:else if !$currentUser}
          <button
            type="button"
            onclick={() => openAuthModal('register')}
            class="rounded-full bg-obsidian-900 px-6 py-3 font-display text-xs font-bold text-mint hover:bg-obsidian-800 hover:shadow-mint-glow transition-all"
          >
            Đăng ký tài khoản mới →
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Empty Search State -->
    <div class="rounded-3xl border border-dashed border-obsidian-900/20 bg-alabaster-50 p-12 text-center shadow-swiss-card">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-obsidian-900/15 bg-alabaster-100 text-obsidian-700">
        <svg class="h-6 w-6 text-mint-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 class="font-display text-base sm:text-lg font-extrabold text-obsidian-900 mb-2">
        Không tìm thấy kết quả phù hợp
      </h3>
      <p class="text-xs sm:text-sm text-obsidian-600 max-w-md mx-auto leading-relaxed">
        {#if selectedLocation !== 'all'}
          Hiện chưa có bài tuyển dụng nào tại địa điểm này (hoặc khớp với bộ lọc hiện tại). Vui lòng thử chọn địa điểm khác hoặc đặt lại bộ lọc.
        {:else if searchQuery.trim() !== ''}
          Không có bài đăng nào khớp với từ khóa "{searchQuery}". Vui lòng thử từ khóa khác hoặc đặt lại bộ lọc.
        {:else}
          Không tìm thấy bài tuyển dụng nào phù hợp với bộ lọc đã chọn.
        {/if}
      </p>
      <button
        type="button"
        onclick={handleReset}
        class="mt-6 rounded-full bg-obsidian-900 px-6 py-2.5 font-display text-xs font-bold text-mint hover:bg-obsidian-800 hover:shadow-mint-glow transition-all"
      >
        Đặt lại bộ lọc
      </button>
    </div>
  {/if}
</div>
