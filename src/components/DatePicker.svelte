<script lang="ts">
  import { onMount } from 'svelte';

  let {
    value = $bindable(''),
    label = '',
    id = 'date-picker-' + Math.random().toString(36).slice(2, 7),
    placeholder = 'Chọn ngày (DD/MM/YYYY)',
    required = false,
    minDate = null as Date | string | null,
    disabled = false,
  } = $props<{
    value?: string;
    label?: string;
    id?: string;
    placeholder?: string;
    required?: boolean;
    minDate?: Date | string | null;
    disabled?: boolean;
  }>();

  let isOpen = $state(false);
  let containerRef: HTMLDivElement | null = $state(null);

  // Parse initial date from DD/MM/YYYY or YYYY-MM-DD
  function parseDateString(str: string): Date | null {
    if (!str || !str.trim()) return null;
    const trimmed = str.trim();

    // Check DD/MM/YYYY
    const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      const year = parseInt(dmy[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // Check YYYY-MM-DD
    const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = parseInt(ymd[2], 10) - 1;
      const day = parseInt(ymd[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  function formatDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const initialDate = parseDateString(value) || new Date();
  let viewYear = $state(initialDate.getFullYear());
  let viewMonth = $state(initialDate.getMonth()); // 0-indexed

  // Min date boundary
  let parsedMinDate = $derived.by(() => {
    if (!minDate) return null;
    if (minDate instanceof Date) return minDate;
    return parseDateString(minDate);
  });

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const weekdayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  interface CalendarDay {
    dayNumber: number;
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
  }

  let daysMatrix = $derived.by(() => {
    const selectedDate = parseDateString(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Monday is 0, Sunday is 6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        dayNumber: prevMonthLastDay - i,
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        isSelected: !!selectedDate && d.toDateString() === selectedDate.toDateString(),
        isDisabled: !!parsedMinDate && d.getTime() < new Date(parsedMinDate).setHours(0, 0, 0, 0),
      });
    }

    // Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const d = new Date(viewYear, viewMonth, day);
      d.setHours(0, 0, 0, 0);
      days.push({
        dayNumber: day,
        date: d,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
        isSelected: !!selectedDate && d.toDateString() === selectedDate.toDateString(),
        isDisabled: !!parsedMinDate && d.getTime() < new Date(parsedMinDate).setHours(0, 0, 0, 0),
      });
    }

    // Next month padding (total slots should be multiple of 7, usually 35 or 42)
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
      const d = new Date(viewYear, viewMonth + 1, nextDay);
      d.setHours(0, 0, 0, 0);
      days.push({
        dayNumber: nextDay,
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        isSelected: !!selectedDate && d.toDateString() === selectedDate.toDateString(),
        isDisabled: !!parsedMinDate && d.getTime() < new Date(parsedMinDate).setHours(0, 0, 0, 0),
      });
    }

    return days;
  });

  function prevMonth() {
    if (viewMonth === 0) {
      viewMonth = 11;
      viewYear -= 1;
    } else {
      viewMonth -= 1;
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      viewMonth = 0;
      viewYear += 1;
    } else {
      viewMonth += 1;
    }
  }

  function selectDate(d: Date) {
    value = formatDate(d);
    isOpen = false;
  }

  function applyPreset(daysToAdd: number) {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    value = formatDate(target);
    viewYear = target.getFullYear();
    viewMonth = target.getMonth();
    isOpen = false;
  }

  function applyEndOfMonth() {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    value = formatDate(endOfMonth);
    viewYear = endOfMonth.getFullYear();
    viewMonth = endOfMonth.getMonth();
    isOpen = false;
  }

  function clearDate() {
    value = '';
    isOpen = false;
  }

  // Click outside listener
  function handleDocumentClick(e: MouseEvent) {
    if (!containerRef) return;
    if (!containerRef.contains(e.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });
</script>

<div class="relative w-full" bind:this={containerRef}>
  {#if label}
    <label for={id} class="block font-mono text-[11px] uppercase tracking-wide text-swiss-700 mb-1">
      {label}
    </label>
  {/if}

  <!-- Trigger input -->
  <div class="relative">
    <input
      type="text"
      {id}
      bind:value={value}
      {placeholder}
      {required}
      {disabled}
      readonly
      onclick={() => { if (!disabled) isOpen = !isOpen; }}
      class="w-full cursor-pointer rounded-swiss-sm border border-swiss-300 bg-white px-3 py-2 pr-9 text-xs font-medium text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
    />

    <button
      type="button"
      tabindex="-1"
      onclick={() => { if (!disabled) isOpen = !isOpen; }}
      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-swiss-500 hover:text-black focus:outline-none"
      aria-label="Mở lịch chọn ngày"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>
  </div>

  {#if isOpen}
    <!-- Calendar Popup Dropdown (Swiss Architectural Popover) -->
    <div
      class="absolute left-0 top-full z-50 mt-1.5 w-72 sm:w-80 rounded-swiss-md border border-black bg-white p-3.5 shadow-swiss-elevated font-mono"
      role="dialog"
      aria-modal="true"
      aria-label="Lịch chọn ngày"
    >
      <!-- Month & Year Navigation -->
      <div class="flex items-center justify-between border-b border-swiss-200 pb-2 mb-2.5">
        <button
          type="button"
          onclick={prevMonth}
          class="flex h-7 w-7 items-center justify-center rounded-swiss-sm border border-swiss-300 bg-white text-black hover:border-black hover:bg-swiss-50 transition-colors"
          aria-label="Tháng trước"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="text-xs font-black uppercase tracking-wider text-black">
          {monthNames[viewMonth]} {viewYear}
        </div>

        <button
          type="button"
          onclick={nextMonth}
          class="flex h-7 w-7 items-center justify-center rounded-swiss-sm border border-swiss-300 bg-white text-black hover:border-black hover:bg-swiss-50 transition-colors"
          aria-label="Tháng sau"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Quick Date Presets -->
      <div class="mb-2.5 flex flex-wrap gap-1 border-b border-swiss-100 pb-2">
        <button
          type="button"
          onclick={() => applyPreset(7)}
          class="rounded-swiss-xs bg-swiss-100 px-1.5 py-0.5 text-[10px] font-bold text-swiss-800 hover:bg-black hover:text-white transition-colors"
        >
          +7 ngày
        </button>
        <button
          type="button"
          onclick={() => applyPreset(14)}
          class="rounded-swiss-xs bg-swiss-100 px-1.5 py-0.5 text-[10px] font-bold text-swiss-800 hover:bg-black hover:text-white transition-colors"
        >
          +14 ngày
        </button>
        <button
          type="button"
          onclick={() => applyPreset(30)}
          class="rounded-swiss-xs bg-swiss-100 px-1.5 py-0.5 text-[10px] font-bold text-swiss-800 hover:bg-black hover:text-white transition-colors"
        >
          +30 ngày
        </button>
        <button
          type="button"
          onclick={applyEndOfMonth}
          class="rounded-swiss-xs bg-swiss-100 px-1.5 py-0.5 text-[10px] font-bold text-swiss-800 hover:bg-black hover:text-white transition-colors"
        >
          Cuối tháng
        </button>
      </div>

      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-swiss-400 mb-1">
        {#each weekdayNames as wd}
          <div class="py-1">{wd}</div>
        {/each}
      </div>

      <!-- Days Grid -->
      <div class="grid grid-cols-7 gap-1 text-center text-xs">
        {#each daysMatrix as cell}
          <button
            type="button"
            disabled={cell.isDisabled}
            onclick={() => selectDate(cell.date)}
            class="h-8 w-full rounded-swiss-sm text-[11px] font-bold transition-all relative flex items-center justify-center
            {cell.isSelected 
              ? 'bg-black text-white shadow-xs' 
              : cell.isDisabled 
              ? 'text-swiss-300 cursor-not-allowed bg-swiss-50' 
              : cell.isCurrentMonth 
              ? 'text-black hover:bg-swiss-100' 
              : 'text-swiss-400 hover:bg-swiss-50'}"
          >
            {cell.dayNumber}
            {#if cell.isToday && !cell.isSelected}
              <span class="absolute bottom-1 h-1 w-1 rounded-full bg-signal-emerald"></span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Footer Bar -->
      <div class="mt-3 flex items-center justify-between border-t border-swiss-200 pt-2 text-[10px]">
        <button
          type="button"
          onclick={clearDate}
          class="font-bold text-signal-crimson hover:underline"
        >
          [ Xóa ngày ]
        </button>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => applyPreset(0)}
            class="font-bold text-black hover:underline"
          >
            [ Hôm nay ]
          </button>
          <button
            type="button"
            onclick={() => { isOpen = false; }}
            class="rounded-swiss-xs border border-swiss-300 bg-white px-2 py-0.5 font-bold uppercase text-black hover:border-black"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
