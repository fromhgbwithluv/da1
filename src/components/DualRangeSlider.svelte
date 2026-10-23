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
    const val = Number((e.target as HTMLInputElement).value);
    if (val > maxVal) {
      minVal = maxVal;
    } else {
      minVal = val;
    }
  }

  function handleMaxInput(e: Event) {
    const val = Number((e.target as HTMLInputElement).value);
    if (val < minVal) {
      maxVal = minVal;
    } else {
      maxVal = val;
    }
  }

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

<div class="space-y-2.5">
  <div class="flex items-center justify-between">
    <span class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700">
      {label} *
    </span>

    <!-- Checkbox Thỏa thuận -->
    <label class="flex items-center gap-1.5 cursor-pointer font-mono text-[11px] text-swiss-700 hover:text-black">
      <input
        type="checkbox"
        bind:checked={isNegotiable}
        class="h-3.5 w-3.5 rounded-swiss-xs border-swiss-300 text-black focus:ring-black"
      />
      <span>[ Thỏa thuận ]</span>
    </label>
  </div>

  <!-- Salary Value Display Banner (Swiss Monospace Card) -->
  <div class="flex items-center justify-between rounded-swiss-sm border border-black bg-swiss-50 px-3.5 py-2 font-mono">
    <span class="text-xs text-swiss-500 uppercase font-bold">LƯƠNG DỰ KIẾN:</span>
    <span class="text-xs font-black text-black tracking-tight">
      {formattedDisplay}
    </span>
  </div>

  {#if !isNegotiable}
    <!-- Dual Range Slider Container -->
    <div class="pt-2 pb-1 px-1">
      <div class="relative h-6 flex items-center">
        <!-- Background Track -->
        <div class="absolute h-2 w-full rounded-full bg-swiss-200 border border-swiss-300"></div>

        <!-- Highlighted Active Range Track -->
        <div
          class="absolute h-2 rounded-full bg-black transition-all duration-75"
          style="left: {minPercent}%; width: {maxPercent - minPercent}%;"
        ></div>

        <!-- Invisible Overlapping Range Inputs with Visible Custom Thumbs -->
        <input
          type="range"
          {min}
          {max}
          {step}
          value={minVal}
          oninput={handleMinInput}
          class="dual-slider absolute w-full pointer-events-none appearance-none bg-transparent"
        />
        <input
          type="range"
          {min}
          {max}
          {step}
          value={maxVal}
          oninput={handleMaxInput}
          class="dual-slider absolute w-full pointer-events-none appearance-none bg-transparent"
        />
      </div>

      <!-- Min and Max Indicators -->
      <div class="flex justify-between text-[10px] font-mono text-swiss-400 mt-1">
        <span>0đ</span>
        <span>25M</span>
        <span>50M</span>
        <span>75M</span>
        <span class="font-bold text-black">100.000.000đ (Max)</span>
      </div>
    </div>

    <!-- Quick Presets Tags -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1">
      <span class="font-mono text-[10px] text-swiss-400 uppercase">Mốc gợi ý:</span>
      {#each presets as p}
        <button
          type="button"
          onclick={() => applyPreset(p)}
          class="font-mono text-[10px] font-bold px-2 py-0.5 rounded-swiss-sm border border-swiss-300 bg-white text-swiss-700 hover:border-black hover:text-black transition-colors"
        >
          {p.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Dual range slider thumb styling */
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
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: #000;
    border: 2px solid #fff;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    transition: transform 0.1s ease;
  }

  .dual-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  .dual-slider::-moz-range-thumb {
    pointer-events: auto;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: #000;
    border: 2px solid #fff;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    transition: transform 0.1s ease;
  }

  .dual-slider::-moz-range-thumb:hover {
    transform: scale(1.15);
  }
</style>
