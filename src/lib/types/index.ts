// ==========================================
// Enums
// ==========================================

export type UserRole = "admin" | "dvt" | "kvt" | "ntd" | "tuvanvien";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type CourseStatus = "active" | "archived" | "draft";
export type CourseRole = "dvt" | "kvt" | "ntd" | "tuvanvien";

// ==========================================
// Database Row Types
// ==========================================

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole | null;
  approval_status: string;
  password_plain?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  status: CourseStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  course_id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  unit_id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseUser {
  id: string;
  course_id: string;
  user_id: string;
  role_in_course: CourseRole;
  unit_id: string | null;
  area_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  unit?: Unit;
  area?: Area;
}

export interface Student {
  id: string;
  course_id: string;
  unit_id: string | null;
  area_id: string | null;
  assigned_to: string | null;
  linked_caretaker_id: string | null;
  linked_caretaker_id_2: string | null;
  full_name: string;
  birth_year: string | null;
  gender: string | null;
  phone_zalo: string;
  facebook_link: string | null;
  occupation: string | null;
  residence: string | null;
  dynamic_data: Record<string, unknown>;
  learning_status: string | null;
  contact_status: string | null;
  care_content: string | null;
  advisor_note: string | null;
  stt_order: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  unit?: Unit;
  area?: Area;
  assigned_user?: CourseUser & { profile?: Profile };
  linked_caretaker_user?: CourseUser & { profile?: Profile };
  linked_caretaker_user_2?: CourseUser & { profile?: Profile };
}

export interface AdvisorLink {
  id: string;
  student_id: string;
  advisor_id: string;
  created_at: string;
}

export interface CareLog {
  id: string;
  student_id: string;
  caretaker_id: string;
  content: string;
  log_type: string | null;
  created_at: string;
}

export interface ImportBatch {
  id: string;
  course_id: string;
  file_name: string;
  total_rows: number;
  new_rows: number;
  updated_rows: number;
  imported_by: string;
  created_at: string;
}

// ==========================================
// App State Types
// ==========================================

export interface AppUser {
  id: string;
  profile: Profile;
  courseUsers: CourseUser[];
}

export interface ExcelColumnMapping {
  columnIndex: number;
  excelHeader: string;
  dbField: string | null; // null = goes to dynamic_data
  isFixed: boolean;
}

export interface ExcelPreviewRow {
  rowIndex: number;
  data: Record<string, string>;
  isNew: boolean; // true = new student, false = will update existing
}

export interface ImportResult {
  totalRows: number;
  newRows: number;
  updatedRows: number;
  errors: string[];
}

// ==========================================
// UI Types
// ==========================================

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles?: UserRole[]; // If empty, visible to all
  adminOnly?: boolean;
}

export interface StatsCard {
  title: string;
  value: number | string;
  icon: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export interface FilterOption {
  label: string;
  value: string;
}

// ==========================================
// Role Display Helpers
// ==========================================

export const ROLE_LABELS: Record<UserRole | CourseRole, string> = {
  admin: "Quản trị viên",
  dvt: "Địa vực trưởng",
  kvt: "Khu vực trưởng",
  ntd: "Người truyền đạo",
  tuvanvien: "Tư vấn viên",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  active: "Đang hoạt động",
  archived: "Lưu trữ",
  draft: "Nháp",
};

// Fixed columns by position (A-G) — always the same for every course
export const FIXED_COLUMN_POSITIONS: Record<number, string> = {
  0: "full_name",      // A: Họ Tên
  1: "birth_year",     // B: Năm sinh
  2: "gender",         // C: Giới tính
  3: "phone_zalo",     // D: SĐT/Zalo
  4: "facebook_link",  // E: Link Facebook
  5: "occupation",     // F: Nghề nghiệp
  6: "residence",      // G: Nơi ở
};

// Special header-based mappings for known columns after G
export const SPECIAL_HEADER_MAPPINGS: Record<string, string> = {
  "Nội dung chăm sóc": "advisor_note",
};
