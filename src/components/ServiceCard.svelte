<script lang="ts">
  import type { ServiceItem } from '../data/services';
  import { openBookingModal } from '../stores/services';
  import { formatCurrency } from '../utils/formatters';

  let { service } = $props<{ service: ServiceItem }>();

  function getBadgeColor(badge: ServiceItem['badge']) {
    switch (badge) {
      case 'Hồ sơ':
        return 'bg-emerald-100 text-emerald-900 border-emerald-900';
      case 'Huấn luyện':
        return 'bg-amber-100 text-amber-900 border-amber-900';
      case 'Doanh nghiệp':
        return 'bg-neutral-100 text-black border-black';
      default:
        return 'bg-swiss-100 text-black border-black';
    }
  }
</script>

<div
  class="relative flex flex-col justify-between rounded-xl border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_#000]"
>
  <!-- Top Bar: Category Badge & Duration -->
  <div>
    <div class="flex items-center justify-between gap-2 mb-3">
      <div class="flex items-center gap-2">
        <span
          class="font-mono text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border-2 {getBadgeColor(service.badge)}"
        >
          {service.badge}
        </span>

        {#if service.popular}
          <span class="font-mono text-[10px] font-black uppercase tracking-wide bg-black text-white px-2 py-0.5 rounded-sm">
            ✦ Phổ biến
          </span>
        {/if}
      </div>

      <span class="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-swiss-600 bg-swiss-50 px-2 py-0.5 rounded border border-swiss-300">
        <svg class="h-3 w-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{service.duration}</span>
      </span>
    </div>

    <!-- Title -->
    <h3 class="text-lg font-black text-black uppercase tracking-tight leading-snug mb-2 sm:text-xl">
      {service.title}
    </h3>

    <!-- Description -->
    <p class="text-xs text-swiss-700 leading-relaxed mb-5 font-sans">
      {service.description}
    </p>

    <!-- Features list -->
    <div class="space-y-2.5 border-t-2 border-black/10 pt-4 mb-6">
      <span class="font-mono text-[10px] font-bold uppercase tracking-wider text-swiss-500 block">
        CHI TIẾT DỊCH VỤ BAO GỒM:
      </span>
      {#each service.features as feature}
        <div class="flex items-start gap-2.5 text-xs text-swiss-900 font-medium">
          <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-black text-[10px] font-black text-white">
            ✓
          </span>
          <span class="leading-tight">{feature}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Bottom: Price & Booking Action -->
  <div class="border-t-[3px] border-black pt-4">
    <div class="flex items-baseline justify-between mb-3.5">
      <span class="font-mono text-[11px] uppercase font-bold text-swiss-500">
        Mức phí dịch vụ:
      </span>
      <span class="font-mono text-2xl font-black text-black tracking-tight">
        {formatCurrency(service.price)}
      </span>
    </div>

    <!-- Single Action Button (No cart drawer) -->
    <button
      type="button"
      onclick={() => openBookingModal(service)}
      class="group relative flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-black py-3 px-4 font-mono text-xs font-black uppercase tracking-wider text-white transition-all duration-150 hover:bg-neutral-800 active:translate-y-0.5 shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000]"
      aria-label={`Đặt dịch vụ ${service.title}`}
    >
      <span>Đặt dịch vụ ngay</span>
      <span class="transition-transform duration-150 group-hover:translate-x-1">→</span>
    </button>
  </div>
</div>
