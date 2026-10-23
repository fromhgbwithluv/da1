<script lang="ts">
  import { SERVICES, type ServiceCategory, type ServiceItem } from '../data/services';
  import ServiceCard from './ServiceCard.svelte';

  let activeCategory = $state<'all' | ServiceCategory>('all');

  const categories: { id: 'all' | ServiceCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất cả dịch vụ', icon: '✦' },
    { id: 'cv-profile', label: 'Hồ sơ CV & Portfolio', icon: '📄' },
    { id: 'interview', label: 'Huấn luyện & Phỏng vấn', icon: '🎯' },
    { id: 'b2b', label: 'Dành cho Doanh nghiệp', icon: '🏢' },
  ];

  let filteredServices = $derived(
    activeCategory === 'all'
      ? SERVICES
      : SERVICES.filter((s) => s.category === activeCategory)
  );

  function countByCategory(cat: 'all' | ServiceCategory): number {
    if (cat === 'all') return SERVICES.length;
    return SERVICES.filter((s) => s.category === cat).length;
  }
</script>

<div class="space-y-8">
  <!-- Interactive Category Filter Tabs (Neubrutalism Pill Buttons) -->
  <div class="flex flex-wrap items-center gap-2.5 border-b-2 border-black pb-4">
    {#each categories as cat}
      <button
        type="button"
        onclick={() => (activeCategory = cat.id)}
        class="inline-flex items-center gap-2 rounded-lg border-2 border-black px-4 py-2 font-mono text-xs font-black uppercase tracking-wider transition-all duration-150 {activeCategory === cat.id
          ? 'bg-black text-white shadow-[3px_3px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
          : 'bg-white text-black hover:bg-swiss-100 hover:shadow-[2px_2px_0px_0px_#000]'}"
      >
        <span>{cat.icon}</span>
        <span>{cat.label}</span>
        <span
          class="rounded-full px-1.5 py-0.2 text-[10px] font-bold {activeCategory === cat.id
            ? 'bg-white text-black'
            : 'bg-swiss-200 text-black'}"
        >
          {countByCategory(cat.id)}
        </span>
      </button>
    {/each}
  </div>

  <!-- Responsive Grid: 3 columns on desktop, 2 on tablet, 1 on mobile -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredServices as service (service.id)}
      <ServiceCard {service} />
    {/each}
  </div>

  {#if filteredServices.length === 0}
    <div class="rounded-xl border-[3px] border-dashed border-black bg-white p-12 text-center shadow-[4px_4px_0px_0px_#000]">
      <span class="font-mono text-xs font-black uppercase text-swiss-500 block mb-2">
        [ 00 // KHÔNG CÓ DỊCH VỤ ]
      </span>
      <p class="font-mono text-sm text-black">
        Không tìm thấy gói dịch vụ nào trong danh mục này.
      </p>
    </div>
  {/if}
</div>
