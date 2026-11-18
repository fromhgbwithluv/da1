<script lang="ts">
  let {
    scheduleText = $bindable('Linh hoạt 3 - 4 ca/tuần'),
    scheduleGrid = $bindable<Record<string, number[]>>({}),
    label = 'Thời gian làm việc / Ca làm (Lịch When2meet)',
  }: {
    scheduleText?: string;
    scheduleGrid?: Record<string, number[]>;
    label?: string;
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

  // Ensure initial structure
  $effect(() => {
    if (!scheduleGrid || Object.keys(scheduleGrid).length === 0) {
      // Default initial slots: T2 - T6 morning & afternoon (8-17)
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

    // Detect if T2-T6
    const isWeekdaysOnly = activeDays.length === 5 && !activeDays.some((d) => d.key === 'sat' || d.key === 'sun');
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
  }

  function applyStudentEvening() {
    const newGrid: Record<string, number[]> = { sun: [] };
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach((k) => {
      newGrid[k] = [18, 19, 20, 21];
    });
    scheduleGrid = newGrid;
    updateScheduleSummary();
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
  }

  function applyClear() {
    const newGrid: Record<string, number[]> = {};
    DAYS.forEach((d) => (newGrid[d.key] = []));
    scheduleGrid = newGrid;
    updateScheduleSummary();
  }
</script>

<svelte:window onmouseup={handleWindowMouseUp} />

<div class="space-y-2 select-none">
  <div class="flex items-center justify-between">
    <label for="schedule-summary-input" class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700">
      {label} *
    </label>
    <span class="font-mono text-[10px] text-swiss-400">
      [ Kéo chuột qua các ô để chọn ca ]
    </span>
  </div>

  <!-- Summary text input (editable or synced) -->
  <div class="relative">
    <input
      type="text"
      id="schedule-summary-input"
      bind:value={scheduleText}
      required
      placeholder="Ví dụ: T2 - T6 (08:00 - 17:00, linh hoạt)"
      class="w-full rounded-swiss-sm border border-swiss-300 px-3 py-2 text-xs font-semibold text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black bg-swiss-50/50"
    />
  </div>

  <!-- When2Meet Interactive Matrix Container -->
  <div class="rounded-swiss-sm border border-black bg-white p-3 shadow-swiss-card space-y-2.5 overflow-x-auto">
    <!-- Presets bar -->
    <div class="flex flex-wrap items-center justify-between gap-1.5 border-b border-swiss-200 pb-2">
      <div class="flex flex-wrap items-center gap-1">
        <span class="font-mono text-[10px] text-swiss-400 uppercase font-bold mr-1">Ca mẫu:</span>
        <button
          type="button"
          onclick={applyOfficeHours}
          class="font-mono text-[10px] font-bold px-2 py-0.5 rounded-swiss-xs border border-swiss-300 bg-swiss-50 hover:bg-black hover:text-white transition-colors"
        >
          Hành chính (T2-T6)
        </button>
        <button
          type="button"
          onclick={applyStudentEvening}
          class="font-mono text-[10px] font-bold px-2 py-0.5 rounded-swiss-xs border border-swiss-300 bg-swiss-50 hover:bg-black hover:text-white transition-colors"
        >
          Ca tối sinh viên (18h-22h)
        </button>
        <button
          type="button"
          onclick={applyWeekend}
          class="font-mono text-[10px] font-bold px-2 py-0.5 rounded-swiss-xs border border-swiss-300 bg-swiss-50 hover:bg-black hover:text-white transition-colors"
        >
          Cuối tuần (T7-CN)
        </button>
      </div>

      <button
        type="button"
        onclick={applyClear}
        class="font-mono text-[10px] text-signal-crimson hover:underline"
      >
        [Xóa trắng]
      </button>
    </div>

    <!-- The When2Meet Grid Table -->
    <div class="min-w-[420px]">
      <!-- Header row of days -->
      <div class="grid grid-cols-8 gap-1 mb-1 font-mono text-[11px] font-bold text-center">
        <div class="text-swiss-400 text-[10px] flex items-center justify-center">GIỜ \ NGÀY</div>
        {#each DAYS as day}
          <div class="py-1 rounded-swiss-xs {day.key === 'sat' || day.key === 'sun' ? 'bg-swiss-100 text-swiss-700' : 'bg-black text-white'}">
            {day.label}
          </div>
        {/each}
      </div>

      <!-- Hours rows -->
      <div class="space-y-1">
        {#each HOURS as hour}
          <div class="grid grid-cols-8 gap-1 items-center font-mono text-[10px]">
            <!-- Hour label -->
            <div class="text-right pr-2 text-swiss-400 text-[10px] font-mono leading-none">
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
                class="h-5 rounded-swiss-xs border transition-all cursor-pointer flex items-center justify-center
                  {selected
                    ? 'bg-signal-emerald border-emerald-600 shadow-xs'
                    : 'bg-swiss-50 hover:bg-swiss-200 border-swiss-200'}"
              >
                {#if selected}
                  <div class="w-1.5 h-1.5 rounded-full bg-white opacity-80"></div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <!-- Legend -->
      <div class="mt-2.5 pt-2 border-t border-swiss-200 flex items-center justify-between font-mono text-[10px] text-swiss-500">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <span class="inline-block w-3 h-3 rounded-swiss-xs bg-signal-emerald border border-emerald-600"></span>
            <span>Ca làm việc yêu cầu</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-block w-3 h-3 rounded-swiss-xs bg-swiss-50 border border-swiss-200"></span>
            <span>Nghỉ</span>
          </div>
        </div>
        <span class="text-swiss-400">Chuẩn When2Meet grid</span>
      </div>
    </div>
  </div>
</div>
