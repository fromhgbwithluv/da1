<script lang="ts">
  import type { ServiceItem } from '../data/services';
  import { openBookingModal } from '../stores/services';
  import { formatCurrency } from '../utils/formatters';

  let { service } = $props<{ service: ServiceItem }>();

  function getBadgeStyle(badge: ServiceItem['badge']) {
    switch (badge) {
      case 'Hồ sơ':
        return {
          pill: 'bg-mint/25 text-obsidian-900 border-mint-500/35',
          dot: 'bg-mint-600',
        };
      case 'Huấn luyện':
        return {
          pill: 'bg-amber-100/80 text-amber-900 border-amber-300/60',
          dot: 'bg-amber-500',
        };
      case 'Doanh nghiệp':
        return {
          pill: 'bg-alabaster-200/90 text-obsidian-900 border-obsidian-900/15',
          dot: 'bg-obsidian-700',
        };
      default:
        return {
          pill: 'bg-alabaster-100 text-obsidian-900 border-obsidian-900/15',
          dot: 'bg-mint-500',
        };
    }
  }

  let badgeStyle = $derived(getBadgeStyle(service.badge));
</script>

<div
  class="group relative flex flex-col justify-between rounded-3xl border border-obsidian-900 bg-alabaster-50 p-6 shadow-swiss-card transition-all duration-200 hover:-translate-y-1 hover:shadow-swiss-hover"
>
  <div>
    <!-- Top Badges Row -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <span
        class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[11px] font-bold {badgeStyle.pill}"
      >
        <span class="h-1.5 w-1.5 rounded-full {badgeStyle.dot}"></span>
        <span>{service.badge}</span>
      </span>

      {#if service.popular}
        <span
          class="inline-flex items-center gap-1 rounded-full border border-mint-500/40 bg-mint/35 px-2.5 py-1 font-display text-[11px] font-extrabold text-obsidian-900"
        >
          <span>✦</span>
          <span>Phổ biến</span>
        </span>
      {/if}
    </div>

    <!-- Title & Description -->
    <h3 class="font-display text-lg sm:text-[19px] font-extrabold text-obsidian-900 tracking-tight leading-snug min-h-[3.25rem]">
      {service.title}
    </h3>

    <p class="mt-2 text-xs sm:text-[13px] text-obsidian-600 leading-relaxed min-h-[3.75rem]">
      {service.description}
    </p>

    <!-- Price & Duration Highlight Box (Uniform Height & Alignment) -->
    <div
      class="my-5 rounded-2xl border border-mint-500/30 bg-mint/15 px-4 py-3.5 flex flex-col justify-between gap-2 min-h-[5.5rem]"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold text-obsidian-600 whitespace-nowrap">
          Chi phí trọn gói
        </span>
        <span class="inline-flex items-center gap-1 rounded-full border border-obsidian-900/10 bg-alabaster-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-obsidian-700 whitespace-nowrap shrink-0">
          <svg class="h-3 w-3 text-mint-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{service.duration}</span>
        </span>
      </div>

      <span class="font-display text-2xl font-extrabold text-obsidian-900 tracking-tight leading-tight">
        {formatCurrency(service.price)}
      </span>
    </div>

    <!-- Features List -->
    <div class="space-y-2.5 mb-6">
      <span class="text-[11px] font-bold text-obsidian-600 block">
        Quyền lợi bao gồm
      </span>
      {#each service.features as feature}
        <div class="flex items-start gap-2.5 text-xs sm:text-[13px] text-obsidian-800 font-medium">
          <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/45 text-[10px] font-extrabold text-obsidian-900 mt-0.5">
            ✓
          </span>
          <span class="leading-snug">{feature}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Action Footer -->
  <div class="relative z-10 pt-3 border-t border-obsidian-900/10">
    <button
      type="button"
      onclick={() => openBookingModal(service)}
      class="group/btn flex w-full items-center justify-center gap-2 rounded-full bg-obsidian-900 py-3 px-5 font-display text-xs sm:text-[13px] font-extrabold text-alabaster-50 hover:bg-mint hover:text-obsidian-900 shadow-sm transition-all duration-150 cursor-pointer"
      aria-label={`Đặt dịch vụ ${service.title}`}
    >
      <span>Đặt dịch vụ ngay</span>
      <span class="transition-transform duration-150 group-hover/btn:translate-x-1">→</span>
    </button>
  </div>
</div>
