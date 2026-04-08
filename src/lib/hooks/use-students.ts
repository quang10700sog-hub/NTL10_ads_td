"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";

interface UseStudentsOptions {
  courseId: string;
  unitId?: string;
  areaId?: string;
  search?: string;
  /** Current user's course_user ID — used to also fetch students where user is linked caretaker */
  currentCourseUserId?: string;
  /** Filter by primary caretaker (assigned_to) */
  assignedTo?: string;
  /** Filter by linked caretaker */
  linkedCaretakerId?: string;
  /** Filter students with no primary caretaker assigned */
  unassignedOnly?: boolean;
}

interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalCount: number;
  /** IDs of students where the current user is a linked caretaker (view-only) */
  linkedStudentIds: Set<string>;
}

const STUDENT_SELECT = `
  *,
  unit:units(id, name, code),
  area:areas(id, name, code),
  assigned_user:course_users!students_assigned_to_fkey(
    id, role_in_course, user_id,
    profile:profiles(id, full_name, email),
    unit:units(id, name),
    area:areas(id, name)
  ),
  linked_caretaker_user:course_users!students_linked_caretaker_id_fkey(
    id, role_in_course, user_id,
    profile:profiles(id, full_name, email)
  ),
  linked_caretaker_user_2:course_users!students_linked_caretaker_id_2_fkey(
    id, role_in_course, user_id,
    profile:profiles(id, full_name, email)
  )
`;

export function useStudents({
  courseId,
  unitId,
  areaId,
  search,
  currentCourseUserId,
  assignedTo,
  linkedCaretakerId,
  unassignedOnly,
}: UseStudentsOptions): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [linkedStudentIds, setLinkedStudentIds] = useState<Set<string>>(new Set());

  const supabase = createClient();

  const fetchStudents = useCallback(async () => {
    if (!courseId) {
      setStudents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Main query: filter by unit/area
      let query = supabase
        .from("students")
        .select(STUDENT_SELECT, { count: "exact" })
        .eq("course_id", courseId)
        .order("stt_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (unitId) query = query.eq("unit_id", unitId);
      if (areaId) query = query.eq("area_id", areaId);
      if (assignedTo) query = query.eq("assigned_to", assignedTo);
      if (linkedCaretakerId) {
        query = query.or(`linked_caretaker_id.eq.${linkedCaretakerId},linked_caretaker_id_2.eq.${linkedCaretakerId}`);
      }
      if (unassignedOnly) query = query.is("assigned_to", null);
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone_zalo.ilike.%${search}%`);
      }

      const { data: mainData, error: fetchError, count } = await query;
      if (fetchError) throw fetchError;

      let allStudents = (mainData as Student[]) ?? [];
      const mainIds = new Set(allStudents.map(s => s.id));
      const newLinkedIds = new Set<string>();

      // Extra query: fetch students where user is linked caretaker (cross-unit/area visibility)
      if (currentCourseUserId) {
        const { data: linkedData } = await supabase
          .from("students")
          .select(STUDENT_SELECT)
          .eq("course_id", courseId)
          .or(`linked_caretaker_id.eq.${currentCourseUserId},linked_caretaker_id_2.eq.${currentCourseUserId}`);

        if (linkedData) {
          for (const ls of linkedData as Student[]) {
            newLinkedIds.add(ls.id);
            if (!mainIds.has(ls.id)) {
              // Student is from a different unit/area but user is linked caretaker → add to list
              // Apply search filter if present
              if (search) {
                const s = search.toLowerCase();
                if (!ls.full_name?.toLowerCase().includes(s) && !ls.phone_zalo?.toLowerCase().includes(s)) continue;
              }
              allStudents.push(ls);
            }
          }
        }
      }

      setStudents(allStudents);
      setTotalCount((count ?? 0) + (allStudents.length - (mainData?.length ?? 0)));
      setLinkedStudentIds(newLinkedIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, unitId, areaId, search, currentCourseUserId, assignedTo, linkedCaretakerId, unassignedOnly]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    refresh: fetchStudents,
    totalCount,
    linkedStudentIds,
  };
}
