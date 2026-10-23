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
    default:
      return 'Sinh viên';
  }
}
