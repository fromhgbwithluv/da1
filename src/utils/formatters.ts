/**
 * Centralized formatting and display utilities for TopSiVi
 */

/**
 * Format currency amount to Vietnamese Dong string (e.g. 15.000.000đ)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

/**
 * Format date to DD/MM/YYYY string
 */
export function formatDate(input: Date | string | null | undefined): string {
  if (!input) return '';
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(input);
  }
}

/**
 * Format date & time to HH:MM - DD/MM/YYYY
 */
export function formatDateTime(input: Date | string | null | undefined): string {
  if (!input) return '';
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins} - ${day}/${month}/${year}`;
  } catch {
    return String(input);
  }
}

/**
 * Validate whether a string represents a parseable date/timestamp (rejects plain numbers and localized labels)
 */
export function isValidTimestamp(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || /^\d+$/.test(trimmed)) return false;
  return !Number.isNaN(Date.parse(trimmed));
}

/**
 * Resolve the canonical ISO 8601 postedAt timestamp for a job, recovering legacy records from job-<epochMs> ID or updatedAt
 */
export function resolveJobPostedAt(
  job: { id?: string; postedAt?: string; updatedAt?: string } | null | undefined
): string | null {
  if (!job) return null;
  if (isValidTimestamp(job.postedAt)) {
    return job.postedAt!.trim();
  }
  if (typeof job.id === 'string') {
    const match = job.id.match(/^job-(\d{10,})$/);
    if (match) {
      const ms = Number(match[1]);
      if (Number.isFinite(ms) && ms > 946684800000 && !Number.isNaN(new Date(ms).getTime())) {
        return new Date(ms).toISOString();
      }
    }
  }
  if (isValidTimestamp(job.updatedAt)) {
    return new Date(job.updatedAt!.trim()).toISOString();
  }
  return null;
}

/**
 * Format a timestamp into Vietnamese relative time (e.g. "Vừa xong", "5 phút trước", "2 ngày trước")
 */
export function formatRelativeTime(
  input: Date | string | null | undefined,
  now: Date = new Date()
): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return String(input);

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60_000) return 'Vừa xong';

  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins} phút trước`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;

  if (diffDays < 365) {
    const diffMonths = Math.max(1, Math.min(11, Math.floor(diffDays / 30)));
    return `${diffMonths} tháng trước`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} năm trước`;
}

/**
 * Format a job's posting time into a Vietnamese relative-time label
 */
export function formatJobPostedAt(
  job: { id?: string; postedAt?: string; updatedAt?: string } | null | undefined,
  now: Date = new Date()
): string {
  const resolved = resolveJobPostedAt(job);
  if (!resolved) return job?.postedAt || 'Vừa xong';
  return formatRelativeTime(resolved, now);
}

/**
 * Get human-readable student tier category label
 */
export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'part-time':
      return 'Part-time';
    case 'internship':
      return 'Thực tập';
    case 'fresher':
      return 'Fresher';
    case 'project':
      return 'Dự án';
    default:
      return category;
  }
}

/**
 * Get student target group display text
 */
export function getTargetGroupLabel(category: string): string {
  switch (category) {
    case 'part-time':
      return 'Năm 1, 2';
    case 'internship':
      return 'Năm 3, 4';
    case 'fresher':
      return 'Mới tốt nghiệp';
    case 'project':
      return 'Dự án';
    default:
      return 'Sinh viên';
  }
}

/**
 * Kiểm tra số điện thoại di động Việt Nam hợp lệ
 * Chuẩn các mạng di động Việt Nam (Viettel, Vina, Mobi, Vietnamobile, Gmobile, Itelecom, Wintel):
 * - Đầu số: 03x, 05x, 07x, 08x, 09x (hoặc +84 / 84)
 * - Độ dài: đúng 10 chữ số (hoặc 11/12 ký tự nếu có mã quốc gia)
 */
export function isValidVietnamesePhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const clean = phone.trim().replace(/[\s\.\-\(\)]/g, '');
  const vnPhoneRegex = /^(?:(?:\+84|84)0?|0)(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return vnPhoneRegex.test(clean);
}

/**
 * Định dạng số điện thoại hiển thị chuẩn (ví dụ: 0987 654 321)
 */
export function formatVietnamesePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let clean = phone.trim().replace(/[\s\.\-\(\)]/g, '');
  if (clean.startsWith('+84')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('84') && clean.length === 11) {
    clean = '0' + clean.slice(2);
  }
  if (clean.length === 10) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  return phone;
}
