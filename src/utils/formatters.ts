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
