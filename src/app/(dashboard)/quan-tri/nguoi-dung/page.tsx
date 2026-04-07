"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/use-user";
import type { Profile, UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

export default function UsersPage() {
  const { isAdmin, profile: currentProfile } = useUser();
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setActionLoading(userId);
    await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);
    await fetchUsers();
    setActionLoading(null);
  }

  async function handleDeleteUser(userId: string) {
    setActionLoading(userId);
    // Delete from course_users first
    await supabase.from("course_users").delete().eq("user_id", userId);
    // Delete profile
    await supabase.from("profiles").delete().eq("id", userId);
    // Note: auth.users deletion requires admin API, profile delete is sufficient
    // as the user won't be able to access anything without a profile
    setDeleteConfirm(null);
    await fetchUsers();
    setActionLoading(null);
  }

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--color-surface-400)]">Không có quyền truy cập.</p>
      </div>
    );
  }

  const allRoles: UserRole[] = ["admin", "dvt", "kvt", "ntd", "tuvanvien"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">Quản lý Người dùng</h1>
          <p className="text-[var(--color-surface-400)] mt-1">
            {users.length} người dùng trong hệ thống
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <input
          id="user-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-surface-800)]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">Họ tên</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">Mật khẩu</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">Vai trò</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">Ngày tạo</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-surface-800)]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton w-24 h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-surface-400)]">
                    Không tìm thấy người dùng
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSelf = u.id === currentProfile?.id;
                  const isDeleting = deleteConfirm === u.id;

                  return (
                    <tr key={u.id} className="border-b border-[var(--color-surface-800)] table-row-hover">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}
                          >
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-[var(--color-surface-200)] font-medium">
                            {u.full_name}
                            {isSelf && (
                              <span className="ml-2 text-xs text-[var(--color-primary-400)]">(bạn)</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-[var(--color-surface-400)]">{u.email}</td>

                      {/* Password */}
                      <td className="px-6 py-4">
                        {u.password_plain ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-[var(--color-surface-300)]">
                              {showPasswordFor === u.id ? u.password_plain : "••••••"}
                            </span>
                            <button
                              onClick={() => setShowPasswordFor(showPasswordFor === u.id ? null : u.id)}
                              className="text-[var(--color-surface-500)] hover:text-[var(--color-surface-300)] transition-colors"
                              title={showPasswordFor === u.id ? "Ẩn" : "Hiện"}
                            >
                              {showPasswordFor === u.id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-surface-500)] italic">Không có</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <select
                          value={u.role ?? "tuvanvien"}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          disabled={isSelf || actionLoading === u.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-200)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                          style={{ backgroundImage: "none" }}
                        >
                          {allRoles.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-[var(--color-surface-400)]">
                        {new Date(u.created_at).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {isSelf ? (
                          <span className="text-xs text-[var(--color-surface-600)]">—</span>
                        ) : isDeleting ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={actionLoading === u.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
                              style={{ background: "var(--color-danger)" }}
                            >
                              {actionLoading === u.id ? "..." : "Xác nhận"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-surface-400)] border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)]"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(u.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all hover:scale-105"
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
