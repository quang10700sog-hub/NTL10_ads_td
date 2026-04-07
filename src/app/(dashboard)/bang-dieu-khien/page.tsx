"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/use-user";

interface StatsData {
  totalStudents: number;
  totalCourses: number;
  totalUsers: number;
  pendingApprovals: number;
}

export default function DashboardPage() {
  const { profile, isAdmin } = useUser();
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    totalCourses: 0,
    totalUsers: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      try {
        const [studentsRes, coursesRes, usersRes, pendingRes] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }),
          supabase.from("courses").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
        ]);

        setStats({
          totalStudents: studentsRes.count ?? 0,
          totalCourses: coursesRes.count ?? 0,
          totalUsers: usersRes.count ?? 0,
          pendingApprovals: pendingRes.count ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Tổng học viên",
      value: stats.totalStudents,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
      bg: "rgba(99, 102, 241, 0.1)",
    },
    {
      title: "Khóa học",
      value: stats.totalCourses,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #22c55e, #4ade80)",
      bg: "rgba(34, 197, 94, 0.1)",
    },
    {
      title: "Người dùng",
      value: stats.totalUsers,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
      bg: "rgba(59, 130, 246, 0.1)",
    },
    ...(isAdmin
      ? [
          {
            title: "Chờ duyệt",
            value: stats.pendingApprovals,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            bg: "rgba(245, 158, 11, 0.1)",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">
          Xin chào, {profile?.full_name ?? ""}! 👋
        </h1>
        <p className="text-[var(--color-surface-400)] mt-1">
          Đây là tổng quan về hệ thống quản lý học viên.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="glass rounded-2xl p-5 interactive-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--color-surface-400)] mb-1">
                  {card.title}
                </p>
                {loading ? (
                  <div className="skeleton w-16 h-8 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-[var(--color-surface-50)]">
                    {card.value}
                  </p>
                )}
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ background: card.gradient }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[var(--color-surface-100)] mb-4">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isAdmin && (
            <a
              href="/quan-tri/nguoi-dung"
              className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-800)] hover:bg-[var(--color-surface-700)] border border-[var(--color-surface-700)] transition-all group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(245, 158, 11, 0.15)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#fbbf24]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-surface-200)] group-hover:text-[var(--color-surface-50)]">
                  Quản lý người dùng
                </p>
                <p className="text-xs text-[var(--color-surface-500)]">
                  Vai trò và tài khoản
                </p>
              </div>
            </a>
          )}
          <a
            href="/quan-tri/khoa-hoc"
            className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-800)] hover:bg-[var(--color-surface-700)] border border-[var(--color-surface-700)] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(34, 197, 94, 0.15)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#4ade80]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-surface-200)] group-hover:text-[var(--color-surface-50)]">
                Quản lý khóa học
              </p>
              <p className="text-xs text-[var(--color-surface-500)]">
                Tạo và quản lý khóa
              </p>
            </div>
          </a>
          <a
            href="/hoc-vien"
            className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-800)] hover:bg-[var(--color-surface-700)] border border-[var(--color-surface-700)] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(99, 102, 241, 0.15)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#a5b4fc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-surface-200)] group-hover:text-[var(--color-surface-50)]">
                Quản lý học viên
              </p>
              <p className="text-xs text-[var(--color-surface-500)]">
                Xem và chỉnh sửa
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
