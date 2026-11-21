<script lang="ts">
  let {
    scheduleText = $bindable('Linh hoạt 3 - 4 ca/tuần'),
    scheduleGrid = $bindable<Record<string, number[]>>({}),
    label = 'Thời gian làm việc / Ca làm',
    showSummaryInput = true,
    autoInitDefault = true,
    selectedLabel = 'Ca làm việc',
    onChange,
  }: {
    scheduleText?: string;
    scheduleGrid?: Record<string, number[]>;
    label?: string;
    showSummaryInput?: boolean;
    autoInitDefault?: boolean;
    selectedLabel?: string;
    onChange?: (grid: Record<string, number[]>) => void;
  } = $props();

  const DAYS = [
    { key: 'mon', label: 'T2', full: 'Thứ 2' },
    { key: 'tue', label: 'T3', full: 'Thứ 3' },
    { key: 'wed', label: 'T4', full: 'Thứ 4' },
    { key: 'thu', label: 'T5', full: 'Thứ 5' },
    { key: 'fri', label: 'T6', full: 'Thứ 6' },
    { key: 'sat', label: 'T7', full: 'Thứ 7' },
    { key: 'sun', label: 'CN', full: 'Chủ Nhật' },
  ];

  // 08:00 to 21:00
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  let isMouseDown = $state(false);
  let paintMode = $state<boolean>(true); // true = selecting, false = unselecting

  // Ensure initial structure (only auto-populate office hours when autoInitDefault is true)
  $effect(() => {
    if (autoInitDefault && (!scheduleGrid || Object.keys(scheduleGrid).length === 0)) {
      scheduleGrid = {
        mon: [8, 9, 10, 11, 13, 14, 15, 16],
        tue: [8, 9, 10, 11, 13, 14, 15, 16],
        wed: [8, 9, 10, 11, 13, 14, 15, 16],
        thu: [8, 9, 10, 11, 13, 14, 15, 16],
        fri: [8, 9, 10, 11, 13, 14, 15, 16],
        sat: [],
        sun: [],
      };
      updateScheduleSummary();
    }
  });

  function isSelected(dayKey: string, hour: number): boolean {
    return (scheduleGrid[dayKey] || []).includes(hour);
  }

  function handleCellMouseDown(dayKey: string, hour: number, e: MouseEvent) {
    e.preventDefault();
    isMouseDown = true;
    const current = isSelected(dayKey, hour);
    paintMode = !current;
    applyPaint(dayKey, hour, paintMode);
  }

  function handleCellMouseEnter(dayKey: string, hour: number) {
    if (!isMouseDown) return;
    applyPaint(dayKey, hour, paintMode);
  }

  function applyPaint(dayKey: string, hour: number, state: boolean) {
    const list = new Set(scheduleGrid[dayKey] || []);
    if (state) {
      list.add(hour);
    } else {
      list.delete(hour);
    }
    scheduleGrid = {
      ...scheduleGrid,
      [dayKey]: Array.from(list).sort((a, b) => a - b),
    };
    updateScheduleSummary();
    onChange?.(scheduleGrid);
  }

  function handleWindowMouseUp() {
    isMouseDown = false;
  }

  // Generate readable summary text from grid
  function updateScheduleSummary() {
    const activeDays = DAYS.filter((d) => (scheduleGrid[d.key] || []).length > 0);
    if (activeDays.length === 0) {
      scheduleText = 'Lịch làm việc linh hoạt theo thỏa thuận';
      return;
    }

    const dayLabels = activeDays.map((d) => d.label).join(', ');
    const allHours = activeDays.flatMap((d) => scheduleGrid[d.key] || []);
    const minH = Math.min(...allHours);
    const maxH = Math.max(...allHours) + 1;

    const minStr = minH < 10 ? `0${minH}:00` : `${minH}:00`;
    const maxStr = maxH < 10 ? `0${maxH}:00` : `${maxH}:00`;

    const isWeekdaysOnly =
      activeDays.length === 5 &&
      !activeDays.some((d) => d.key === 'sat' || d.key === 'sun');
    const prefix = isWeekdaysOnly ? 'T2 - T6' : dayLabels;

    scheduleText = `${prefix} (${minStr} - ${maxStr}, linh hoạt)`;
  }

  // Presets
  function applyOfficeHours() {
    const newGrid: Record<string, number[]> = { sat: [], sun: [] };
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach((k) => {
      newGrid[k] = [8, 9, 10, 11, 13, 14, 15, 16];
    });
    scheduleGrid = newGrid;
    updateScheduleSummary();
    onChange?.(scheduleGrid);
  }

  function applyStudentEvening() {
    const newGrid: Record<string, number[]> = { sun: [] };
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach((k) => {
      newGrid[k] = [18, 19, 20, 21];
    });
    scheduleGrid = newGrid;
    updateScheduleSummary();
    onChange?.(scheduleGrid);
  }

  function applyWeekend() {
    const newGrid: Record<string, number[]> = {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [8, 9, 10, 11, 13, 14, 15, 16, 17],
      sun: [8, 9, 10, 11, 13, 14, 15, 16, 17],
    };
    scheduleGrid = newGrid;
    updateScheduleSummary();
    onChange?.(scheduleGrid);
  }

  function applyClear() {
    const newGrid: Record<string, number[]> = {};
    DAYS.forEach((d) => (newGrid[d.key] = []));
    scheduleGrid = newGrid;
    updateScheduleSummary();
    onChange?.(scheduleGrid);
  }
