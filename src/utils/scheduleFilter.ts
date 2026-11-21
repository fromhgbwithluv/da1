import type { Job } from '../types/job';
import { normalizeVietnamese } from '../data/provinces';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type ScheduleGrid = Record<string, number[]>;

export const EMPTY_SCHEDULE_GRID: ScheduleGrid = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

export const DAY_OPTIONS: { key: DayKey; label: string; full: string }[] = [
  { key: 'mon', label: 'T2', full: 'Thứ 2' },
  { key: 'tue', label: 'T3', full: 'Thứ 3' },
  { key: 'wed', label: 'T4', full: 'Thứ 4' },
  { key: 'thu', label: 'T5', full: 'Thứ 5' },
  { key: 'fri', label: 'T6', full: 'Thứ 6' },
  { key: 'sat', label: 'T7', full: 'Thứ 7' },
  { key: 'sun', label: 'CN', full: 'Chủ Nhật' },
];

const ALL_DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const ALL_HOURS: number[] = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const DAY_INDEX_MAP: Record<string, number> = {
  '2': 0,
  '3': 1,
  '4': 2,
  '5': 3,
  '6': 4,
  '7': 5,
  cn: 6,
};

export function countSelectedSlots(grid?: ScheduleGrid): number {
  if (!grid) return 0;
  let total = 0;
  for (const d of ALL_DAYS) {
    total += (grid[d] || []).length;
  }
  return total;
}

export function hasActiveScheduleGrid(grid?: ScheduleGrid): boolean {
  return countSelectedSlots(grid) > 0;
}

export function summarizeScheduleGrid(grid?: ScheduleGrid): string {
  if (!grid) return '';
  const activeDays = DAY_OPTIONS.filter((d) => (grid[d.key] || []).length > 0);
  if (activeDays.length === 0) return '';

  const allHours = activeDays.flatMap((d) => grid[d.key] || []);
  const minH = Math.min(...allHours);
  const maxH = Math.max(...allHours) + 1;
  const minStr = `${minH < 10 ? '0' : ''}${minH}h`;
  const maxStr = `${maxH < 10 ? '0' : ''}${maxH}h`;

  const isWeekdaysOnly =
    activeDays.length === 5 &&
    !activeDays.some((d) => d.key === 'sat' || d.key === 'sun');
  const dayText = isWeekdaysOnly
    ? 'T2–T6'
    : activeDays.map((d) => d.label).join(', ');

  return `${dayText} (${minStr}–${maxStr})`;
}

/**
 * Derive a normalized day -> hours[] schedule grid from either job.scheduleGrid
 * or by parsing the job.schedule string (for seed/legacy jobs without a grid).
 */
