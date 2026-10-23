export type JobCategory = 'part-time' | 'internship' | 'fresher';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyUsername: string; // e.g. "@fpt_software"
  authorId?: string; // ID of company user who posted it
  category: JobCategory;
  categories?: JobCategory[]; // Multi-category support
  categoryLabel: string;
  targetGroup: string; // e.g. "Năm 1 - 2", "Năm 3 - 4", "Mới tốt nghiệp"
  salary: string;
  salaryNumber?: number;
  minSalary?: number;
  maxSalary?: number;
  isSalaryNegotiable?: boolean;
  location: string;
  provinceCode?: string; // e.g. "01" (Hà Nội), "79" (TP.HCM), "48" (Đà Nẵng), or "remote"
  provinceName?: string; // e.g. "Hà Nội", "Hồ Chí Minh", "Đà Nẵng"
  wardCode?: string; // e.g. "00166" (Phường Cầu Giấy)
  wardName?: string; // e.g. "Phường Cầu Giấy"
  workType: 'Part-time' | 'Thực tập' | 'Full-time' | 'Hybrid' | 'Remote';
  schedule: string;
  scheduleGrid?: Record<string, number[]>; // When2Meet-style schedule matrix
  imageUrl: string;
  summary: string;
  markdownContent?: string; // Full job description stored as Markdown!
  description?: string[];
  requirements?: string[];
  benefits?: string[];
  tags: string[];
  postedAt: string;
  updatedAt?: string;
  deadline: string;
  verified: boolean;
  featured?: boolean;
}

export interface CandidateApplication {
  fullName: string;
  email: string;
  phone: string;
  university: string;
  academicYear: string;
  major: string;
  cvLink?: string;
  note?: string;
  paymentMethod: 'free' | 'qr_support';
  jobs: Job[];
}
