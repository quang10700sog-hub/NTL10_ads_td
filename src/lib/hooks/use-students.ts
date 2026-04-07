"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";

interface UseStudentsOptions {
  courseId: string;
  unitId?: string;
  areaId?: string;
  search?: string;
}

interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalCount: number;
}

export function useStudents({
  courseId,
  unitId,
  areaId,
  search,
}: UseStudentsOptions): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

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

      let query = supabase
        .from("students")
        .select(`
          *,
          unit:units(id, name, code),
          area:areas(id, name, code),
          assigned_user:course_users!students_assigned_to_fkey(
            id, role_in_course, user_id,
            profile:profiles(id, full_name, email)
          ),
          linked_caretaker_user:course_users!students_linked_caretaker_id_fkey(
            id, role_in_course, user_id,
            profile:profiles(id, full_name, email)
          ),
          linked_caretaker_user_2:course_users!students_linked_caretaker_id_2_fkey(
            id, role_in_course, user_id,
            profile:profiles(id, full_name, email)
          )
        `, { count: "exact" })
        .eq("course_id", courseId)
        .order("stt_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (unitId) query = query.eq("unit_id", unitId);
      if (areaId) query = query.eq("area_id", areaId);
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone_zalo.ilike.%${search}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setStudents((data as Student[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [courseId, unitId, areaId, search, supabase]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    refresh: fetchStudents,
    totalCount,
  };
}
