import { atom } from 'nanostores';

export const toastNotification = atom<{ message: string; type: 'success' | 'info' | 'remove' } | null>(null);
let toastTimer: any = null;

export function showToast(message: string, type: 'success' | 'info' | 'remove' = 'success') {
  if (toastTimer) clearTimeout(toastTimer);
  toastNotification.set({ message, type });
  toastTimer = setTimeout(() => {
    toastNotification.set(null);
  }, 3200);
}
