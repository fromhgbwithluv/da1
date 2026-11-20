import { atom } from 'nanostores';
import type { ServiceItem } from '../data/services';
import { currentUser, openAuthModal } from './auth';
import { showToast } from './toast';

export const selectedBookingService = atom<ServiceItem | null>(null);
export const isBookingModalOpen = atom<boolean>(false);
export const pendingBookingService = atom<ServiceItem | null>(null);

export function openBookingModal(service: ServiceItem) {
  const user = currentUser.get();
  if (!user) {
    pendingBookingService.set(service);
    showToast('Vui lòng đăng nhập để đặt dịch vụ!', 'info');
    openAuthModal('login');
    return;
  }

  selectedBookingService.set(service);
  isBookingModalOpen.set(true);
}

export function closeBookingModal() {
  isBookingModalOpen.set(false);
  selectedBookingService.set(null);
  pendingBookingService.set(null);
}

// Tự động mở form đặt dịch vụ nếu người dùng vừa đăng nhập sau khi nhấn đặt
if (typeof window !== 'undefined') {
  currentUser.subscribe((user) => {
    if (user) {
      const pending = pendingBookingService.get();
      if (pending) {
        pendingBookingService.set(null);
        selectedBookingService.set(pending);
        isBookingModalOpen.set(true);
      }
    }
  });
}
