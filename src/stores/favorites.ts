import { atom, computed } from 'nanostores';
import type { Job } from '../types/job';
import { toastNotification, showToast } from './toast';
import { currentUser, databaseJobs, toggleUserFavorite, openAuthModal, updateProfile } from './auth';

export { toastNotification, showToast };

// Pinned / Favorite jobs computed per user account
export const favoriteJobs = computed([currentUser, databaseJobs], (user, allJobs) => {
  if (!user || !user.savedJobIds || user.savedJobIds.length === 0) return [];
  const map = new Map(allJobs.map((j) => [j.id, j]));
  return user.savedJobIds.map((id) => map.get(id)).filter(Boolean) as Job[];
});

// UI State: Drawer
export const isDrawerOpen = atom<boolean>(false);

export function openDrawer() {
  const user = currentUser.get();
  if (!user) {
    showToast('Vui lòng đăng nhập để xem giỏ hồ sơ công việc!', 'info');
    openAuthModal('login');
    return;
  }
  if (user.role === 'company') {
    showToast('Tài khoản Doanh nghiệp không sử dụng giỏ nộp hồ sơ ứng tuyển!', 'info');
    return;
  }
  isDrawerOpen.set(true);
}

export function closeDrawer() {
  isDrawerOpen.set(false);
}

// UI State: Checkout Modal
export const isCheckoutOpen = atom<boolean>(false);
export const checkoutJobs = atom<Job[]>([]);

export function openCheckout(jobsToApply?: Job[]) {
  const user = currentUser.get();
  if (!user) {
    showToast('Vui lòng đăng nhập để nộp hồ sơ ứng tuyển!', 'remove');
    openAuthModal('login');
    return;
  }

  if (user.role === 'company') {
    showToast('Tài khoản Doanh nghiệp không thể ứng tuyển vào công việc!', 'remove');
    return;
  }

  const jobs = jobsToApply && jobsToApply.length > 0 ? jobsToApply : favoriteJobs.get();
  if (jobs.length === 0) {
    showToast('Giỏ hồ sơ của bạn đang trống. Hãy ghim hoặc chọn ít nhất 1 công việc!', 'info');
    return;
  }

  checkoutJobs.set(jobs);
  isCheckoutOpen.set(true);
  isDrawerOpen.set(false);
}

export function closeCheckout() {
  isCheckoutOpen.set(false);
}

// UI State: Detail Modal
export const selectedJobDetail = atom<Job | null>(null);

export function openJobDetail(job: Job) {
  selectedJobDetail.set(job);
}

export function closeJobDetail() {
  selectedJobDetail.set(null);
}

// Store actions
export function toggleFavorite(job: Job) {
  const user = currentUser.get();
  if (user?.role === 'company') {
    showToast('Tài khoản Doanh nghiệp không sử dụng tính năng ghim ứng tuyển!', 'info');
    return false;
  }
  return toggleUserFavorite(job);
}

export function removeFavorite(jobId: string) {
  const user = currentUser.get();
  if (!user) return;
  const currentSaved = user.savedJobIds || [];
  const updated = currentSaved.filter((id) => id !== jobId);
  updateProfile({ savedJobIds: updated });
  showToast('Đã xóa công việc khỏi danh sách đã ghim', 'info');
}

export function clearFavorites() {
  const user = currentUser.get();
  if (!user) return;
  updateProfile({ savedJobIds: [] });
  showToast('Đã làm trống danh sách công việc đã ghim', 'info');
}

export function isJobSaved(jobId: string): boolean {
  const user = currentUser.get();
  if (!user || !user.savedJobIds) return false;
  return user.savedJobIds.includes(jobId);
}
