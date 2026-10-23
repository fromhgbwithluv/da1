import type { Job } from '../types/job';

// All mock jobs cleared as requested - jobs are now dynamically created by registered companies and stored in JSON Database
export const mockJobs: Job[] = [];

export const categories = [
  { id: 'all', label: 'Tất cả cơ hội', icon: 'sparkles', count: 0 },
  { id: 'part-time', label: 'Năm 1-2: Part-time linh hoạt', icon: 'clock', count: 0 },
  { id: 'internship', label: 'Năm 3-4: Thực tập chuyên ngành', icon: 'briefcase', count: 0 },
  { id: 'fresher', label: 'Mới tốt nghiệp: Fresher full-time', icon: 'award', count: 0 },
] as const;
