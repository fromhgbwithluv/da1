<script lang="ts">
  import { rankedDatabaseJobs, openPostJobModal, openAuthModal, currentUser } from '../stores/auth';
  import type { Job } from '../types/job';
  import FilterTabs from './FilterTabs.svelte';
  import JobCard from './JobCard.svelte';

  let { isHomePage = false, maxItems = 3 } = $props<{
    isHomePage?: boolean;
    maxItems?: number;
  }>();

  let selectedCategory = $state<string>('all');
  let searchQuery = $state<string>('');
  let selectedLocation = $state<string>('all');
  let selectedWard = $state<string>('all');

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

  let displayedJobs = $derived.by(() => {
    if (isHomePage) {
      return filteredJobs.slice(0, maxItems);
    }
    return filteredJobs;
  });

  // Tab counts
  let counts = $derived({
    all: allJobs.length,
    'part-time': allJobs.filter((j) => (j.categories && j.categories.length > 0 ? j.categories.includes('part-time') : j.category === 'part-time')).length,
    internship: allJobs.filter((j) => (j.categories && j.categories.length > 0 ? j.categories.includes('internship') : j.category === 'internship')).length,
    fresher: allJobs.filter((j) => (j.categories && j.categories.length > 0 ? j.categories.includes('fresher') : j.category === 'fresher')).length,
  });

  function handleSelectCategory(cat: string) {
    selectedCategory = cat;
  }

  function handleSearchChange(query: string) {
    searchQuery = query;
  }

  function handleSelectLocation(loc: string) {
    selectedLocation = loc;
    selectedWard = 'all'; // Reset ward filter when changing city
  }

  function handleSelectWard(w: string) {
    selectedWard = w;
  }

  function handleReset() {
    selectedCategory = 'all';
    searchQuery = '';
    selectedLocation = 'all';
    selectedWard = 'all';
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

  <!-- Results Count Header (Swiss Typographic Bar) -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black pb-3 pt-2">
    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-base font-black uppercase tracking-tight text-black">
          Vị trí phù hợp
        </h2>
        <span class="font-mono text-xs font-bold text-white bg-black px-2 py-0.5 rounded-swiss-sm">
          {filteredJobs.length} KẾT QUẢ
        </span>
      </div>
      <p class="font-mono text-[11px] text-swiss-500 mt-0.5 uppercase tracking-wide">
        {#if selectedCategory === 'all'}
          Hiển thị toàn bộ cơ hội việc làm đã qua kiểm định TopSiVi
        {:else if selectedCategory === 'part-time'}
          Nhóm 01: Việc làm part-time an toàn, thời gian linh hoạt
        {:else if selectedCategory === 'internship'}
          Nhóm 02: Vị trí thực tập sinh có phụ cấp, dấu mộc & mentor
        {:else}
          Nhóm 03: Cơ hội việc làm Fresher Full-time cho sinh viên mới tốt nghiệp
        {/if}
      </p>
    </div>

    {#if searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedWard !== 'all'}
      <button
        type="button"
        onclick={handleReset}
        class="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-black bg-white px-3 py-1.5 rounded-swiss-sm border border-black hover:bg-swiss-100 transition-colors self-start sm:self-auto"
      >
        <span>[ ĐẶT LẠI LỌC ]</span>
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

    {#if isHomePage && filteredJobs.length > maxItems}
      <!-- Call to Action Banner on Homepage -->
      <div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-swiss-md border border-black bg-swiss-50 p-6 shadow-swiss-card">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-swiss-sm">
              GỢI Ý {displayedJobs.length} / {allJobs.length} VIỆC LÀM ƯU TIÊN
            </span>
          </div>
          <h3 class="text-sm font-black uppercase tracking-tight text-black mt-1.5 sm:text-base">
            Khám phá thêm hàng chục cơ hội việc làm tuyển chọn khác
          </h3>
          <p class="font-mono text-xs text-swiss-600 mt-0.5">
            Xem toàn bộ việc làm với đầy đủ bộ lọc phân tầng, tỉnh thành, phường xã và tìm kiếm chuyên sâu.
          </p>
        </div>

        <a
          href="/jobs"
          class="inline-flex items-center gap-2 rounded-swiss-sm bg-black px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors shadow-swiss-card shrink-0"
        >
          <span>Xem tất cả công việc ({allJobs.length} việc)</span>
          <span class="text-signal-emerald font-bold">→</span>
        </a>
      </div>
    {/if}
  {:else if allJobs.length === 0}
    <!-- Empty Database State -->
    <div class="rounded-swiss-md border border-dashed border-black bg-white p-12 text-center shadow-swiss-card">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-swiss-sm bg-black text-white font-mono text-sm font-bold">
        00
      </div>
      <span class="font-mono text-sm font-black text-black uppercase tracking-wider block mb-2">
        [ CHƯA CÓ BÀI TUYỂN DỤNG NÀO TRÊN HỆ THỐNG ]
      </span>
      <p class="font-mono text-xs text-swiss-600 max-w-md mx-auto leading-relaxed mb-6">
        Dữ liệu mẫu đã được làm mới hoàn toàn. Doanh nghiệp có thể đăng ký tài khoản Doanh nghiệp và đăng bài tuyển dụng mới bằng Markdown ngay bây giờ.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        {#if $currentUser?.role === 'company'}
          <button
            type="button"
            onclick={openPostJobModal}
            class="rounded-swiss-sm bg-signal-emerald px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 transition-colors shadow-swiss-card"
          >
            + Đăng tin tuyển dụng (Markdown)
          </button>
        {:else if !$currentUser}
          <button
            type="button"
            onclick={() => openAuthModal('register')}
            class="rounded-swiss-sm bg-black px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors shadow-swiss-card"
          >
            Đăng ký tài khoản mới →
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Empty Search State (Swiss Geometric Box) -->
    <div class="rounded-swiss-md border border-dashed border-black bg-white p-12 text-center shadow-swiss-card">
      <span class="font-mono text-sm font-black text-black uppercase tracking-wider block mb-2">
        [ KHÔNG TÌM THẤY KẾT QUẢ ]
      </span>
      <p class="font-mono text-xs text-swiss-600 max-w-sm mx-auto leading-relaxed">
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
        class="mt-5 rounded-swiss-sm bg-black px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 transition-colors"
      >
        Đặt lại bộ lọc
      </button>
    </div>
  {/if}
</div>
