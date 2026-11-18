import type { Job } from './job';

export type UserRole = 'student' | 'company';

export interface CVAttachment {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string; // Base64 data URL for client-side storage
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  link: string;
}

export type CompanySubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface AppliedJobRecord {
  id: string; // e.g. "app-1718000000"
  jobId: string;
  jobTitle: string;
  company: string;
  companyUsername?: string;
  salary: string;
  location: string;
  categoryLabel?: string;
  appliedAt: string; // ISO date string
  applicationCode: string; // e.g. "TSV-8492"
  status: 'submitted' | 'reviewing' | 'interview' | 'accepted' | 'rejected';
  paymentMethod: 'free' | 'qr_support';
  cvName?: string;
  note?: string;
}

export interface UserProfile {
  id: string;
  role: UserRole; // 'student' | 'company'
  username: string; // e.g. "an.nguyen" or "fpt_software"
  email: string;
  password?: string;
  fullName: string; // Họ tên sinh viên hoặc Tên doanh nghiệp
  phone: string;
  avatar?: string;
  bio?: string;
  // Student-specific fields:
  university?: string;
  academicYear?: string; // 'Năm 1' | 'Năm 2' | 'Năm 3' | 'Năm 4' | 'Mới tốt nghiệp'
  major?: string;
  cvFile?: CVAttachment | null;
  portfolioLink?: string;
  portfolioProjects?: PortfolioProject[];
  savedJobIds?: string[]; // IDs of jobs saved/pinned by this user
  appliedJobs?: AppliedJobRecord[]; // List of jobs/companies this user applied to
  // Company-specific fields:
  industry?: string;
  address?: string;
  website?: string;
  verified?: boolean;
  subscriptionTier?: CompanySubscriptionTier; // 'free' (10/tháng), 'premium' (50/tháng), 'enterprise' (unlimited)
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppDatabase {
  version: string;
  updatedAt: string;
  activeUserId: string | null;
  users: UserProfile[];
  jobs: Job[];
}
