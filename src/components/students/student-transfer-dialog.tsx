"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, Unit, Area } from "@/lib/types";

interface StudentTransferDialogProps {
  student: Student | null;
  courseId: string;
  open: boolean;
  onClose: () => void;
  onTransferred: () => void;
  mode: "unit" | "area";
}

export function StudentTransferDialog({
  student,
  courseId,
  open,
  onClose,
  onTransferred,
  mode,
}: StudentTransferDialogProps) {
  const supabase = createClient();
  const [units, setUnits] = useState<Unit[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      fetchOptions();
    }
  }, [open, courseId, mode]);

  async function fetchOptions() {
    if (mode === "unit") {
      const { data } = await supabase
        .from("units")
        .select("*")
        .eq("course_id", courseId)
        .order("name");
      setUnits(data ?? []);
    } else {
      // Fetch areas in the student's current unit
      if (!student?.unit_id) return;
      const { data } = await supabase
        .from("areas")
        .select("*")
        .eq("unit_id", student.unit_id)
        .order("name");
      setAreas(data ?? []);
    }
  }

  async function handleTransfer() {
    if (!student || !selectedId) return;
    setLoading(true);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (mode === "unit") {
      updateData.unit_id = selectedId;
      updateData.area_id = null; // Reset area when changing unit
      updateData.assigned_to = null; // Reset assignment
    } else {
      updateData.area_id = selectedId;
    }

    await supabase
      .from("students")
      .update(updateData)
      .eq("id", student.id);

    setLoading(false);
    setSelectedId("");
    onTransferred();
    onClose();
  }

  if (!open || !student) return null;

  const options = mode === "unit" ? units : areas;
  const currentId = mode === "unit" ? student.unit_id : student.area_id;
  const title = mode === "unit" ? "Chuyển Đơn vị" : "Chuyển Khu vực";
  const entityName = mode === "unit" ? "đơn vị" : "khu vực";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-surface-900)] border border-[var(--color-surface-700)] rounded-2xl shadow-[var(--shadow-elevated)] z-50 animate-fade-in">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-surface-100)] mb-1">
            {title}
          </h3>
          <p className="text-sm text-[var(--color-surface-400)] mb-4">
            Chuyển <span className="font-medium text-[var(--color-surface-200)]">{student.full_name}</span> sang {entityName} khác
          </p>

          {/* Current Info */}
          <div className="p-3 rounded-xl bg-[var(--color-surface-800)]/50 mb-4">
            <p className="text-xs text-[var(--color-surface-500)] mb-1">{entityName} hiện tại</p>
            <p className="text-sm font-medium text-[var(--color-surface-300)]">
              {mode === "unit"
                ? student.unit?.name ?? "Chưa gán"
                : student.area?.name ?? "Chưa gán"}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {options
              .filter((opt) => opt.id !== currentId)
              .map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedId(opt.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm transition-all ${
                    selectedId === opt.id
                      ? "bg-[var(--color-primary-600)]/15 border border-[var(--color-primary-500)]/30 text-[var(--color-surface-100)]"
                      : "hover:bg-[var(--color-surface-800)] border border-transparent text-[var(--color-surface-300)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedId === opt.id
                        ? "bg-[var(--color-primary-500)]"
                        : "bg-[var(--color-surface-600)]"
                    }`} />
                    <span className="font-medium">{opt.name}</span>
                    {opt.code && (
                      <span className="text-xs text-[var(--color-surface-500)]">({opt.code})</span>
                    )}
                  </div>
                  {selectedId === opt.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[var(--color-primary-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            {options.filter((opt) => opt.id !== currentId).length === 0 && (
              <p className="text-sm text-[var(--color-surface-500)] text-center py-6">
                Không có {entityName} khác để chuyển
              </p>
            )}
          </div>

          {/* Warning for unit transfer */}
          {mode === "unit" && selectedId && (
            <div className="mt-3 p-3 rounded-lg text-xs"
              style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#fbbf24" }}>
              ⚠️ Khi chuyển đơn vị, khu vực và người chăm sóc sẽ bị xóa. Cần phân bổ lại sau khi chuyển.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleTransfer}
              disabled={!selectedId || loading}
              className="flex-1 py-2.5 rounded-xl font-medium text-white text-sm transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
            >
              {loading ? "Đang chuyển..." : "Xác nhận chuyển"}
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
