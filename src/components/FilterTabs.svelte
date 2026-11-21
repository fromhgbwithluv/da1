<script lang="ts">
  import { PROVINCES } from '../data/provinces';
  import SearchableSelect, { type SelectItem } from './SearchableSelect.svelte';
  import When2MeetSchedule from './When2MeetSchedule.svelte';
  import {
    EMPTY_SCHEDULE_GRID,
    countSelectedSlots,
    hasActiveScheduleGrid,
    summarizeScheduleGrid,
    type ScheduleGrid,
  } from '../utils/scheduleFilter';

  let {
    selectedCategory = 'all',
    searchQuery = '',
    selectedLocation = 'all',
    selectedWard = 'all',
    scheduleGrid = EMPTY_SCHEDULE_GRID,
    counts = { all: 0, 'part-time': 0, internship: 0, fresher: 0, project: 0 },
    activeLocations = [],
    activeWards = [],
    onSelectCategory,
    onSearchChange,
    onSelectLocation,
    onSelectWard,
    onScheduleGridChange,
    onReset
  } = $props<{
    selectedCategory: string;
    searchQuery: string;
    selectedLocation: string;
    selectedWard?: string;
    scheduleGrid?: ScheduleGrid;
    counts: { all: number; 'part-time': number; internship: number; fresher: number; project: number };
    activeLocations?: { code: string; name: string; count: number }[];
    activeWards?: { code: string; name: string; count: number }[];
    onSelectCategory: (cat: string) => void;
    onSearchChange: (query: string) => void;
    onSelectLocation: (loc: string) => void;
    onSelectWard?: (ward: string) => void;
    onScheduleGridChange?: (next: ScheduleGrid) => void;
    onReset: () => void;
  }>();

  let isScheduleOpen = $state(false);
  let selectedSlotCount = $derived(countSelectedSlots(scheduleGrid));
  let isScheduleActive = $derived(hasActiveScheduleGrid(scheduleGrid));
  let scheduleSummary = $derived(summarizeScheduleGrid(scheduleGrid));

  function handleScheduleChange(nextGrid: ScheduleGrid) {
    onScheduleGridChange?.(nextGrid);
  }

  function clearScheduleFilter(e?: MouseEvent) {
    e?.stopPropagation();
    onScheduleGridChange?.({
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    });
  }

  const tabs = [
    {
      id: 'all',
      title: 'Tất cả cơ hội',
      sub: 'Toàn bộ việc làm'
    },
    {
      id: 'part-time',
      title: 'Năm 1, 2',
      sub: 'Part-time linh hoạt'
    },
    {
      id: 'internship',
      title: 'Năm 3, 4',
      sub: 'Thực tập chuyên ngành'
    },
    {
      id: 'fresher',
      title: 'Mới tốt nghiệp',
      sub: 'Fresher Full-time'
    },
    {
      id: 'project',
      title: 'Dự án',
      sub: 'Thực chiến theo đầu việc'
    }
  ];

  const sortedProvinces = [...PROVINCES].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  // Provinces that do not have active jobs yet
  let otherProvinces = $derived(
    sortedProvinces.filter((p) => !activeLocations.some((al: { code: string }) => al.code === p.code))
  );

  let selectedProvince = $derived(PROVINCES.find((p) => p.code === selectedLocation));
  let provinceWards = $derived(selectedProvince?.wards || []);
  let otherWards = $derived(
    provinceWards.filter((w) => !activeWards.some((aw: { code: string }) => aw.code === w.code))
  );

  let locationItems = $derived.by(() => {
    const list: SelectItem[] = [
      {
        value: 'all',
        label: `Tất cả địa điểm (${counts.all})`,
        badge: 'ALL',
      },
    ];

    if (activeLocations && activeLocations.length > 0) {
      for (const loc of activeLocations) {
        list.push({
          value: loc.code,
          label: loc.name,
          badge: `${loc.count} việc`,
          group: `📍 Đang có tuyển dụng (${activeLocations.length})`,
        });
      }
    }

    for (const prov of otherProvinces) {
      list.push({
        value: prov.code,
        label: prov.name,
        badge: '0',
        subLabel: prov.fullName,
        group: 'Tất cả 34 tỉnh thành',
      });
    }

    return list;
  });

  let wardItems = $derived.by(() => {
    const list: SelectItem[] = [
      {
        value: 'all',
        label: `Tất cả Phường / Xã (${provinceWards.length})`,
        badge: 'ALL',
      },
    ];

    if (activeWards && activeWards.length > 0) {
      for (const aw of activeWards) {
        list.push({
          value: aw.code,
          label: aw.name,
          badge: `${aw.count} việc`,
          group: `📍 Phường có việc làm (${activeWards.length})`,
        });
      }
    }

    for (const w of otherWards) {
      list.push({
        value: w.code,
        label: w.fullName,
        badge: '0',
        group: `Tất cả phường/xã (${selectedProvince?.name})`,
      });
    }

    return list;
  });
</script>