</script>

<svelte:window onmouseup={handleWindowMouseUp} />

<div class="space-y-3 select-none">
  {#if label}
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-mint-500 shrink-0"></span>
        <label for="schedule-summary-input" class="font-display text-sm font-extrabold text-obsidian-900">
          {label} {#if showSummaryInput}<span class="text-signal-crimson">*</span>{/if}
        </label>
      </div>
      <span class="text-[11px] text-obsidian-600">
        Kéo chuột qua các ô để chọn giờ
      </span>
    </div>
  {/if}

  <!-- Summary text input (editable or synced) -->
  {#if showSummaryInput}
    <input
      type="text"
      id="schedule-summary-input"
      bind:value={scheduleText}
      required
      placeholder="Ví dụ: T2 - T6 (08:00 - 17:00, linh hoạt)"
      class="w-full rounded-xl border border-obsidian-900/15 bg-alabaster-50 px-3.5 py-2.5 text-xs font-semibold text-obsidian-900 placeholder:text-swiss-400 focus:border-obsidian-900 focus:outline-none focus:ring-2 focus:ring-mint/50 transition-colors"
    />
  {/if}

  <!-- Interactive Matrix Card (Fluid 100% width — Zero horizontal scroll) -->
  <div class="rounded-2xl border border-obsidian-900/15 bg-alabaster-50 p-3 sm:p-3.5 space-y-2.5">
    <!-- Presets bar -->
    <div class="flex flex-wrap items-center justify-between gap-1.5 border-b border-obsidian-900/10 pb-2.5">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onclick={applyOfficeHours}
          class="rounded-full border border-obsidian-900/15 bg-alabaster-100/70 px-2.5 py-1 text-[11px] font-bold text-obsidian-800 hover:border-mint-500 hover:bg-mint/20 transition-colors cursor-pointer"
        >
          Hành chính
        </button>
        <button
          type="button"
          onclick={applyStudentEvening}
          class="rounded-full border border-obsidian-900/15 bg-alabaster-100/70 px-2.5 py-1 text-[11px] font-bold text-obsidian-800 hover:border-mint-500 hover:bg-mint/20 transition-colors cursor-pointer"
        >
          Ca tối (18h-22h)
        </button>
        <button
          type="button"
          onclick={applyWeekend}
          class="rounded-full border border-obsidian-900/15 bg-alabaster-100/70 px-2.5 py-1 text-[11px] font-bold text-obsidian-800 hover:border-mint-500 hover:bg-mint/20 transition-colors cursor-pointer"
        >
          Cuối tuần
        </button>
      </div>

      <button
        type="button"
        onclick={applyClear}
        class="rounded-full px-2.5 py-1 text-[11px] font-bold text-signal-crimson hover:bg-signal-crimson/10 transition-colors cursor-pointer"
      >
        Xóa trắng
      </button>
    </div>

    <!-- Responsive Fluid Grid (Compact 2.5rem time col + 7 equal flexible day cols) -->
    <div class="w-full">
      <!-- Header row of days -->
      <div class="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] gap-1 mb-1.5 font-mono text-[11px] font-bold text-center">
        <div class="text-obsidian-600 text-[9px] flex items-center justify-center uppercase">Giờ</div>
        {#each DAYS as day}
          <div
            class="py-1 rounded-lg
            {day.key === 'sat' || day.key === 'sun'
              ? 'bg-alabaster-100 text-obsidian-600'
              : 'bg-alabaster-200/80 text-obsidian-900'}"
          >
            {day.label}
          </div>
        {/each}
      </div>

      <!-- Hours rows -->
      <div class="space-y-1">
        {#each HOURS as hour}
          <div class="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] gap-1 items-center font-mono text-[10px]">
            <!-- Hour label -->
            <div class="text-right pr-1.5 text-obsidian-600 text-[10px] leading-none tabular-nums">
              {hour < 10 ? `0${hour}` : hour}:00
            </div>

            <!-- 7 day cells -->
            {#each DAYS as day}
              {@const selected = isSelected(day.key, hour)}
              <div
                role="button"
                tabindex="0"
                aria-label="{day.full} {hour}h"
                onmousedown={(e) => handleCellMouseDown(day.key, hour, e)}
                onmouseenter={() => handleCellMouseEnter(day.key, hour)}
                class="h-5 rounded-md border transition-colors cursor-pointer flex items-center justify-center
                  {selected
                    ? 'bg-mint-500/85 border-mint-600 shadow-xs'
                    : 'bg-alabaster-100/80 border-obsidian-900/10 hover:bg-mint/25 hover:border-mint-500/40'}"
              >
                {#if selected}
                  <div class="w-1.5 h-1.5 rounded-full bg-alabaster-50"></div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <!-- Legend -->
      <div class="mt-2.5 pt-2 border-t border-obsidian-900/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-obsidian-600">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded bg-mint-500/85 border border-mint-600"></span>
            <span>{selectedLabel}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded bg-alabaster-100 border border-obsidian-900/15"></span>
            <span>Nghỉ</span>
          </div>
        </div>
        <span class="font-mono text-[10px] text-obsidian-600">Lịch trực quan</span>
      </div>
    </div>
  </div>
</div>
