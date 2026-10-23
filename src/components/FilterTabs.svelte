<script lang="ts">
  import { PROVINCES } from '../data/provinces';
  import SearchableSelect, { type SelectItem } from './SearchableSelect.svelte';

  let {
    selectedCategory = 'all',
    searchQuery = '',
    selectedLocation = 'all',
    selectedWard = 'all',
    counts = { all: 0, 'part-time': 0, internship: 0, fresher: 0 },
    activeLocations = [],
    activeWards = [],
    onSelectCategory,
    onSearchChange,
    onSelectLocation,
    onSelectWard,
    onReset
  } = $props<{
    selectedCategory: string;
    searchQuery: string;
    selectedLocation: string;
    selectedWard?: string;
    counts: { all: number; 'part-time': number; internship: number; fresher: number };
    activeLocations?: { code: string; name: string; count: number }[];
    activeWards?: { code: string; name: string; count: number }[];
    onSelectCategory: (cat: string) => void;
    onSearchChange: (query: string) => void;
    onSelectLocation: (loc: string) => void;
    onSelectWard?: (ward: string) => void;
    onReset: () => void;
  }>();

  const tabs = [
    {
      id: 'all',
      code: 'ALL',
      title: 'Tất cả cơ hội',
      sub: 'Toàn bộ việc làm'
    },
    {
      id: 'part-time',
      code: 'PT-01',
      title: 'Năm 1, 2',
      sub: 'Part-time linh hoạt'
    },
    {
      id: 'internship',
      code: 'INT-02',
      title: 'Năm 3, 4',
      sub: 'Thực tập chuyên ngành'
    },
    {
      id: 'fresher',
      code: 'FR-03',
      title: 'Mới tốt nghiệp',
      sub: 'Fresher Full-time'
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
  <!-- Search Bar & Location Selector (Swiss Precision Grid) -->
  <div class="rounded-swiss-md bg-white p-3 border border-swiss-300 shadow-swiss-card">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-12 items-center">
      <!-- Search Input -->
      <div class="relative {selectedLocation !== 'all' && selectedLocation !== 'remote' ? 'md:col-span-5' : 'md:col-span-8'}">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-swiss-400">
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
          class="w-full rounded-swiss-sm border border-swiss-300 bg-swiss-50/50 py-2 pl-10 pr-4 text-xs font-medium text-black placeholder-swiss-400 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => onSearchChange('')}
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-swiss-400 hover:text-black"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Quick Location Filter (Tỉnh / Thành phố) Reusable SearchableSelect -->
      <div class="relative {selectedLocation !== 'all' && selectedLocation !== 'remote' ? 'md:col-span-4' : 'md:col-span-4'}">
        <SearchableSelect
          items={locationItems}
          value={selectedLocation}
          placeholder="Lọc địa điểm..."
          onSelect={(val) => onSelectLocation(val || 'all')}
        />
      </div>

      <!-- Ward Filter Dropdown (Cấp Phường / Xã) Reusable SearchableSelect -->
      {#if selectedLocation !== 'all' && selectedLocation !== 'remote'}
        <div class="relative md:col-span-3">
          <SearchableSelect
            items={wardItems}
            value={selectedWard}
            placeholder="Lọc phường/xã..."
            onSelect={(val) => onSelectWard && onSelectWard(val || 'all')}
          />
        </div>
      {/if}
    </div>
  </div>

  <!-- Category Segmentation Tabs (Swiss Architectural Tabs) -->
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {#each tabs as tab}
      <button
        type="button"
        onclick={() => onSelectCategory(tab.id)}
        class="group relative flex flex-col items-start rounded-swiss-md border p-3.5 text-left transition-all duration-150
        {selectedCategory === tab.id
          ? 'border-black bg-black text-white shadow-swiss-card'
          : 'border-swiss-300 bg-white text-black hover:border-black hover:bg-swiss-50'}"
      >
        <div class="flex w-full items-center justify-between mb-2">
          <!-- Code in Monospace -->
          <span class="font-mono text-[10px] uppercase font-bold tracking-wider
            {selectedCategory === tab.id ? 'text-signal-emerald' : 'text-swiss-500'}">
            [{tab.code}]
          </span>

          <!-- Count badge -->
          <span class="font-mono text-xs font-bold px-1.5 py-0.5 rounded-swiss-sm
            {selectedCategory === tab.id
              ? 'bg-neutral-800 text-white'
              : 'bg-swiss-100 text-black border border-swiss-200'}"
          >
            {counts[tab.id as keyof typeof counts] || 0}
          </span>
        </div>

        <span class="text-xs font-black uppercase tracking-tight sm:text-sm {selectedCategory === tab.id ? 'text-white' : 'text-black'}">
          {tab.title}
        </span>
        <span class="text-[11px] {selectedCategory === tab.id ? 'text-swiss-300' : 'text-swiss-500'}">
          {tab.sub}
        </span>
      </button>
    {/each}
  </div>
</div>
