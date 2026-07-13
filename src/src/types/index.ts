/** ============ Shared Types ============ */

export type ComplaintStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
export type PraiseCategory = 'SERVICE_BEHAVIOR' | 'GENERAL_SERVICE';
export type ContactChannel = 'NONE' | 'PHONE' | 'LINE' | 'EMAIL';
export type RewardKind = 'ROOT' | 'FLOWER' | 'FRUIT';
export type FeedbackKind = 'COMPLAINT' | 'SUGGESTION';

/** ใบไม้ 1 ใบบนต้น — ข้อมูลสาธารณะเท่านั้น (ไม่มีรายละเอียดร้องเรียน) */
export interface PublicLeaf {
  id: string;
  kind: 'COMPLAINT' | 'SUGGESTION' | 'PRAISE';
  departmentId?: string | null;   // ใช้กรองใบตามหน่วยงาน (ต้นหลัก = รับทุกใบ)
  status?: ComplaintStatus;        // เฉพาะ complaint/suggestion
  category?: PraiseCategory;       // เฉพาะ praise
  branchIndex: number;
  branchT: number;
  createdAt: string;
}

/** คำชมแบบเปิดอ่านได้ (public) */
export interface PublicPraise {
  id: string;
  category: PraiseCategory;
  message: string;
  senderName: string | null;
  staffName: string | null;
  departmentName: string | null;
  createdAt: string;
}

export interface TreeSnapshot {
  leaves: PublicLeaf[];
  rewards: { id: string; kind: RewardKind; anchor: number }[];
}

/** Payload ฟอร์มร้องเรียน */
export interface ComplaintInput {
  kind: FeedbackKind;
  isAnonymous: boolean;
  senderName?: string;
  phone?: string;
  line?: string;
  email?: string;
  contactChannel: ContactChannel;
  departmentId?: string;
  category: string;
  detail: string;
  incidentAt?: string;
  attachments: string[];
  captchaToken: string;
}

/** Payload ฟอร์มคำชม */
export interface PraiseInput {
  isAnonymous: boolean;
  senderName?: string;
  departmentId?: string;
  category: PraiseCategory;
  message: string;
  staffName?: string;
  attachments: string[];
  captchaToken: string;
}

/** ข้อร้องเรียนฝั่ง Admin (ถอดรหัสข้อมูลติดต่อแล้ว — เห็นเฉพาะ Admin) */
export interface AdminComplaint {
  id: string;
  kind: FeedbackKind;
  isAnonymous: boolean;
  senderName: string;
  phone: string | null;
  line: string | null;
  email: string | null;
  contactChannel: ContactChannel;
  department: string;
  category: string;
  detail: string;
  incidentAt: string | null;
  attachments: string[];
  status: ComplaintStatus;
  adminNote: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

/** สถิติ Dashboard */
export interface DashboardStats {
  complaints: { total: number; NEW: number; IN_PROGRESS: number; RESOLVED: number };
  praises: { total: number; SERVICE_BEHAVIOR: number; GENERAL_SERVICE: number };
  rewards: { ROOT: number; FLOWER: number; FRUIT: number };
  resolvedPercent: number;
  avgResponseHours: number | null;
  departmentRanking: { name: string; complaints: number; praises: number }[];
  monthly: { month: string; complaints: number; praises: number }[];
}


/** ---------- Dashboard สาธารณะ (The Nursing Growth Tree) ---------- */

export interface FeedItem {
  id: string;
  type: 'PRAISE' | 'SUGGESTION' | 'COMPLAINT';
  /** คำชม = ข้อความจริง / ข้อเสนอแนะ+ข้อร้องเรียน = แสดงเฉพาะประเภทเรื่อง (รักษาความลับ) */
  text: string;
  status?: ComplaintStatus;
  departmentName: string | null;
  senderName: string | null;
  createdAt: string;
}

export interface PublicDashboard {
  praise: { total: number; SERVICE_BEHAVIOR: number; GENERAL_SERVICE: number };
  rewards: { FLOWER: number; FRUIT: number; ROOT: number };
  care: { NEW: number; IN_PROGRESS: number; RESOLVED: number; total: number };
  suggestionTotal: number;
  /** % การเติบโตของจำนวนเสียงสะท้อนเดือนนี้เทียบเดือนก่อน (null = ยังไม่มีฐานเทียบ) */
  growthPercent: number | null;
  /** Top 3 หน่วยงานที่ได้รับคำชื่นชมสูงสุดประจำเดือนนี้ */
  topDepartments: { name: string; praises: number }[];
  feed: FeedItem[];
}


/** หน่วยงานสำหรับหน้าแอดมิน (จัดการได้ ไม่ต้องแก้โค้ด) */
export interface AdminDepartment {
  id: string;
  name: string;
  active: boolean;
  praises: number;
  complaints: number;
}
