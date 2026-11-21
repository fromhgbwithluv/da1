<script lang="ts">
  let {
    min = 0,
    max = 100_000_000,
    step = 500_000,
    minVal = $bindable(5_000_000),
    maxVal = $bindable(15_000_000),
    isNegotiable = $bindable(false),
    label = 'Mức lương / Phụ cấp',
    unit = '/ tháng'
  }: {
    min?: number;
    max?: number;
    step?: number;
    minVal?: number;
    maxVal?: number;
    isNegotiable?: boolean;
    label?: string;
    unit?: string;
  } = $props();

  function formatMoney(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
  }

  let formattedDisplay = $derived.by(() => {
    if (isNegotiable) return 'Thỏa thuận';
    if (minVal === maxVal) return `${formatMoney(minVal)} ${unit}`;
    return `${formatMoney(minVal)} - ${formatMoney(maxVal)} ${unit}`;
  });

  // Calculate percentages for the visual track
  let minPercent = $derived(Math.min(100, Math.max(0, ((minVal - min) / (max - min)) * 100)));
  let maxPercent = $derived(Math.min(100, Math.max(0, ((maxVal - min) / (max - min)) * 100)));

  function handleMinInput(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const raw = Number(input.value);
    const clamped = Math.min(raw, maxVal);
    minVal = clamped;
    if (raw !== clamped) {
      input.value = String(clamped);
    }
  }

  function handleMaxInput(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const raw = Number(input.value);
    const clamped = Math.max(raw, minVal);
    maxVal = clamped;
    if (raw !== clamped) {
      input.value = String(clamped);
    }
  }

  // Ensure min thumb stays reachable when both thumbs meet near the upper bound
  let minOnTop = $derived(minVal >= maxVal && minVal > (min + max) / 2);

  const presets = [
    { label: 'Part-time', min: 2_500_000, max: 5_000_000 },
    { label: 'Thực tập', min: 4_000_000, max: 8_000_000 },
    { label: 'Fresher', min: 8_000_000, max: 15_000_000 },
    { label: 'Full-time', min: 12_000_000, max: 25_000_000 },
    { label: 'Lương cao', min: 25_000_000, max: 50_000_000 },
    { label: 'Expert', min: 50_000_000, max: 100_000_000 },
  ];

  function applyPreset(p: { min: number; max: number }) {
    isNegotiable = false;
    minVal = p.min;
    maxVal = p.max;
  }
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2">
    <span class="h-2 w-2 rounded-full bg-mint-500 shrink-0"></span>
    <span class="font-display text-sm font-extrabold text-obsidian-900">
      {label}
    </span>
  </div>

  <!-- Salary Value Display Card with Inline Negotiable Toggle -->
  <div class="rounded-2xl border border-mint-500/35 bg-mint/15 px-4 py-3 space-y-1.5">
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-semibold text-obsidian-700">Mức lương dự kiến</span>

      <!-- Toggle Thỏa thuận -->
      <label
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors cursor-pointer shrink-0
        {isNegotiable
          ? 'border-mint-600 bg-alabaster-50 text-obsidian-900 shadow-xs'
          : 'border-obsidian-900/15 bg-alabaster-50/85 text-obsidian-700 hover:border-obsidian-900/40'}"
      >
        <input
          type="checkbox"
          bind:checked={isNegotiable}
          class="sr-only"
        />
        <span
          class="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-black
          {isNegotiable
            ? 'bg-mint-500 text-alabaster-50'
            : 'border border-obsidian-900/25 bg-alabaster-50 text-transparent'}"
        >
          ✓
        </span>
        <span>Thỏa thuận</span>
      </label>
    </div>

    <div class="font-display text-base sm:text-lg font-extrabold text-obsidian-900 tracking-tight">
      {formattedDisplay}
    </div>
  </div>

  {#if !isNegotiable}
    <!-- Dual Range Slider Container -->
    <div class="pt-2 pb-1 px-1">
      <div class="relative h-6 flex items-center">
        <!-- Background Track -->
        <div class="absolute h-2 w-full rounded-full bg-alabaster-200 border border-obsidian-900/10"></div>

        <!-- Highlighted Active Range Track -->
        <div
          class="absolute h-2 rounded-full bg-mint-500 transition-all duration-75"
          style="left: {minPercent}%; width: {Math.max(0, maxPercent - minPercent)}%;"
        ></div>

        <!-- Overlapping Range Inputs with Clamped DOM Values -->
        <input
          type="range"
          {min}
          {max}
          {step}
          value={minVal}
          oninput={handleMinInput}
          aria-label="Mức lương tối thiểu"
          class="dual-slider absolute w-full pointer-events-none appearance-none bg-transparent {minOnTop ? 'z-20' : 'z-10'}"
        />
        <input
          type="range"
          {min}
          {max}
          {step}
          value={maxVal}
          oninput={handleMaxInput}
          aria-label="Mức lương tối đa"
          class="dual-slider absolute w-full pointer-events-none appearance-none bg-transparent {minOnTop ? 'z-10' : 'z-20'}"
        />
      </div>

      <!-- Scale Indicators -->
      <div class="flex justify-between text-[10px] font-mono text-obsidian-600 mt-1.5">
        <span>0đ</span>
        <span>25M</span>
        <span>50M</span>
        <span>75M</span>
        <span class="font-bold text-obsidian-900">100M</span>
      </div>
    </div>

    <!-- Quick Presets Pills -->
    <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
      <span class="text-[11px] font-semibold text-obsidian-600 mr-0.5">Mốc gợi ý:</span>
      {#each presets as p}
        {@const isPresetActive = !isNegotiable && minVal === p.min && maxVal === p.max}
        <button
          type="button"
          onclick={() => applyPreset(p)}
          class="rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer
          {isPresetActive
            ? 'border-mint-500 bg-mint/25 text-obsidian-900'
            : 'border-obsidian-900/15 bg-alabaster-50 text-obsidian-700 hover:border-obsidian-900/40 hover:text-obsidian-900'}"
        >
          {p.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dual-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 0;
    outline: none;
  }

  .dual-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    pointer-events: auto;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background: #0e1412;
    border: 3px solid #70ffaf;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(14, 20, 18, 0.25);
    transition: transform 0.12s ease;
  }

  .dual-slider::-webkit-slider-thumb:hover {
    transform: scale(1.12);
  }

  .dual-slider::-moz-range-thumb {
    pointer-events: auto;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background: #0e1412;
    border: 3px solid #70ffaf;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(14, 20, 18, 0.25);
    transition: transform 0.12s ease;
  }

  .dual-slider::-moz-range-thumb:hover {
    transform: scale(1.12);
  }
</style>
