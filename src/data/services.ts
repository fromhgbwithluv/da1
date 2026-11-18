export type ServiceCategory = 'cv-profile' | 'interview' | 'b2b';

export interface ServiceItem {
  id: string;
  title: string;
  category: ServiceCategory;
  badge: 'Hồ sơ' | 'Huấn luyện' | 'Doanh nghiệp';
  price: number;
  duration: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'cv-ats',
    title: 'Tối ưu hóa & Chấm điểm CV chuẩn ATS 1:1',
    category: 'cv-profile',
    badge: 'Hồ sơ',
    price: 29000,
    duration: 'Trả kết quả trong 24h',
    description: 'Chỉnh sửa câu chữ, định dạng chuẩn ATS giúp CV vượt qua bộ lọc tự động của doanh nghiệp.',
    features: [
      'Sửa chi tiết 1-1',
      'Chấm điểm chuẩn ATS',
      'Gợi ý làm nổi bật project'
    ],
    popular: true
  },
  {
    id: 'portfolio-design',
    title: 'Thiết kế Portfolio / CV Cá nhân hóa',
    category: 'cv-profile',
    badge: 'Hồ sơ',
    price: 49000,
    duration: 'Bàn giao trong 48h',
    description: 'Bộ template Notion/Web cá nhân chuẩn mực dành cho sinh viên IT, Designer và Marketer.',
    features: [
      'Showcase project ấn tượng',
      'Tối ưu hiển thị mobile/web',
      'Tặng kèm domain cá nhân'
    ]
  },
  {
    id: 'mock-interview',
    title: 'Phỏng vấn thử (Mock Interview 1-1) cùng Mentor',
    category: 'interview',
    badge: 'Huấn luyện',
    price: 79000,
    duration: '45 phút qua Google Meet',
    description: 'Tập dượt phỏng vấn cùng Tech Lead / HR từ doanh nghiệp thực tế, nhận đánh giá chi tiết.',
    features: [
      '1-1 trực tiếp qua Meet',
      'Bộ câu hỏi sát thực tế',
      'Nhận xét điểm mạnh & điểm yếu'
    ],
    popular: true
  },
  {
    id: 'skill-audit',
    title: 'Thẩm định & Định hướng kỹ năng trước thực tập',
    category: 'interview',
    badge: 'Huấn luyện',
    price: 39000,
    duration: '30 phút định hướng',
    description: 'Đánh giá bài test năng lực lập trình/chuyên môn để bù đắp kiến thức thiếu trước khi nộp đơn.',
    features: [
      'Test năng lực thực chiến',
      'Lộ trình ôn tập cấp tốc',
      'Checklist chuẩn bị kỳ thực tập'
    ]
  },
  {
    id: 'b2b-vip-job',
    title: 'Gói Đăng Tin Ghim VIP 14 Ngày (Dành cho Doanh nghiệp)',
    category: 'b2b',
    badge: 'Doanh nghiệp',
    price: 199000,
    duration: '14 ngày hiển thị',
    description: 'Đưa tin tuyển dụng lên vị trí Top đầu trang chủ và danh mục việc làm, tiếp cận hàng nghìn sinh viên.',
    features: [
      'Ghim vị trí số 1',
      'Nhãn Verified đối tác',
      'Tăng 500% lượt nộp hồ sơ'
    ],
    popular: true
  },
  {
    id: 'b2b-talent-pool',
    title: 'Gói Tiếp Cận Talent Pool Sinh Viên Top',
    category: 'b2b',
    badge: 'Doanh nghiệp',
    price: 299000,
    duration: 'Hỗ trợ theo đợt',
    description: 'Gửi thông tin tuyển dụng trực tiếp tới nhóm sinh viên tiêu biểu các trường Đại học trọng điểm.',
    features: [
      'Lọc theo GPA & giải thưởng',
      'Gửi email trực tiếp',
      'Hỗ trợ lọc CV vòng đầu'
    ]
  }
];
