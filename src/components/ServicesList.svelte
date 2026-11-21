<script lang="ts">
  import { SERVICES, type ServiceCategory } from '../data/services';
  import ServiceCard from './ServiceCard.svelte';

  let activeFilter = $state<'all' | ServiceCategory>('all');

  const filters: { id: 'all' | ServiceCategory; label: string }[] = [
    { id: 'all', label: 'Tất cả dịch vụ' },
    { id: 'cv-profile', label: 'Hồ sơ & CV' },
    { id: 'interview', label: 'Huấn luyện phỏng vấn' },
    { id: 'b2b', label: 'Dành cho Doanh nghiệp' },
  ];

  let filteredServices = $derived(
    activeFilter === 'all'
      ? SERVICES
      : SERVICES.filter((s) => s.category === activeFilter)
  );

  function getCount(id: 'all' | ServiceCategory) {
    if (id === 'all') return SERVICES.length;
    return SERVICES.filter((s) => s.category === id).length;
  }
</script>

<div class="space-y-8">
  <!-- Category Filter Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-obsidian-900">
        Các gói dịch vụ hỗ trợ
      </h2>
      <p class="mt-0.5 text-xs sm:text-sm text-obsidian-600">
        Chọn gói phù hợp với giai đoạn sự nghiệp hoặc nhu cầu tuyển dụng của bạn.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      {#each filters as f (f.id)}
        {@const isActive = activeFilter === f.id}
        <button
          type="button"
          onclick={() => (activeFilter = f.id)}
          class="inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-bold transition-all duration-150 cursor-pointer
          {isActive
            ? 'border-2 border-mint-500 bg-mint/25 text-obsidian-900 shadow-xs'
            : 'border border-obsidian-900/15 bg-alabaster-50 text-obsidian-700 hover:border-obsidian-900/40 hover:text-obsidian-900'}"
        >
          <span>{f.label}</span>
          <span
            class="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-extrabold
            {isActive
              ? 'bg-alabaster-50 text-obsidian-900'
              : 'bg-alabaster-100 text-obsidian-600'}"
          >
            {getCount(f.id)}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Responsive Grid: 3 columns on desktop, 2 on tablet, 1 on mobile -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredServices as service (service.id)}
      <ServiceCard {service} />
    {/each}
  </div>
</div>
