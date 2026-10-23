import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';
import type { AppDatabase, UserProfile, UserRole, CVAttachment, PortfolioProject } from '../types/user';
import type { Job } from '../types/job';
import initialDb from '../data/database.json';
import { showToast } from './toast';
import { detectProvinceFromLocation, detectWardFromLocation, normalizeVietnamese } from '../data/provinces';
import { isValidVietnamesePhone } from '../utils/formatters';
import {
  isSupabaseConfigured,
  fetchCloudDatabase,
  pushCloudDatabase,
  subscribeToCloudDatabase
} from '../lib/supabase';

// Persistent JSON Database Atom (Key bumped to v2 for clean state without mock data)
export const databaseStore = persistentAtom<AppDatabase>('topsivi_json_db_v2', initialDb as AppDatabase, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Device-specific session atom: each device keeps its own login state (NEVER shared to cloud)
export const localActiveUserId = persistentAtom<string | null>('topsivi_device_session_v1', null, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// UI Modal state
export const isAuthModalOpen = atom<boolean>(false);
export const authModalTab = atom<'login' | 'register' | 'forgot' | 'profile'>('login');
export const isPostJobModalOpen = atom<boolean>(false);
export const editingJob = atom<Job | null>(null);
export const isUpgradeModalOpen = atom<boolean>(false);
export const isApplicationHistoryOpen = atom<boolean>(false);
export const isCloudSyncing = atom<boolean>(false);
export const isCloudConnected = atom<boolean>(false);

export function openApplicationHistoryModal() {
  const user = currentUser.get();
  if (user?.role === 'company') {
    showToast('Tài khoản Doanh nghiệp không có lịch sử nộp đơn ứng tuyển!', 'info');
    return;
  }
  isApplicationHistoryOpen.set(true);
}

export function closeApplicationHistoryModal() {
  isApplicationHistoryOpen.set(false);
}

export function openAuthModal(tab: 'login' | 'register' | 'forgot' | 'profile' = 'login') {
  authModalTab.set(tab);
  isAuthModalOpen.set(true);
}

export function closeAuthModal() {
  isAuthModalOpen.set(false);
}

export function openPostJobModal(jobToEdit?: Job) {
  if (jobToEdit) {
    editingJob.set(jobToEdit);
  } else {
    editingJob.set(null);
  }
  isPostJobModalOpen.set(true);
}

export function closePostJobModal() {
  editingJob.set(null);
  isPostJobModalOpen.set(false);
}

export function openUpgradeModal() {
  isUpgradeModalOpen.set(true);
}

export function closeUpgradeModal() {
  isUpgradeModalOpen.set(false);
}

export const TIER_LIMITS = {
  free: 10,
  premium: 50,
  enterprise: Infinity,
} as const;

export function getCompanyMonthlyJobStats(userId: string) {
  const db = databaseStore.get();
  const user = db.users.find((u) => u.id === userId);
  const tier = user?.subscriptionTier || 'free';
  const maxPosts = TIER_LIMITS[tier] ?? 10;

  const userJobs = (db.jobs || []).filter(
    (j) => j.authorId === userId || (user && j.companyUsername.toLowerCase() === ('@' + user.username).toLowerCase())
  );

  const usedCount = userJobs.length;
  const remaining = maxPosts === Infinity ? Infinity : Math.max(0, maxPosts - usedCount);
  const isLimitReached = maxPosts !== Infinity && usedCount >= maxPosts;

  return {
    tier,
    usedCount,
    maxPosts,
    remaining,
    isLimitReached,
    percentUsed: maxPosts === Infinity ? 0 : Math.min(100, Math.round((usedCount / maxPosts) * 100)),
  };
}

export function upgradePlan(tier: 'premium' | 'enterprise'): boolean {
  const user = currentUser.get();
  if (!user || user.role !== 'company') {
    showToast('Chỉ tài khoản Doanh nghiệp mới có thể nâng cấp gói dịch vụ', 'remove');
    return false;
  }

  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);

  updateProfile({
    subscriptionTier: tier,
    subscriptionExpiresAt: expires.toISOString(),
  });

  const tierName = tier === 'enterprise' ? 'Enterprise (Không giới hạn)' : 'Premium (50 bài/tháng)';
  showToast(`Chúc mừng! Bạn đã nâng cấp thành công lên gói ${tierName}!`, 'success');
  closeUpgradeModal();
  return true;
}

// Current logged in user computed atom (Independent per device)
export const currentUser = computed([databaseStore, localActiveUserId], (db, activeId) => {
  const currentId = activeId || db?.activeUserId;
  if (!db || !currentId) return null;
  return db.users.find((u) => u.id === currentId) || null;
});

// All dynamic jobs stored in JSON Database with resolved province and ward metadata
export const databaseJobs = computed(databaseStore, (db) => {
  const rawJobs = db?.jobs || [];
  return rawJobs.map((job) => {
    let resolvedProvCode = job.provinceCode;
    let resolvedProvName = job.provinceName;
    let resolvedWardCode = job.wardCode;
    let resolvedWardName = job.wardName;

    if (!resolvedProvCode || !resolvedProvName) {
      if (
        job.workType === 'Remote' ||
        normalizeVietnamese(job.location).includes('remote') ||
        normalizeVietnamese(job.location).includes('tu xa')
      ) {
        resolvedProvCode = 'remote';
        resolvedProvName = 'Online / Remote';
      } else {
        const detected = detectProvinceFromLocation(job.location);
        resolvedProvCode = detected ? detected.code : 'other';
        resolvedProvName = detected ? detected.name : job.location;
      }
    }

    if (!resolvedWardCode && resolvedProvCode && resolvedProvCode !== 'remote' && resolvedProvCode !== 'other') {
      const detectedWard = detectWardFromLocation(resolvedProvCode, job.location);
      if (detectedWard) {
        resolvedWardCode = detectedWard.code;
        resolvedWardName = detectedWard.fullName;
      }
    }

    return {
      ...job,
      provinceCode: resolvedProvCode,
      provinceName: resolvedProvName,
      wardCode: resolvedWardCode,
      wardName: resolvedWardName,
    };
  });
});

const TIER_PRIORITY: Record<string, number> = {
  enterprise: 3,
  premium: 2,
  free: 1,
};

const jobJitterMap = new Map<string, number>();
function getJobJitter(jobId: string): number {
  if (!jobJitterMap.has(jobId)) {
    jobJitterMap.set(jobId, Math.random());
  }
  return jobJitterMap.get(jobId)!;
}

export function rankAndSortJobs(jobs: Job[], users: UserProfile[]): Job[] {
  const companyTierMap = new Map<string, number>();
  for (const u of users) {
    if (u.role === 'company') {
      const tierRank = TIER_PRIORITY[u.subscriptionTier || 'free'] || 1;
      companyTierMap.set(u.id, tierRank);
      companyTierMap.set(('@' + u.username).toLowerCase(), tierRank);
      companyTierMap.set(u.fullName.toLowerCase(), tierRank);
    }
  }

  const items = jobs.map((job) => {
    let rank = 1;
    if (job.authorId && companyTierMap.has(job.authorId)) {
      rank = companyTierMap.get(job.authorId)!;
    } else if (job.companyUsername && companyTierMap.has(job.companyUsername.toLowerCase())) {
      rank = companyTierMap.get(job.companyUsername.toLowerCase())!;
    } else if (job.company && companyTierMap.has(job.company.toLowerCase())) {
      rank = companyTierMap.get(job.company.toLowerCase())!;
    }

    return {
      job,
      rank,
      jitter: getJobJitter(job.id),
    };
  });

  // Sort descending by rank (3 -> 2 -> 1). If rank equal, tie-break by jitter
  items.sort((a, b) => {
    if (b.rank !== a.rank) {
      return b.rank - a.rank;
    }
    return b.jitter - a.jitter;
  });

  return items.map((i) => i.job);
}

// All dynamic jobs sorted by company tier (Enterprise > Premium > Free, random among equal tiers)
export const rankedDatabaseJobs = computed([databaseJobs, databaseStore], (jobs, db) => {
  return rankAndSortJobs(jobs, db?.users || []);
});

// Find user by username (@username or username)
export function getUserByUsername(rawUsername: string): UserProfile | null {
  const db = databaseStore.get();
  const clean = rawUsername.trim().replace(/^@/, '').toLowerCase();
  return db.users.find((u) => u.username.toLowerCase() === clean) || null;
}

// Auth Actions
export function login(usernameOrEmail: string, password?: string): boolean {
  const db = databaseStore.get();
  const trimmed = usernameOrEmail.trim().toLowerCase().replace(/^@/, '');
  
  const found = db.users.find(
    (u) => u.username.toLowerCase() === trimmed || u.email.toLowerCase() === trimmed
  );

  if (!found) {
    showToast('Tài khoản hoặc email không tồn tại trong hệ thống', 'remove');
    return false;
  }

  if (found.password && password && found.password !== password) {
    showToast('Mật khẩu không chính xác', 'remove');
    return false;
  }

  localActiveUserId.set(found.id);
  const updated: AppDatabase = {
    ...db,
    activeUserId: found.id,
    updatedAt: new Date().toISOString(),
  };

  databaseStore.set(updated);
  showToast(`Xin chào ${found.fullName}! Bạn đã đăng nhập thành công.`, 'success');
  closeAuthModal();
  return true;
}

export function register(userData: {
  role: UserRole;
  fullName: string;
  email: string;
  username: string;
  password?: string;
  phone: string;
  avatar?: string;
  // Student
  university?: string;
  academicYear?: string;
  major?: string;
  bio?: string;
  // Company
  industry?: string;
  address?: string;
  website?: string;
}): UserProfile | null {
  const db = databaseStore.get();
  const cleanUsername = userData.username.trim().replace(/^@/, '').toLowerCase();
  const cleanEmail = userData.email.trim().toLowerCase();

  // Check unique username & email
  const existingUser = db.users.find(
    (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
  );

  if (existingUser) {
    showToast(`Tên đăng nhập hoặc Email đã tồn tại trong hệ thống!`, 'remove');
    return null;
  }

  if (!isValidVietnamesePhone(userData.phone)) {
    showToast('Số điện thoại không đúng chuẩn di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)!', 'remove');
    return null;
  }

  const id = (userData.role === 'company' ? 'com-' : 'std-') + Date.now();
  const now = new Date().toISOString();

  const newUser: UserProfile = {
    id,
    role: userData.role,
    fullName: userData.fullName.trim(),
    email: cleanEmail,
    username: cleanUsername,
    password: userData.password || '123456',
    phone: userData.phone.trim(),
    avatar: userData.avatar || '',
    bio: userData.bio || '',
    createdAt: now,
    updatedAt: now,
    // Role specifics:
    university: userData.university || '',
    academicYear: userData.academicYear || (userData.role === 'student' ? 'Năm 1' : ''),
    major: userData.major || '',
    cvFile: null,
    portfolioProjects: [],
    portfolioLink: '',
    industry: userData.industry || '',
    address: userData.address || '',
    website: userData.website || '',
    verified: userData.role === 'company', // Companies registered verified
    subscriptionTier: userData.role === 'company' ? 'free' : undefined,
  };

  const updated: AppDatabase = {
    ...db,
    users: [...db.users, newUser],
    activeUserId: id,
    updatedAt: now,
  };

  localActiveUserId.set(id);
  databaseStore.set(updated);
  showToast(`Tạo tài khoản ${userData.role === 'company' ? 'Doanh nghiệp' : 'Sinh viên'} thành công!`, 'success');
  closeAuthModal();
  return newUser;
}

export function logout() {
  localActiveUserId.set(null);
  const db = databaseStore.get();
  const updated: AppDatabase = {
    ...db,
    activeUserId: null,
    updatedAt: new Date().toISOString(),
  };
  databaseStore.set(updated);
  showToast('Đã đăng xuất khỏi tài khoản', 'info');
}

export function updateProfile(fields: Partial<UserProfile>): boolean {
  if (fields.phone && !isValidVietnamesePhone(fields.phone)) {
    showToast('Số điện thoại không đúng chuẩn di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)!', 'remove');
    return false;
  }

  const db = databaseStore.get();
  const activeId = db.activeUserId;
  if (!activeId) return false;

  const now = new Date().toISOString();
  const updatedUsers = db.users.map((u) => {
    if (u.id === activeId) {
      return {
        ...u,
        ...fields,
        updatedAt: now,
      };
    }
    return u;
  });

  const updatedDb: AppDatabase = {
    ...db,
    users: updatedUsers,
    updatedAt: now,
  };

  databaseStore.set(updatedDb);
  showToast('Đã cập nhật hồ sơ vào Database JSON!', 'success');
  return true;
}

export async function uploadCVFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const cvAttachment: CVAttachment = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };

      updateProfile({ cvFile: cvAttachment });
      showToast(`Đã upload CV "${file.name}" vào hồ sơ!`, 'success');
      resolve(true);
    };

    reader.onerror = () => {
      showToast('Lỗi khi đọc file CV, vui lòng thử lại', 'remove');
      resolve(false);
    };

    reader.readAsDataURL(file);
  });
}

