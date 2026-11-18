<script lang="ts">
  import type { ServiceItem } from '../data/services';
  import { openBookingModal } from '../stores/services';
  import { formatCurrency } from '../utils/formatters';

  let { service } = $props<{ service: ServiceItem }>();

  function getBadgeColor(badge: ServiceItem['badge']) {
    switch (badge) {
      case 'Hồ sơ':
        return 'bg-mint/40 text-obsidian-900 border-obsidian-900/20';
      case 'Huấn luyện':
        return 'bg-amber-100 text-amber-900 border-amber-900/20';
      case 'Doanh nghiệp':
        return 'bg-obsidian-900 text-mint border-obsidian-900';
      default:
        return 'bg-alabaster-100 text-obsidian-900 border-obsidian-900/20';
    }
  }
</script>

<div
  class="relative flex flex-col justify-between rounded-3xl border border-obsidian-900/15 bg-alabaster-50 p-6 sm:p-7 shadow-swiss-card transition-all duration-200 hover:-translate-y-1 hover:border-obsidian-900 hover:shadow-swiss-hover"
>
  <div>
    <div class="flex items-center justify-between gap-2 mb-4">
      <div class="flex items-center gap-2">
        <span
          class="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border {getBadgeColor(service.badge)}"
        >
          {service.badge}
        </span>

        {#if service.popular}
          <span class="font-mono text-[10px] font-bold uppercase tracking-wide bg-obsidian-900 text-mint px-2.5 py-1 rounded-full">
            ✦ Phổ biến
          </span>
        {/if}
      </div>

      <span class="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-obsidian-700 bg-alabaster-100 px-2.5 py-1 rounded-full border border-obsidian-900/10">
        <svg class="h-3.5 w-3.5 text-obsidian-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{service.duration}</span>
      </span>
    </div>

    <h3 class="font-display text-lg font-extrabold text-obsidian-900 tracking-tight leading-snug mb-2 sm:text-xl">
      {service.title}
    </h3>

    <p class="text-xs sm:text-sm text-obsidian-700 leading-relaxed mb-5">
      {service.description}
    </p>

    <div class="space-y-2.5 border-t border-obsidian-900/10 pt-4 mb-6">
      <span class="font-mono text-[10px] font-bold uppercase tracking-wider text-obsidian-600 block">
        Quyền lợi bao gồm:
      </span>
      {#each service.features as feature}
        <div class="flex items-start gap-2.5 text-xs text-obsidian-900 font-medium">
          <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint text-[10px] font-extrabold text-obsidian-900 mt-0.5">
            ✓
          </span>
          <span class="leading-snug">{feature}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="border-t border-obsidian-900/15 pt-4">
    <div class="flex items-baseline justify-between mb-4">
      <span class="font-mono text-[11px] uppercase font-bold text-obsidian-600">
        Chi phí trọn gói:
      </span>
      <span class="font-display text-2xl font-extrabold text-obsidian-900 tracking-tight">
        {formatCurrency(service.price)}
      </span>
    </div>

    <button
      type="button"
      onclick={() => openBookingModal(service)}
      class="group relative flex w-full items-center justify-center gap-2 rounded-full bg-obsidian-900 py-3.5 px-5 font-display text-xs font-extrabold uppercase tracking-wider text-mint transition-all duration-200 hover:bg-obsidian-800 hover:shadow-mint-glow"
      aria-label={`Đặt dịch vụ ${service.title}`}
    >
      <span>Đặt dịch vụ ngay</span>
      <span class="transition-transform duration-150 group-hover:translate-x-1">→</span>
    </button>
  </div>
</div>
