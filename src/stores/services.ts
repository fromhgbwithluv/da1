import { atom } from 'nanostores';
import type { ServiceItem } from '../data/services';

export const selectedBookingService = atom<ServiceItem | null>(null);
export const isBookingModalOpen = atom<boolean>(false);

export function openBookingModal(service: ServiceItem) {
  selectedBookingService.set(service);
  isBookingModalOpen.set(true);
}

export function closeBookingModal() {
  isBookingModalOpen.set(false);
  selectedBookingService.set(null);
}
