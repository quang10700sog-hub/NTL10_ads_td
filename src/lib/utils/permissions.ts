import type { CourseUser, Student, UserRole } from "@/lib/types";

// ==========================================
// Permission Check Functions
// ==========================================

/**
 * Check if user can VIEW a student
 */
export function canViewStudent(
  userRole: UserRole | null,
  courseUser: CourseUser | null,
  student: Student,
  advisorStudentIds?: string[]
): boolean {
  // Admin can view all
  if (userRole === "admin") return true;

  if (!courseUser) return false;

  switch (courseUser.role_in_course) {
    case "dvt":
      // ĐVT: view all students in their unit
      return student.unit_id === courseUser.unit_id;

    case "kvt":
      // KVT: view all students in their unit (entire ĐV, not just KV)
      return student.unit_id === courseUser.unit_id;

    case "ntd":
      // NTĐ: view all students in their area (KV)
      return student.area_id === courseUser.area_id;

    case "tuvanvien":
      // Advisor: only students linked via advisor_links
      return advisorStudentIds?.includes(student.id) ?? false;

    default:
      return false;
  }
}

/**
 * Check if user can EDIT a student
 */
export function canEditStudent(
  userRole: UserRole | null,
  courseUser: CourseUser | null,
  student: Student,
  ntdIdsInMyArea?: string[]
): boolean {
  // Admin can edit all
  if (userRole === "admin") return true;

  if (!courseUser) return false;

  switch (courseUser.role_in_course) {
    case "dvt":
      // ĐVT: edit all students in their unit
      return student.unit_id === courseUser.unit_id;

    case "kvt":
      // KVT: edit students assigned to self or NTĐ in their area
      if (student.assigned_to === courseUser.id) return true;
      return ntdIdsInMyArea?.includes(student.assigned_to ?? "") ?? false;

    case "ntd":
      // NTĐ: only edit students assigned to self
      return student.assigned_to === courseUser.id;

    case "tuvanvien":
      // Advisor: cannot edit (only advisor_note via separate logic)
      return false;

    default:
      return false;
  }
}

/**
 * Check if user can DISTRIBUTE (assign) a student
 */
export function canDistributeStudent(
  userRole: UserRole | null,
  courseUser: CourseUser | null,
  student: Student
): boolean {
  if (userRole === "admin") return true;

  if (!courseUser) return false;

  switch (courseUser.role_in_course) {
    case "dvt":
      return student.unit_id === courseUser.unit_id;

    case "kvt":
      return student.area_id === courseUser.area_id;

    default:
      return false;
  }
}

/**
 * Check if user can edit the advisor_note field
 */
export function canEditAdvisorNote(
  courseUser: CourseUser | null,
  advisorStudentIds?: string[],
  studentId?: string
): boolean {
  if (!courseUser || !studentId) return false;
  return (
    courseUser.role_in_course === "tuvanvien" &&
    (advisorStudentIds?.includes(studentId) ?? false)
  );
}

/**
 * Check if user can manage (add/remove/edit) a course member
 */
export function canManageMember(
  userRole: UserRole | null,
  courseUser: CourseUser | null,
  targetMember: CourseUser
): boolean {
  if (userRole === "admin") return true;

  if (!courseUser) return false;

  switch (courseUser.role_in_course) {
    case "dvt":
      return (
        targetMember.unit_id === courseUser.unit_id &&
        ["kvt", "ntd"].includes(targetMember.role_in_course)
      );

    case "kvt":
      return (
        targetMember.area_id === courseUser.area_id &&
        targetMember.role_in_course === "ntd"
      );

    default:
      return false;
  }
}

// ==========================================
// Permission Flags (batch check)
// ==========================================

export interface StudentPermissions {
  canView: boolean;
  canEdit: boolean;
  canDistribute: boolean;
  canEditAdvisorNote: boolean;
  canDelete: boolean;
}

export function getStudentPermissions(
  userRole: UserRole | null,
  courseUser: CourseUser | null,
  student: Student,
  advisorStudentIds?: string[],
  ntdIdsInMyArea?: string[]
): StudentPermissions {
  return {
    canView: canViewStudent(userRole, courseUser, student, advisorStudentIds),
    canEdit: canEditStudent(userRole, courseUser, student, ntdIdsInMyArea),
    canDistribute: canDistributeStudent(userRole, courseUser, student),
    canEditAdvisorNote: canEditAdvisorNote(courseUser, advisorStudentIds, student.id),
    canDelete: userRole === "admin",
  };
}

// ==========================================
// Feature Permissions (by role)
// ==========================================

export function canCreateCourse(role: UserRole | null): boolean {
  return role === "admin";
}

export function canCreateUnit(role: UserRole | null): boolean {
  return role === "admin";
}

export function canCreateArea(role: UserRole | null, courseRole?: CourseUser["role_in_course"]): boolean {
  return role === "admin" || courseRole === "dvt";
}

export function canImportExcel(role: UserRole | null): boolean {
  return role === "admin";
}

export function canExportExcel(role: UserRole | null): boolean {
  return role !== null && role !== "tuvanvien";
}

export function canApproveAccounts(role: UserRole | null): boolean {
  return role === "admin";
}

export function canTransferStudentBetweenUnits(role: UserRole | null): boolean {
  return role === "admin";
}

export function canTransferStudentBetweenAreas(
  role: UserRole | null,
  courseRole?: CourseUser["role_in_course"]
): boolean {
  return role === "admin" || courseRole === "dvt";
}
