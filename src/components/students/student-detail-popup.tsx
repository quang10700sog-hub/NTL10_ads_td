"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student } from "@/lib/types";

interface CareLogEntry {
  id: string;
  content: string;
  created_at: string;
  created_by_user: { full_name: string } | null;
}

interface StudentDetailPopupProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
}

export function StudentDetailPopup({ student, open, onClose }: StudentDetailPopupProps) {
  const supabase = createClient();
  const [careLogs, setCareLogs] = useState<CareLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [newLogContent, setNewLogContent] = useState("");
  const [addingLog, setAddingLog] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "logs">("info");

  useEffect(() => {
    if (open && student) {
      fetchCareLogs();
      setActiveTab("info");
    }
  }, [open, student?.id]);

  async function fetchCareLogs() {
    if (!student) return;
    setLoadingLogs(true);
    const { data } = await supabase
      .from("care_logs")
      .select("id, content, created_at, created_by_user:profiles!care_logs_created_by_fkey(full_name)")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setCareLogs((data as unknown as CareLogEntry[]) ?? []);
    setLoadingLogs(false);
  }

  async function handleAddLog() {
    if (!student || !newLogContent.trim()) return;
    setAddingLog(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("care_logs").insert({
      student_id: student.id,
      content: newLogContent.trim(),
      created_by: user?.id,
    });
    setNewLogContent("");
    setAddingLog(false);
    fetchCareLogs();
  }

  if (!open || !student) return null;

  const fixedFields = [
    { label: "Họ tên", value: student.full_name },
    { label: "Năm sinh", value: student.birth_year },
    { label: "Giới tính", value: student.gender },
    { label: "SĐT/Zalo", value: student.phone_zalo },
    { label: "Link Facebook", value: student.facebook_link, isLink: true },
    { label: "Nghề nghiệp", value: student.occupation },
    { label: "Nơi ở", value: student.residence },
  ];

  const statusFields = [
    { label: "Trạng thái học tập", value: student.learning_status },
    { label: "Trạng thái liên lạc", value: student.contact_status },
    { label: "Nội dung chăm sóc", value: student.care_content },
    { label: "Ghi chú tư vấn viên", value: student.advisor_note },
  ];

  const dynamicEntries = Object.entries(student.dynamic_data ?? {});

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-[var(--color-surface-900)] border-l border-[var(--color-surface-800)] z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-surface-900)]/95 backdrop-blur-lg border-b border-[var(--color-surface-800)] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-[var(--color-surface-100)]">Chi tiết Học viên</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)] hover:bg-[var(--color-surface-800)] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))" }}>
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--color-surface-50)]">{student.full_name}</h3>
              <p className="text-sm text-[var(--color-surface-400)]">
                {student.unit?.name ?? "Chưa gán ĐV"} {student.area ? `• ${student.area.name}` : ""}
              </p>
            </div>
          </div>

          {/* Assigned User + Linked Caretakers */}
          <div className="grid grid-cols-1 gap-3">
            {student.assigned_user?.profile && (
              <div className="p-4 rounded-xl" style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
                <p className="text-xs text-[var(--color-primary-400)] font-medium mb-1">Người chăm sóc chính</p>
                <p className="text-sm text-[var(--color-surface-200)] font-medium">{student.assigned_user.profile.full_name}</p>
              </div>
            )}
            {(student.linked_caretaker_user?.profile || student.linked_caretaker_user_2?.profile) && (
              <div className="p-4 rounded-xl" style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.15)" }}>
                <p className="text-xs text-emerald-400 font-medium mb-2">Người CS liên kết</p>
                <div className="space-y-1.5">
                  {student.linked_caretaker_user?.profile && (
                    <p className="text-sm text-[var(--color-surface-200)] font-medium">1. {student.linked_caretaker_user.profile.full_name}</p>
                  )}
                  {student.linked_caretaker_user_2?.profile && (
                    <p className="text-sm text-[var(--color-surface-200)] font-medium">2. {student.linked_caretaker_user_2.profile.full_name}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[var(--color-surface-800)]/50 rounded-xl p-1">
            {(["info", "logs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-[var(--color-surface-700)] text-[var(--color-surface-100)] shadow-sm"
                    : "text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)]"
                }`}
              >
                {tab === "info" ? "📋 Thông tin" : `📝 Nhật ký CS (${careLogs.length})`}
              </button>
            ))}
          </div>

          {/* Info Tab */}
          {activeTab === "info" && (
            <>
              {/* Fixed Fields */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-surface-300)] uppercase tracking-wider mb-3">Thông tin cơ bản</h4>
                <div className="space-y-3">
                  {fixedFields.map((f) => (
                    <div key={f.label} className="flex justify-between items-start py-2 border-b border-[var(--color-surface-800)]/50">
                      <span className="text-sm text-[var(--color-surface-400)]">{f.label}</span>
                      {f.isLink && f.value ? (
                        <a href={f.value} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-[var(--color-primary-400)] hover:underline truncate max-w-[200px]">
                          {f.value}
                        </a>
                      ) : (
                        <span className="text-sm text-[var(--color-surface-200)] text-right max-w-[200px]">
                          {f.value || "—"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Fields */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-surface-300)] uppercase tracking-wider mb-3">Trạng thái & Chăm sóc</h4>
                <div className="space-y-3">
                  {statusFields.map((f) => (
                    <div key={f.label} className="py-2 border-b border-[var(--color-surface-800)]/50">
                      <span className="text-xs text-[var(--color-surface-400)] block mb-1">{f.label}</span>
                      <span className="text-sm text-[var(--color-surface-200)]">{f.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Data */}
              {dynamicEntries.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-surface-300)] uppercase tracking-wider mb-3">Dữ liệu bổ sung</h4>
                  <div className="space-y-3">
                    {dynamicEntries.map(([key, value]) => (
                      <div key={key} className="py-2 border-b border-[var(--color-surface-800)]/50">
                        <span className="text-xs text-[var(--color-surface-400)] block mb-1">{key}</span>
                        <span className="text-sm text-[var(--color-surface-200)]">{String(value) || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="text-xs text-[var(--color-surface-500)] space-y-1 pt-2">
                <p>ID: {student.id}</p>
                <p>Tạo lúc: {new Date(student.created_at).toLocaleString("vi-VN")}</p>
                <p>Cập nhật: {new Date(student.updated_at).toLocaleString("vi-VN")}</p>
              </div>
            </>
          )}

          {/* Care Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              {/* Add new log */}
              <div className="space-y-2">
                <textarea
                  value={newLogContent}
                  onChange={(e) => setNewLogContent(e.target.value)}
                  placeholder="Nhập nội dung chăm sóc..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all resize-none"
                />
                <button
                  onClick={handleAddLog}
                  disabled={!newLogContent.trim() || addingLog}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
                >
                  {addingLog ? "Đang lưu..." : "💾 Thêm ghi chú"}
                </button>
              </div>

              {/* Log entries */}
              {loadingLogs ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-800)]/50">
                      <div className="skeleton w-24 h-3 mb-2" />
                      <div className="skeleton w-full h-4" />
                    </div>
                  ))}
                </div>
              ) : careLogs.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-surface-500)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <p className="text-sm">Chưa có nhật ký chăm sóc</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {careLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl bg-[var(--color-surface-800)]/50 border border-[var(--color-surface-800)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[var(--color-primary-400)]">
                          {log.created_by_user?.full_name ?? "Hệ thống"}
                        </span>
                        <span className="text-xs text-[var(--color-surface-500)]">
                          {new Date(log.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-surface-300)] whitespace-pre-wrap leading-relaxed">
                        {log.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
