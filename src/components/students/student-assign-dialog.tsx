"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, CourseUser, Profile, UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

type CourseUserWithProfile = CourseUser & { profile: Profile };

interface StudentAssignDialogProps {
  student: Student | null;
  courseId: string;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
  /** Current user's course_user record for role-based filtering */
  currentCourseUser?: CourseUser | null;
  /** Current user's global role */
  userRole?: UserRole | null;
  /** "primary" = assigned_to, "linked" = linked_caretaker_id + linked_caretaker_id_2 */
  mode?: "primary" | "linked";
  /** Current user's ID (to exclude self from linked caretaker list) */
  currentUserId?: string;
}

export function StudentAssignDialog({
  student,
  courseId,
  open,
  onClose,
  onAssigned,
  currentCourseUser,
  userRole,
  mode = "primary",
  currentUserId,
}: StudentAssignDialogProps) {
  const supabase = createClient();
  const [members, setMembers] = useState<CourseUserWithProfile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  // For linked mode: multi-select (max 2)
  const [selectedLinkedIds, setSelectedLinkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && courseId) {
      fetchMembers();
      setSelectedId("");
      setSearch("");
      // Pre-fill existing linked caretakers
      if (mode === "linked" && student) {
        const existing: string[] = [];
        if (student.linked_caretaker_id) existing.push(student.linked_caretaker_id);
        if (student.linked_caretaker_id_2) existing.push(student.linked_caretaker_id_2);
        setSelectedLinkedIds(existing);
      } else {
        setSelectedLinkedIds([]);
      }
    }
  }, [open, courseId, student, mode]);

  async function fetchMembers() {
    const { data } = await supabase
      .from("course_users")
      .select("*, profile:profiles(*)")
      .eq("course_id", courseId);

    let allMembers = (data as CourseUserWithProfile[]) ?? [];

    if (mode === "linked") {
      // Linked mode: show ALL members in course, regardless of role/unit/area
      // but exclude current user (can't assign yourself as linked caretaker)
      if (currentUserId) {
        allMembers = allMembers.filter(m => m.user_id !== currentUserId);
      }
    } else {
      // Primary mode: role-based filtering (ĐVT only sees members in their unit, etc.)
      if (userRole !== "admin" && currentCourseUser) {
        if (currentCourseUser.role_in_course === "dvt" && currentCourseUser.unit_id) {
          allMembers = allMembers.filter(m => m.unit_id === currentCourseUser.unit_id);
        } else if (currentCourseUser.role_in_course === "kvt" && currentCourseUser.area_id) {
          allMembers = allMembers.filter(m => m.area_id === currentCourseUser.area_id);
        }
      }
    }

    setMembers(allMembers);
  }

  function toggleLinked(id: string) {
    setSelectedLinkedIds(prev => {
      if (prev.includes(id)) {
        // Uncheck
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        // At limit: replace the first (oldest) selection with the new one
        return [prev[1], id];
      }
      return [...prev, id];
    });
  }

  async function handleAssign() {
    if (!student) return;
    setLoading(true);

    try {
      if (mode === "linked") {
        await supabase
          .from("students")
          .update({
            linked_caretaker_id: selectedLinkedIds[0] ?? null,
            linked_caretaker_id_2: selectedLinkedIds[1] ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", student.id);
      } else {
        if (!selectedId) { setLoading(false); return; }
        // Auto-sync unit/area from the selected caretaker
        const selectedMember = members.find(m => m.id === selectedId);
        await supabase
          .from("students")
          .update({
            assigned_to: selectedId,
            unit_id: selectedMember?.unit_id ?? null,
            area_id: selectedMember?.area_id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", student.id);
      }

      onAssigned();
      onClose();
    } catch (err) {
      console.error("Lỗi lưu phân bổ:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!open || !student) return null;

  const filtered = members.filter((m) =>
    m.profile?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.profile?.email.toLowerCase().includes(search.toLowerCase())
  );

  const isLinked = mode === "linked";
  const title = isLinked ? "Chọn người CS liên kết" : "Phân bổ Học viên";
  const subtitle = isLinked
    ? <>Chọn tối đa <span className="font-semibold text-[var(--color-primary-400)]">2 người</span> CS liên kết cho <span className="font-medium text-[var(--color-surface-200)]">{student.full_name}</span></>
    : <>Chọn người chăm sóc cho <span className="font-medium text-[var(--color-surface-200)]">{student.full_name}</span></>;

  const canSubmit = isLinked ? true : !!selectedId;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-surface-900)] border border-[var(--color-surface-700)] rounded-2xl shadow-[var(--shadow-elevated)] z-50 animate-fade-in">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-surface-100)] mb-1">
            {title}
          </h3>
          <p className="text-sm text-[var(--color-surface-400)] mb-4">
            {subtitle}
          </p>

          {/* Selected count badge for linked mode */}
          {isLinked && (
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                selectedLinkedIds.length >= 2
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  : "bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)] border border-[var(--color-primary-500)]/20"
              }`}>
                Đã chọn {selectedLinkedIds.length}/2
              </span>
              {selectedLinkedIds.length > 0 && (
                <button onClick={() => setSelectedLinkedIds([])}
                  className="text-xs text-[var(--color-surface-500)] hover:text-red-400 transition-colors">
                  Xóa tất cả
                </button>
              )}
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] mb-3"
          />

          {/* Member List */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.map((m) => {
              const isSelectedPrimary = selectedId === m.id;
              const isSelectedLinked = selectedLinkedIds.includes(m.id);
              const isSelected = isLinked ? isSelectedLinked : isSelectedPrimary;
              const isDisabled = false; // All rows always clickable — auto-swap when at limit

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (isLinked) {
                      toggleLinked(m.id);
                    } else {
                      setSelectedId(m.id);
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-[var(--color-primary-600)]/15 border border-[var(--color-primary-500)]/30"
                      : isDisabled
                        ? "opacity-40 cursor-not-allowed border border-transparent"
                        : "hover:bg-[var(--color-surface-800)] border border-transparent"
                  }`}
                >
                  {/* Checkbox for linked mode */}
                  {isLinked && (
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected
                        ? "bg-[var(--color-primary-500)] border-[var(--color-primary-500)]"
                        : "border-[var(--color-surface-600)]"
                    }`}>
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  )}

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
                    {m.profile?.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-surface-200)] truncate">{m.profile?.full_name}</p>
                    <p className="text-xs text-[var(--color-surface-500)]">{ROLE_LABELS[m.role_in_course]}</p>
                  </div>
                  {!isLinked && isSelected && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[var(--color-primary-400)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-[var(--color-surface-500)] text-center py-4">Không tìm thấy thành viên</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAssign}
              disabled={!canSubmit || loading}
              className="flex-1 py-2.5 rounded-xl font-medium text-white text-sm transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
            >
              {loading ? "Đang lưu..." : "Xác nhận"}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-surface-400)] text-sm border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)]">
              Hủy
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
