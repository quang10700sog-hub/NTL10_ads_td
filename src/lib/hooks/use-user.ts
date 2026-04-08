"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

// Minimum ms between full data fetches to prevent tab-switch storm
const FETCH_COOLDOWN_MS = 5000;

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courseUsers, setCourseUsers] = useState<CourseUser[]>([]);
  const [currentCourseId, setCurrentCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const lastFetchRef = useRef<number>(0);
  const hasFetchedRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    // Cooldown: skip if already fetched recently (unless forced)
    const now = Date.now();
    if (!force && hasFetchedRef.current && now - lastFetchRef.current < FETCH_COOLDOWN_MS) {
      return;
    }

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

      lastFetchRef.current = Date.now();
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Initial fetch
    fetchData(true);

    // Auth state changes — only re-fetch on actual sign-in/sign-out, not token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          if (session?.user) {
            fetchData(true);
          } else {
            setUser(null);
            setProfile(null);
            setCourseUsers([]);
          }
        }
        // TOKEN_REFRESHED, INITIAL_SESSION etc. → skip refetch to avoid reload storms
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
    refresh: () => fetchData(true),
  };
}
