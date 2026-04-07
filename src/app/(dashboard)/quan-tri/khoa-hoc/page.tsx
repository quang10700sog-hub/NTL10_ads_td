"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/use-user";
import type { Course } from "@/lib/types";
import { COURSE_STATUS_LABELS } from "@/lib/types";
import Link from "next/link";

export default function CoursesPage() {
  const { isAdmin } = useUser();
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses(data ?? []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("courses").insert({
      name: formData.name,
      description: formData.description || null,
      created_by: user?.id,
    });

    if (error) {
      setFormError(error.message.includes("duplicate") ? "Tên khóa học đã tồn tại" : error.message);
    } else {
      setShowForm(false);
      setFormData({ name: "", description: "" });
      fetchCourses();
    }
    setFormLoading(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">Quản lý Khóa học</h1>
          <p className="text-[var(--color-surface-400)] mt-1">Tạo và quản lý các khóa học</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl font-medium text-white text-sm transition-all hover:shadow-[var(--shadow-glow)] hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
          >
            + Tạo khóa học
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-[var(--color-surface-100)] mb-4">Tạo khóa học mới</h3>
          {formError && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
              {formError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">Tên khóa học *</label>
              <input
                id="course-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="VD: Khóa 1 - 2025"
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">Mô tả</label>
              <textarea
                id="course-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về khóa học..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
              >
                {formLoading ? "Đang tạo..." : "Tạo khóa học"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-surface-400)] text-sm border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)] transition-all"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="skeleton w-3/4 h-6 mb-3" />
              <div className="skeleton w-full h-4 mb-2" />
              <div className="skeleton w-1/2 h-4" />
            </div>
          ))
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[var(--color-surface-400)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <p>Chưa có khóa học nào</p>
            {isAdmin && <p className="text-sm mt-1">Nhấn &ldquo;Tạo khóa học&rdquo; để bắt đầu</p>}
          </div>
        ) : (
          courses.map((course) => (
            <Link
              key={course.id}
              href={`/quan-tri/khoa-hoc/${course.id}`}
              className="glass rounded-2xl p-6 interactive-card block"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-[var(--color-surface-100)]">
                  {course.name}
                </h3>
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                  course.status === "active" ? "badge-success" :
                  course.status === "draft" ? "badge-warning" : "badge-info"
                }`}>
                  {COURSE_STATUS_LABELS[course.status]}
                </span>
              </div>
              {course.description && (
                <p className="text-sm text-[var(--color-surface-400)] line-clamp-2 mb-3">
                  {course.description}
                </p>
              )}
              <p className="text-xs text-[var(--color-surface-500)]">
                Tạo ngày {new Date(course.created_at).toLocaleDateString("vi-VN")}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
