"use client";

import { useState } from "react";
import type { Student, CourseUser, UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { getStudentPermissions } from "@/lib/utils/permissions";

interface StudentTableProps {
  students: Student[];
  userRole: UserRole | null;
  courseUser: CourseUser | null;
  advisorStudentIds?: string[];
  ntdIdsInMyArea?: string[];
  onViewDetail: (student: Student) => void;
  onEdit: (student: Student) => void;
  onAssign: (student: Student) => void;
  onAssignLinked?: (student: Student) => void;
  onTransferUnit?: (student: Student) => void;
  onTransferArea?: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onUpdateField: (studentId: string, field: string, value: string) => void;
  loading?: boolean;
}

export function StudentTable({
  students,
  userRole,
  courseUser,
  advisorStudentIds,
  ntdIdsInMyArea,
  onViewDetail,
  onEdit,
  onAssign,
  onAssignLinked,
  onTransferUnit,
  onTransferArea,
  onDelete,
  onUpdateField,
  loading,
}: StudentTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const startEdit = (studentId: string, field: string, currentValue: string) => {
    setEditingCell({ id: studentId, field });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingCell) {
      onUpdateField(editingCell.id, editingCell.field, editValue);
      setHighlightedId(editingCell.id);
      setTimeout(() => setHighlightedId(null), 2000);
      setEditingCell(null);
    }
  };

  const cancelEdit = () => setEditingCell(null);

  if (loading) {
    return (
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-surface-800)]">
              {["", "STT", "Họ tên", "SĐT/Zalo", "Người chăm sóc", "NCS Liên kết", "TT Học tập", "TT Liên lạc", "Nội dung CS", "Thao tác"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--color-surface-800)]">
                {Array.from({ length: 10 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="skeleton w-20 h-4" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-4 text-[var(--color-surface-600)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
        <p className="text-[var(--color-surface-400)]">Chưa có học viên nào</p>
      </div>
    );
  }

  return (
    <>
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--color-surface-800)]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === students.length && students.length > 0}
                  onChange={toggleAll}
                  className="rounded border-[var(--color-surface-600)] accent-[var(--color-primary-500)]"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase w-12">STT</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase min-w-[140px]">Họ tên</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">SĐT/Zalo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">Người chăm sóc</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">NCS Liên kết</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase min-w-[120px]">TT Học tập</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase min-w-[120px]">TT Liên lạc</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase min-w-[160px]">Nội dung CS</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase">Ghi chú TVV</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-surface-400)] uppercase w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const perms = getStudentPermissions(userRole, courseUser, student, advisorStudentIds, ntdIdsInMyArea);
              const isHighlighted = highlightedId === student.id;

              return (
                <tr
                  key={student.id}
                  className={`border-b border-[var(--color-surface-800)] table-row-hover transition-all ${
                    isHighlighted ? "animate-pulse-highlight" : ""
                  } ${selectedIds.has(student.id) ? "bg-[var(--color-primary-600)]/5" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="rounded border-[var(--color-surface-600)] accent-[var(--color-primary-500)]"
                    />
                  </td>

                  {/* STT */}
                  <td className="px-4 py-3 text-sm text-[var(--color-surface-400)]">
                    {student.stt_order ?? index + 1}
                  </td>

                  {/* Họ tên - clickable */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onViewDetail(student)}
                      className="text-sm font-medium text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] hover:underline transition-colors text-left"
                    >
                      {student.full_name}
                    </button>
                  </td>

                  {/* SĐT */}
                  <td className="px-4 py-3 text-sm text-[var(--color-surface-300)]">
                    {student.phone_zalo}
                  </td>

                  {/* Người chăm sóc */}
                  <td className="px-4 py-3">
                    {student.assigned_user?.profile ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium text-white"
                          style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
                          {student.assigned_user.profile.full_name.charAt(0)}
                        </div>
                        <span className="text-sm text-[var(--color-surface-300)]">
                          {student.assigned_user.profile.full_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--color-surface-500)] italic">Chưa gán</span>
                    )}
                  </td>

                  {/* NCS Liên kết (tối đa 2) */}
                  <td className="px-4 py-3">
                    {(() => {
                      const lc1 = student.linked_caretaker_user?.profile;
                      const lc2 = student.linked_caretaker_user_2?.profile;
                      const hasAny = lc1 || lc2;

                      if (!hasAny && perms.canDistribute && onAssignLinked) {
                        return (
                          <button
                            onClick={() => onAssignLinked(student)}
                            className="text-xs text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] hover:underline transition-colors"
                          >
                            + Chọn
                          </button>
                        );
                      }
                      if (!hasAny) return <span className="text-sm text-[var(--color-surface-500)]">—</span>;

                      return (
                        <div className="flex items-center gap-1.5">
                          {/* Avatars stacked */}
                          <div className="flex -space-x-1.5">
                            {lc1 && (
                              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium text-white border border-[var(--color-surface-900)]"
                                style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                                title={lc1.full_name}>
                                {lc1.full_name.charAt(0)}
                              </div>
                            )}
                            {lc2 && (
                              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium text-white border border-[var(--color-surface-900)]"
                                style={{ background: "linear-gradient(135deg, #0891b2, #06b6d4)" }}
                                title={lc2.full_name}>
                                {lc2.full_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          {/* Names */}
                          <div className="min-w-0">
                            {lc1 && <p className="text-xs text-[var(--color-surface-300)] truncate leading-tight">{lc1.full_name}</p>}
                            {lc2 && <p className="text-xs text-[var(--color-surface-400)] truncate leading-tight">{lc2.full_name}</p>}
                          </div>
                          {/* Edit button */}
                          {perms.canDistribute && onAssignLinked && (
                            <button onClick={() => onAssignLinked(student)}
                              className="ml-auto p-1 rounded text-[var(--color-surface-500)] hover:text-[var(--color-primary-400)] transition-colors flex-shrink-0"
                              title="Sửa NCS liên kết">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* TT Học tập - editable */}
                  <td className="px-4 py-3">
                    {editingCell?.id === student.id && editingCell.field === "learning_status" ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        className="w-full px-2 py-1 rounded-md bg-[var(--color-surface-800)] border border-[var(--color-primary-500)] text-sm text-[var(--color-surface-100)] focus:outline-none"
                      />
                    ) : (
                      <span
                        onClick={() => perms.canEdit && startEdit(student.id, "learning_status", student.learning_status ?? "")}
                        className={`text-sm ${perms.canEdit ? "cursor-pointer hover:text-[var(--color-primary-400)]" : ""} text-[var(--color-surface-300)]`}
                      >
                        {student.learning_status || "—"}
                      </span>
                    )}
                  </td>

                  {/* TT Liên lạc - editable */}
                  <td className="px-4 py-3">
                    {editingCell?.id === student.id && editingCell.field === "contact_status" ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        className="w-full px-2 py-1 rounded-md bg-[var(--color-surface-800)] border border-[var(--color-primary-500)] text-sm text-[var(--color-surface-100)] focus:outline-none"
                      />
                    ) : (
                      <span
                        onClick={() => perms.canEdit && startEdit(student.id, "contact_status", student.contact_status ?? "")}
                        className={`text-sm ${perms.canEdit ? "cursor-pointer hover:text-[var(--color-primary-400)]" : ""} text-[var(--color-surface-300)]`}
                      >
                        {student.contact_status || "—"}
                      </span>
                    )}
                  </td>

                  {/* Nội dung CS - editable */}
                  <td className="px-4 py-3">
                    {editingCell?.id === student.id && editingCell.field === "care_content" ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        className="w-full px-2 py-1 rounded-md bg-[var(--color-surface-800)] border border-[var(--color-primary-500)] text-sm text-[var(--color-surface-100)] focus:outline-none"
                      />
                    ) : (
                      <span
                        onClick={() => perms.canEdit && startEdit(student.id, "care_content", student.care_content ?? "")}
                        className={`text-sm ${perms.canEdit ? "cursor-pointer hover:text-[var(--color-primary-400)]" : ""} text-[var(--color-surface-300)] line-clamp-1`}
                      >
                        {student.care_content || "—"}
                      </span>
                    )}
                  </td>

                  {/* Ghi chú TVV */}
                  <td className="px-4 py-3">
                    {editingCell?.id === student.id && editingCell.field === "advisor_note" ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        className="w-full px-2 py-1 rounded-md bg-[var(--color-surface-800)] border border-[var(--color-primary-500)] text-sm text-[var(--color-surface-100)] focus:outline-none"
                      />
                    ) : (
                      <span
                        onClick={() => perms.canEditAdvisorNote && startEdit(student.id, "advisor_note", student.advisor_note ?? "")}
                        className={`text-sm ${perms.canEditAdvisorNote ? "cursor-pointer hover:text-[var(--color-primary-400)]" : ""} text-[var(--color-surface-300)] line-clamp-1`}
                      >
                        {student.advisor_note || "—"}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View */}
                      <button
                        onClick={() => onViewDetail(student)}
                        title="Xem chi tiết"
                        className="p-1.5 rounded-lg text-[var(--color-surface-400)] hover:text-[var(--color-primary-400)] hover:bg-[var(--color-surface-800)] transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Assign */}
                      {perms.canDistribute && (
                        <button
                          onClick={() => onAssign(student)}
                          title="Phân bổ"
                          className="p-1.5 rounded-lg text-[var(--color-surface-400)] hover:text-[var(--color-info)] hover:bg-[var(--color-surface-800)] transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                          </svg>
                        </button>
                      )}

                      {/* Transfer */}
                      {perms.canDistribute && onTransferUnit && (
                        <button
                          onClick={() => onTransferUnit(student)}
                          title="Chuyển ĐV"
                          className="p-1.5 rounded-lg text-[var(--color-surface-400)] hover:text-amber-400 hover:bg-[var(--color-surface-800)] transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9" /><path d="M21 3l-7 7" /><polyline points="9 21 3 21 3 15" /><path d="M3 21l7-7" />
                          </svg>
                        </button>
                      )}

                      {/* Delete */}
                      {perms.canDelete && (
                        <button
                          onClick={() => setConfirmDelete({ id: student.id, name: student.full_name })}
                          title="Xóa"
                          className="p-1.5 rounded-lg text-[var(--color-surface-400)] hover:text-red-400 hover:bg-[var(--color-surface-800)] transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Confirm Delete Dialog */}
    {confirmDelete && (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setConfirmDelete(null)} />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[var(--color-surface-900)] border border-[var(--color-surface-700)] rounded-2xl shadow-[var(--shadow-elevated)] z-50 animate-fade-in p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.12)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-surface-100)]">Xóa học viên</h3>
              <p className="text-sm text-[var(--color-surface-400)]">
                Bạn có chắc muốn xóa <span className="font-medium text-[var(--color-surface-200)]">&quot;{confirmDelete.name}&quot;</span>?
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}
              className="flex-1 py-2.5 rounded-xl font-medium text-white text-sm transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}
            >
              Xóa
            </button>
            <button onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-surface-400)] text-sm border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)]">
              Hủy
            </button>
          </div>
        </div>
      </>
    )}
  </>
  );
}
