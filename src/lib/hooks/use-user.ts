"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, CourseUser, UserRole } from "@/lib/types";

interface UseUserReturn {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  courseUsers: CourseUser[];
  currentCourseUser: CourseUser | null;
  isAdmin: boolean;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  setCurrentCourseId: (courseId: string) => void;
  refresh: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courseUsers, setCourseUsers] = useState<CourseUser[]>([]);
  const [currentCourseId, setCurrentCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setProfile(null);
        setCourseUsers([]);
        return;
      }

      setUser({ id: authUser.id, email: authUser.email ?? "" });

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch course_users
      const { data: courseUsersData, error: cuError } = await supabase
        .from("course_users")
        .select(`
          *,
          unit:units(*),
          area:areas(*)
        `)
        .eq("user_id", authUser.id);

      if (cuError) throw cuError;
      setCourseUsers(courseUsersData ?? []);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchData();
        } else {
          setUser(null);
          setProfile(null);
          setCourseUsers([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchData, supabase.auth]);

  const currentCourseUser = courseUsers.find(
    (cu) => cu.course_id === currentCourseId
  ) ?? null;

  const isAdmin = profile?.role === "admin";
  const role: UserRole | null = profile?.role ?? null;

  return {
    user,
    profile,
    courseUsers,
    currentCourseUser,
    isAdmin,
    role,
    loading,
    error,
    setCurrentCourseId,
    refresh: fetchData,
  };
}