export function removeCVFile() {
  updateProfile({ cvFile: null });
  showToast('Đã gỡ bỏ file CV khỏi hồ sơ', 'info');
}

export async function uploadAvatar(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP, GIF)', 'remove');
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const activeUser = currentUser.get();
            if (activeUser) {
              updateProfile({ avatar: dataUrl });
              showToast('Đã cập nhật ảnh đại diện thành công!', 'success');
            }
            resolve(dataUrl);
            return;
          }
        } catch (_err) {
          // ignore canvas error and fallback
        }
        const fallbackUrl = e.target?.result as string;
        const activeUser = currentUser.get();
        if (activeUser) {
          updateProfile({ avatar: fallbackUrl });
          showToast('Đã cập nhật ảnh đại diện thành công!', 'success');
        }
        resolve(fallbackUrl);
      };
      img.onerror = () => {
        const fallbackUrl = e.target?.result as string;
        const activeUser = currentUser.get();
        if (activeUser) {
          updateProfile({ avatar: fallbackUrl });
          showToast('Đã cập nhật ảnh đại diện thành công!', 'success');
        }
        resolve(fallbackUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      showToast('Lỗi khi đọc file ảnh đại diện', 'remove');
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

export function removeAvatar() {
  updateProfile({ avatar: '' });
  showToast('Đã gỡ ảnh đại diện, chuyển về avatar chữ mặc định', 'info');
}

export function addPortfolioProject(title: string, description: string, link: string) {
  const user = currentUser.get();
  if (!user) return;

  const newProject: PortfolioProject = {
    id: 'proj-' + Date.now(),
    title,
    description,
    link,
  };

  const projects = [...(user.portfolioProjects || []), newProject];
  updateProfile({ portfolioProjects: projects });
  showToast(`Đã thêm dự án "${title}" vào Portfolio!`, 'success');
}

export function removePortfolioProject(projectId: string) {
  const user = currentUser.get();
  if (!user || !user.portfolioProjects) return;

  const filtered = user.portfolioProjects.filter((p) => p.id !== projectId);
  updateProfile({ portfolioProjects: filtered });
  showToast('Đã xóa dự án khỏi Portfolio', 'info');
}

// User Pinned / Saved Jobs Management (Account-based)
export function toggleUserFavorite(job: Job): boolean {
  const user = currentUser.get();
  if (!user) {
    showToast('Vui lòng đăng nhập để lưu công việc vào giỏ hồ sơ!', 'remove');
    openAuthModal('login');
    return false;
  }

  const currentSaved = user.savedJobIds || [];
  const exists = currentSaved.includes(job.id);
  let updatedSaved: string[];

  if (exists) {
    updatedSaved = currentSaved.filter((id) => id !== job.id);
    showToast(`Đã bỏ ghim "${job.title.slice(0, 28)}..."`, 'remove');
  } else {
    updatedSaved = [job.id, ...currentSaved];
    showToast(`Đã ghim "${job.title.slice(0, 28)}..." vào danh sách!`, 'success');
  }

  updateProfile({
    savedJobIds: updatedSaved,
  });

  return true;
}

export function isJobSavedForActiveUser(jobId: string): boolean {
  const user = currentUser.get();
  if (!user || !user.savedJobIds) return false;
  return user.savedJobIds.includes(jobId);
}

// Application History Recording
export function recordApplication(
  jobs: Job[],
  details: {
    applicationCode: string;
    paymentMethod: 'free' | 'qr_support';
    cvName?: string;
    note?: string;
  }
): boolean {
  const user = currentUser.get();
  if (!user) {
    showToast('Vui lòng đăng nhập để nộp hồ sơ ứng tuyển!', 'remove');
    openAuthModal('login');
    return false;
  }

  const now = new Date().toISOString();
  const newRecords: import('../types/user').AppliedJobRecord[] = jobs.map((j) => ({
    id: 'app-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    jobId: j.id,
    jobTitle: j.title,
    company: j.company,
    companyUsername: j.companyUsername,
    salary: j.salary,
    location: j.location,
    categoryLabel: j.categoryLabel,
    appliedAt: now,
    applicationCode: details.applicationCode,
    status: 'submitted',
    paymentMethod: details.paymentMethod,
    cvName: details.cvName,
    note: details.note,
  }));

  const existing = user.appliedJobs || [];
  updateProfile({
    appliedJobs: [...newRecords, ...existing],
    // Also remove applied jobs from savedJobIds
    savedJobIds: (user.savedJobIds || []).filter((id) => !jobs.some((j) => j.id === id)),
  });

  return true;
}

// Company Job Posting in Markdown
export function postNewJob(jobData: {
  title: string;
  category: 'part-time' | 'internship' | 'fresher';
  categories?: ('part-time' | 'internship' | 'fresher')[];
  salary: string;
  minSalary?: number;
  maxSalary?: number;
  isSalaryNegotiable?: boolean;
  location: string;
  provinceCode?: string;
  provinceName?: string;
  wardCode?: string;
  wardName?: string;
  workType: 'Part-time' | 'Thực tập' | 'Full-time' | 'Hybrid' | 'Remote';
  schedule: string;
  scheduleGrid?: Record<string, number[]>;
  imageUrl?: string;
  summary: string;
  markdownContent: string;
  deadline: string;
  tags?: string[];
}): Job | null {
  const user = currentUser.get();
  if (!user || user.role !== 'company') {
    showToast('Chỉ tài khoản Doanh nghiệp mới có quyền đăng tin tuyển dụng!', 'remove');
    return null;
  }

  // Check monthly posting limit (Default free: 10 jobs/month)
  const stats = getCompanyMonthlyJobStats(user.id);
  if (stats.isLimitReached) {
    showToast(`Doanh nghiệp đã dùng hết ${stats.maxPosts} bài đăng/tháng của gói Free. Vui lòng nâng cấp gói Premium để tiếp tục!`, 'remove');
    openUpgradeModal();
    return null;
  }

  const db = databaseStore.get();
  const id = 'job-' + Date.now();
  const now = new Date().toISOString();

  const categories = (jobData.categories && jobData.categories.length > 0)
    ? jobData.categories
    : [jobData.category];
  const primaryCategory = categories[0];

  const groupNames: string[] = [];
  const labelNames: string[] = [];
  if (categories.includes('part-time')) {
    groupNames.push('Năm 1, 2');
    labelNames.push('Part-time');
  }
  if (categories.includes('internship')) {
    groupNames.push('Năm 3, 4');
    labelNames.push('Thực tập');
  }
  if (categories.includes('fresher')) {
    groupNames.push('Mới tốt nghiệp');
    labelNames.push('Fresher');
  }
  const targetGroup = groupNames.join(' • ') || 'Sinh viên';
  const categoryLabel = labelNames.join(' • ') || 'Tuyển dụng';

  const defaultImg = jobData.imageUrl?.trim() || 
    (categories.includes('internship')
      ? 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
      : categories.includes('fresher')
      ? 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80');

  let resolvedProvinceCode = jobData.provinceCode;
  let resolvedProvinceName = jobData.provinceName;
  let resolvedWardCode = jobData.wardCode;
  let resolvedWardName = jobData.wardName;

  if (!resolvedProvinceCode) {
    if (jobData.workType === 'Remote' || normalizeVietnamese(jobData.location).includes('remote')) {
      resolvedProvinceCode = 'remote';
      resolvedProvinceName = 'Online / Remote';
    } else {
      const detected = detectProvinceFromLocation(jobData.location);
      resolvedProvinceCode = detected ? detected.code : 'other';
      resolvedProvinceName = detected ? detected.name : jobData.location;
    }
  }

  if (!resolvedWardCode && resolvedProvinceCode && resolvedProvinceCode !== 'remote' && resolvedProvinceCode !== 'other') {
    const detectedWard = detectWardFromLocation(resolvedProvinceCode, jobData.location);
    if (detectedWard) {
      resolvedWardCode = detectedWard.code;
      resolvedWardName = detectedWard.fullName;
    }
  }

  const newJob: Job = {
    id,
    title: jobData.title,
    company: user.fullName,
    companyUsername: '@' + user.username,
    authorId: user.id,
    category: primaryCategory,
    categories,
    categoryLabel,
    targetGroup,
    salary: jobData.salary,
    minSalary: jobData.minSalary,
    maxSalary: jobData.maxSalary,
    isSalaryNegotiable: jobData.isSalaryNegotiable,
    location: jobData.location,
    provinceCode: resolvedProvinceCode,
    provinceName: resolvedProvinceName,
    wardCode: resolvedWardCode,
    wardName: resolvedWardName,
    workType: jobData.workType,
    schedule: jobData.schedule,
    scheduleGrid: jobData.scheduleGrid,
    imageUrl: defaultImg,
    summary: jobData.summary,
    markdownContent: jobData.markdownContent,
    deadline: jobData.deadline || '30/12/2026',
    postedAt: 'Vừa xong',
    verified: true,
    tags: jobData.tags && jobData.tags.length > 0 ? jobData.tags : [primaryCategory, user.industry || 'Tuyển dụng'],
  };

  const updated: AppDatabase = {
    ...db,
    jobs: [newJob, ...(db.jobs || [])],
    updatedAt: now,
  };

  databaseStore.set(updated);
  showToast(`Đã đăng bài viết công việc "${newJob.title}" thành công!`, 'success');
  closePostJobModal();
  return newJob;
}

export function updateJob(jobId: string, jobData: Partial<Job>): Job | null {
  const user = currentUser.get();
  if (!user || user.role !== 'company') {
    showToast('Chỉ tài khoản Doanh nghiệp mới có quyền chỉnh sửa tin tuyển dụng!', 'remove');
    return null;
  }

  const db = databaseStore.get();
  const existingIndex = (db.jobs || []).findIndex((j) => j.id === jobId);
  if (existingIndex === -1) {
    showToast('Không tìm thấy bài đăng để chỉnh sửa!', 'remove');
    return null;
  }

  const existingJob = db.jobs[existingIndex];
  if (existingJob.authorId !== user.id && existingJob.companyUsername.toLowerCase() !== ('@' + user.username).toLowerCase()) {
    showToast('Bạn không có quyền chỉnh sửa bài đăng này!', 'remove');
    return null;
  }

  // Recalculate categories if provided
  let categories = jobData.categories || existingJob.categories || [existingJob.category];
  let primaryCategory = categories[0] || existingJob.category;

  const groupNames: string[] = [];
  const labelNames: string[] = [];
  if (categories.includes('part-time')) {
    groupNames.push('Năm 1, 2');
    labelNames.push('Part-time');
  }
  if (categories.includes('internship')) {
    groupNames.push('Năm 3, 4');
    labelNames.push('Thực tập');
  }
  if (categories.includes('fresher')) {
    groupNames.push('Mới tốt nghiệp');
    labelNames.push('Fresher');
  }
  const targetGroup = groupNames.join(' • ') || existingJob.targetGroup;
  const categoryLabel = labelNames.join(' • ') || existingJob.categoryLabel;

  const updatedJob: Job = {
    ...existingJob,
    ...jobData,
    id: existingJob.id,
    authorId: existingJob.authorId,
    company: existingJob.company,
    companyUsername: existingJob.companyUsername,
    category: primaryCategory,
    categories,
    categoryLabel,
    targetGroup,
    updatedAt: new Date().toISOString(),
  };

  const updatedJobs = [...db.jobs];
  updatedJobs[existingIndex] = updatedJob;

  const updated: AppDatabase = {
    ...db,
    jobs: updatedJobs,
    updatedAt: new Date().toISOString(),
  };

  databaseStore.set(updated);
  showToast(`Đã lưu thay đổi cho bài đăng "${updatedJob.title}"!`, 'success');
  closePostJobModal();
  return updatedJob;
}

export function deleteJob(jobId: string) {
  const user = currentUser.get();
  const db = databaseStore.get();
  const job = (db.jobs || []).find((j) => j.id === jobId);

  if (!job) return;
  if (!user || (user.id !== job.authorId && user.username !== job.companyUsername.replace(/^@/, ''))) {
    showToast('Bạn không có quyền xóa bài đăng này', 'remove');
    return;
  }

  const updated: AppDatabase = {
    ...db,
    jobs: (db.jobs || []).filter((j) => j.id !== jobId),
    updatedAt: new Date().toISOString(),
  };

  databaseStore.set(updated);
  showToast(`Đã xóa bài đăng việc làm`, 'info');
}

// Export / Download Database as JSON (Chỉ dành riêng cho tài khoản username admin)
export function exportDatabaseJSON() {
  const user = currentUser.get();
  if (user?.username?.toLowerCase() !== 'admin') {
    showToast('Chức năng này chỉ có thể được sử dụng bởi tài khoản admin!', 'remove');
    return;
  }

  const db = databaseStore.get();
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `topsivi_database_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã tải file Database JSON về máy!', 'success');
}

// -------------------------------------------------------------
// Cloud Database (Supabase) Synchronization Logic
// -------------------------------------------------------------
let isInternalSyncUpdate = false;
let cloudSyncDebounceTimer: any = null;
let realtimeUnsubscribe: (() => void) | null = null;
let lastSyncedUsersSnapshot = '';
let lastSyncedJobsSnapshot = '';

export async function initCloudDatabase() {
  if (typeof window === 'undefined') return;

  const connected = isSupabaseConfigured();
  isCloudConnected.set(connected);

  if (!connected) return;

  isCloudSyncing.set(true);
  try {
    const cloudDb = await fetchCloudDatabase();
    if (cloudDb && Array.isArray(cloudDb.users)) {
      isInternalSyncUpdate = true;
      // Preserve THIS device's own login session
      const mySessionId = localActiveUserId.get();
      databaseStore.set({
        ...cloudDb,
        activeUserId: mySessionId,
      });
      lastSyncedUsersSnapshot = JSON.stringify(cloudDb.users || []);
      lastSyncedJobsSnapshot = JSON.stringify(cloudDb.jobs || []);
      isInternalSyncUpdate = false;
    } else {
      // First time initialization on Supabase: push local database
      const current = databaseStore.get();
      await pushCloudDatabase(current);
      lastSyncedUsersSnapshot = JSON.stringify(current.users || []);
      lastSyncedJobsSnapshot = JSON.stringify(current.jobs || []);
    }

    if (realtimeUnsubscribe) {
      realtimeUnsubscribe();
    }

    realtimeUnsubscribe = subscribeToCloudDatabase((remoteDb) => {
      if (remoteDb && Array.isArray(remoteDb.users)) {
        isInternalSyncUpdate = true;
        // Keep THIS device's own login session!
        const mySessionId = localActiveUserId.get();
        databaseStore.set({
          ...remoteDb,
          activeUserId: mySessionId,
        });
        lastSyncedUsersSnapshot = JSON.stringify(remoteDb.users || []);
        lastSyncedJobsSnapshot = JSON.stringify(remoteDb.jobs || []);
        isInternalSyncUpdate = false;
        // Chạy ngầm hoàn toàn trong background, không hiện thông báo
      }
    });
  } catch (err: any) {
    console.error('[Cloud DB] Error initializing cloud database:', err);
    showToast('Không thể kết nối đến máy chủ Cloud Database. Đang chạy ngoại tuyến.', 'remove');
  } finally {
    isCloudSyncing.set(false);
  }
}

export async function forceSyncToCloud() {
  if (!isSupabaseConfigured()) {
    showToast('Chưa cấu hình Supabase Cloud!', 'remove');
    return;
  }
  isCloudSyncing.set(true);
  const ok = await pushCloudDatabase(databaseStore.get());
  isCloudSyncing.set(false);
  if (!ok) {
    showToast('Lỗi khi kết nối máy chủ Cloud Database!', 'remove');
  }
}

export async function forceSyncFromCloud() {
  if (!isSupabaseConfigured()) {
    showToast('Chưa cấu hình Supabase Cloud!', 'remove');
    return;
  }
  isCloudSyncing.set(true);
  try {
    const cloudDb = await fetchCloudDatabase();
    if (cloudDb && Array.isArray(cloudDb.users)) {
      isInternalSyncUpdate = true;
      const mySessionId = localActiveUserId.get();
      databaseStore.set({
        ...cloudDb,
        activeUserId: mySessionId,
      });
      isInternalSyncUpdate = false;
    } else {
      showToast('Không thể kết nối đến máy chủ Cloud Database!', 'remove');
    }
  } catch {
    showToast('Không thể kết nối đến máy chủ Cloud Database!', 'remove');
  } finally {
    isCloudSyncing.set(false);
  }
}

// Auto-sync subscription
if (typeof window !== 'undefined') {
  databaseStore.subscribe((currentDb) => {
    if (isInternalSyncUpdate) return;
    if (!isSupabaseConfigured()) return;

    // Chỉ đồng bộ khi users hoặc jobs thay đổi (bỏ qua khi chỉ activeUserId thay đổi khi login/logout)
    const usersStr = JSON.stringify(currentDb.users || []);
    const jobsStr = JSON.stringify(currentDb.jobs || []);
    if (usersStr === lastSyncedUsersSnapshot && jobsStr === lastSyncedJobsSnapshot) {
      return;
    }
    lastSyncedUsersSnapshot = usersStr;
    lastSyncedJobsSnapshot = jobsStr;

    if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
    cloudSyncDebounceTimer = setTimeout(async () => {
      isCloudSyncing.set(true);
      const ok = await pushCloudDatabase(currentDb);
      isCloudSyncing.set(false);
      if (!ok) {
        showToast('Không thể kết nối đến máy chủ Cloud Database. Vui lòng kiểm tra mạng!', 'remove');
      }
    }, 500);
  });

  // Khởi chạy đồng bộ ngầm khi client mount
  setTimeout(() => {
    initCloudDatabase();
  }, 100);
}