export function getNormalizedJobGrid(job: Job): Record<DayKey, number[]> {
  if (job.scheduleGrid) {
    const hasSlots = ALL_DAYS.some((d) => (job.scheduleGrid?.[d] || []).length > 0);
    if (hasSlots) {
      const grid = {} as Record<DayKey, number[]>;
      for (const d of ALL_DAYS) {
        grid[d] = [...(job.scheduleGrid[d] || [])];
      }
      return grid;
    }
  }

  const norm = normalizeVietnamese(job.schedule || '');
  const detectedDays = new Set<DayKey>();

  const rangeRegex = /(?:t|thu\s*)([2-7])\s*[-–]\s*(?:t|thu\s*)?([2-7]|cn)/g;
  let rangeMatch: RegExpExecArray | null;
  while ((rangeMatch = rangeRegex.exec(norm)) !== null) {
    const startIdx = DAY_INDEX_MAP[rangeMatch[1]];
    const endIdx = DAY_INDEX_MAP[rangeMatch[2]];
    if (startIdx !== undefined && endIdx !== undefined && startIdx <= endIdx) {
      for (let i = startIdx; i <= endIdx; i++) {
        detectedDays.add(ALL_DAYS[i]);
      }
    }
  }

  const singleDayRegex = /\b(?:t|thu\s*)([2-7])\b/g;
  let dayMatch: RegExpExecArray | null;
  while ((dayMatch = singleDayRegex.exec(norm)) !== null) {
    const idx = DAY_INDEX_MAP[dayMatch[1]];
    if (idx !== undefined) detectedDays.add(ALL_DAYS[idx]);
  }
  if (/\bcn\b|chu nhat/.test(norm)) {
    detectedDays.add('sun');
  }
  if (norm.includes('cuoi tuan') || norm.includes('weekend')) {
    detectedDays.add('sat');
    detectedDays.add('sun');
  }
  if (norm.includes('hanh chinh') && detectedDays.size === 0) {
    (['mon', 'tue', 'wed', 'thu', 'fri'] as DayKey[]).forEach((d) => detectedDays.add(d));
  }

  const finalDays = detectedDays.size > 0 ? Array.from(detectedDays) : ALL_DAYS;

  const detectedHours = new Set<number>();
  const timeRangeRegex = /(\d{1,2})(?::\d{2}|h\d{0,2})\s*[-–]\s*(\d{1,2})(?::\d{2}|h\d{0,2})/g;
  let timeMatch: RegExpExecArray | null;
  while ((timeMatch = timeRangeRegex.exec(norm)) !== null) {
    const startH = Math.max(8, Math.min(21, parseInt(timeMatch[1], 10)));
    const endH = Math.max(startH + 1, Math.min(22, parseInt(timeMatch[2], 10)));
    for (let h = startH; h < endH; h++) {
      detectedHours.add(h);
    }
  }

  if (detectedHours.size === 0) {
    if (norm.includes('sang')) [8, 9, 10, 11].forEach((h) => detectedHours.add(h));
    if (norm.includes('chieu')) [13, 14, 15, 16, 17].forEach((h) => detectedHours.add(h));
    if (norm.includes('toi') || norm.includes('dem')) [18, 19, 20, 21].forEach((h) => detectedHours.add(h));
    if (norm.includes('hanh chinh')) [8, 9, 10, 11, 13, 14, 15, 16].forEach((h) => detectedHours.add(h));
  }

  const finalHours = detectedHours.size > 0 ? Array.from(detectedHours) : ALL_HOURS;

  const grid = {} as Record<DayKey, number[]>;
  for (const d of ALL_DAYS) {
    grid[d] = finalDays.includes(d) ? finalHours : [];
  }
  return grid;
}

/**
 * Required minimum schedule match ratio by job type:
 * - Part-time (flexible/rotating shifts): 50% of the job's shift slots
 * - Internship / Fresher (fixed schedule): 100% of the job's required slots
 * - Project (deliverable-based): 50%
 */
export function getRequiredScheduleMatchRatio(job: Job): number {
  const cats = job.categories && job.categories.length > 0 ? job.categories : [job.category];

  if (cats.includes('part-time') || job.workType === 'Part-time') {
    return 0.5;
  }

  if (
    cats.includes('internship') ||
    cats.includes('fresher') ||
    job.workType === 'Thực tập' ||
    job.workType === 'Full-time'
  ) {
    return 1.0;
  }

  return 0.5;
}

/**
 * Checks if a job's schedule matches the student's selected free-time grid:
 * - Internship & Fresher: 100% of job's required slots must be covered
 * - Part-time (and Project): at least 50% of job's shift slots must be covered
 */
export function matchesScheduleGrid(job: Job, studentGrid?: ScheduleGrid): boolean {
  if (!hasActiveScheduleGrid(studentGrid)) return true;

  const jobGrid = getNormalizedJobGrid(job);
  let totalJobSlots = 0;
  let matchedJobSlots = 0;

  for (const day of ALL_DAYS) {
    const jobHours = jobGrid[day] || [];
    if (jobHours.length === 0) continue;

    const studentHourSet = new Set(studentGrid?.[day] || []);
    for (const h of jobHours) {
      totalJobSlots += 1;
      if (studentHourSet.has(h)) {
        matchedJobSlots += 1;
      }
    }
  }

  if (totalJobSlots === 0) return false;

  const requiredRatio = getRequiredScheduleMatchRatio(job);
  return matchedJobSlots / totalJobSlots >= requiredRatio;
}