<div class="space-y-4">
  <!-- Search Bar & Location Selector (Organic Rounded Toolbar) -->
  <div class="rounded-3xl border border-obsidian-900/15 bg-alabaster-50 p-3.5 sm:p-4 shadow-swiss-card">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-12 items-center">
      <!-- Search Input -->
      <div class="relative {selectedLocation !== 'all' && selectedLocation !== 'remote' ? 'md:col-span-5' : 'md:col-span-8'}">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-swiss-500">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          id="job-search-input"
          value={searchQuery}
          oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
          placeholder="Tìm theo vị trí, công ty hoặc từ khóa..."
          class="w-full rounded-2xl border border-obsidian-900/15 bg-alabaster-100/70 py-2.5 pl-10 pr-9 text-sm font-medium text-obsidian-900 placeholder:text-swiss-400 transition-all focus:border-obsidian-900 focus:bg-alabaster-50 focus:outline-none focus:ring-2 focus:ring-mint/50"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => onSearchChange('')}
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-swiss-400 hover:text-obsidian-900 transition-colors"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Quick Location Filter (Tỉnh / Thành phố) -->
      <div class="relative md:col-span-4">
        <SearchableSelect
          items={locationItems}
          value={selectedLocation}
          placeholder="Lọc địa điểm..."
          triggerClass="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/70 px-3.5 py-2.5 text-sm text-obsidian-900 hover:border-obsidian-900"
          onSelect={(val) => onSelectLocation(val || 'all')}
        />
      </div>

      <!-- Ward Filter Dropdown (Cấp Phường / Xã) -->
      {#if selectedLocation !== 'all' && selectedLocation !== 'remote'}
        <div class="relative md:col-span-3">
          <SearchableSelect
            items={wardItems}
            value={selectedWard}
            placeholder="Lọc phường/xã..."
            triggerClass="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/70 px-3.5 py-2.5 text-sm text-obsidian-900 hover:border-obsidian-900"
            onSelect={(val) => onSelectWard && onSelectWard(val || 'all')}
          />
        </div>
      {/if}
    </div>

    <!-- Free Time / Job Schedule Grid Filter (When2MeetSchedule) -->
    {#if onScheduleGridChange}
      <div class="mt-3 pt-3 border-t border-obsidian-900/10 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onclick={() => (isScheduleOpen = !isScheduleOpen)}
            class="inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer
            {isScheduleActive || isScheduleOpen
              ? 'border-mint-500 bg-mint/20 text-obsidian-900 shadow-xs'
              : 'border-obsidian-900/15 bg-alabaster-100/70 text-obsidian-800 hover:border-obsidian-900/40'}"
          >
            <svg class="h-4 w-4 text-mint-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {#if isScheduleActive}
                Thời gian rảnh: {scheduleSummary}
              {:else}
                Lọc theo thời gian rảnh (Bảng chọn giờ)
              {/if}
            </span>
            {#if isScheduleActive}
              <span class="rounded-full bg-alabaster-50 border border-mint-500/35 px-2 py-0.5 font-mono text-[10px] font-extrabold text-obsidian-900">
                {selectedSlotCount} giờ
              </span>
            {/if}
            <svg
              class="h-3.5 w-3.5 text-obsidian-600 transition-transform duration-150 {isScheduleOpen ? 'rotate-180' : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if isScheduleActive}
            <button
              type="button"
              onclick={clearScheduleFilter}
              class="rounded-full px-3 py-1.5 text-xs font-bold text-signal-crimson hover:bg-signal-crimson/10 transition-colors cursor-pointer"
            >
              Xóa lọc giờ
            </button>
          {/if}
        </div>

        {#if isScheduleOpen}
          <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-100/60 p-4">
            <When2MeetSchedule
              {scheduleGrid}
              label="Chọn khung giờ rảnh của bạn"
              showSummaryInput={false}
              autoInitDefault={false}
              selectedLabel="Giờ rảnh của bạn"
              onChange={handleScheduleChange}
            />
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Category Segmentation Tabs (Soft Mint & Obsidian Pills) -->
  <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
    {#each tabs as tab}
      {@const isActive = selectedCategory === tab.id}
      <button
        type="button"
        onclick={() => onSelectCategory(tab.id)}
        class="group relative flex flex-col items-start rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200
        {tab.id === 'all' ? 'col-span-2 sm:col-span-1' : ''}
        {isActive
          ? 'border-2 border-obsidian-900 bg-mint/30 text-obsidian-900 shadow-swiss-card'
          : 'border-obsidian-900/15 bg-alabaster-50 text-obsidian-900 hover:border-obsidian-900/50 hover:bg-alabaster-100/80'}"
      >
        <div class="flex w-full items-start justify-between gap-2 mb-1.5">
          <span class="font-display text-base sm:text-[17px] font-extrabold text-obsidian-900 tracking-tight leading-snug">
            {tab.title}
          </span>

          <!-- Count badge -->
          <span class="font-mono text-xs px-2.5 py-0.5 rounded-full shrink-0
            {isActive
              ? 'bg-obsidian-900 text-mint font-extrabold'
              : 'bg-alabaster-100 text-obsidian-700 border border-obsidian-900/10 font-bold'}"
          >
            {counts[tab.id as keyof typeof counts] || 0}
          </span>
        </div>

        <span class="text-xs text-obsidian-600">
          {tab.sub}
        </span>
      </button>
    {/each}
  </div>
</div>
