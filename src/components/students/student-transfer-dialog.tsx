"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, Unit, Area, CourseUser, Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

type CourseUserWithProfile = CourseUser & { profile: Profile };

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

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Unit/Area selection
  const [units, setUnits] = useState<Unit[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  // Step 2: Caretaker selection
  const [caretakers, setCaretakers] = useState<CourseUserWithProfile[]>([]);
  const [selectedCaretakerId, setSelectedCaretakerId] = useState("");
  const [caretakerSearch, setCaretakerSearch] = useState("");
  const [keepLinkedCaretakers, setKeepLinkedCaretakers] = useState(true);

  const [loading, setLoading] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && courseId) {
      setStep(1);
      setSelectedUnitId("");
      setSelectedAreaId("");
      setSelectedCaretakerId("");
      setCaretakerSearch("");
      setKeepLinkedCaretakers(true);
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

      // Load all areas for this course
      if (data?.length) {
        const unitIds = data.map((u: Unit) => u.id);
        const { data: areasData } = await supabase
          .from("areas")
          .select("*")
          .in("unit_id", unitIds)
          .order("name");
        setAreas(areasData ?? []);
      }
    } else {
      // Area mode: only areas within the student's current unit
      if (!student?.unit_id) return;
      const { data } = await supabase
        .from("areas")
        .select("*")
        .eq("unit_id", student.unit_id)
        .order("name");
      setAreas(data ?? []);
    }
  }

  // Load caretakers for the selected unit/area when moving to step 2
  async function loadCaretakers() {
    let query = supabase
      .from("course_users")
      .select("*, profile:profiles(*)")
      .eq("course_id", courseId);

    if (mode === "unit" && selectedUnitId) {
      query = query.eq("unit_id", selectedUnitId);
      if (selectedAreaId) {
        query = query.eq("area_id", selectedAreaId);
      }
    } else if (mode === "area" && selectedAreaId) {
      query = query.eq("area_id", selectedAreaId);
    }

    const { data } = await query;
    setCaretakers((data as CourseUserWithProfile[]) ?? []);
  }

  function handleNextStep() {
    if (mode === "unit" && !selectedUnitId) return;
    if (mode === "area" && !selectedAreaId) return;
    loadCaretakers();
    setStep(2);
  }

  async function handleTransfer() {
    if (!student) return;
    setLoading(true);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (mode === "unit") {
      updateData.unit_id = selectedUnitId;
      updateData.area_id = selectedAreaId || null;
    } else {
      updateData.area_id = selectedAreaId;
    }

    // Set new caretaker (or null if not selected)
    updateData.assigned_to = selectedCaretakerId || null;

    // Handle linked caretakers
    if (!keepLinkedCaretakers) {
      updateData.linked_caretaker_id = null;
      updateData.linked_caretaker_id_2 = null;
    }

    await supabase
      .from("students")
      .update(updateData)
      .eq("id", student.id);

    setLoading(false);
    onTransferred();
    onClose();
  }

  if (!open || !student) return null;

  const filteredCaretakers = caretakers.filter((m) =>
    m.profile?.full_name?.toLowerCase().includes(caretakerSearch.toLowerCase()) ||
    m.profile?.email?.toLowerCase().includes(caretakerSearch.toLowerCase())
  );

  const areasForSelectedUnit = mode === "unit"
    ? areas.filter((a) => a.unit_id === selectedUnitId)
    : areas;

  const currentUnitId = student.unit_id;
  const currentAreaId = student.area_id;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-surface-900)] border border-[var(--color-surface-700)] rounded-2xl shadow-[var(--shadow-elevated)] z-50 animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-[var(--color-surface-100)]">
              {mode === "unit" ? "Chuyển Địa vực" : "Chuyển Khu vực"}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-surface-600)]"}`} />
              <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-surface-600)]"}`} />
            </div>
          </div>
          <p className="text-sm text-[var(--color-surface-400)] mb-4">
            {step === 1
              ? <>Chọn {mode === "unit" ? "địa vực" : "khu vực"} đích cho <span className="font-medium text-[var(--color-surface-200)]">{student.full_name}</span></>
              : <>Chọn người chăm sóc mới cho <span className="font-medium text-[var(--color-surface-200)]">{student.full_name}</span></>
            }
          </p>

          {/* ========== STEP 1: Choose Unit / Area ========== */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Current info */}
              <div className="p-3 rounded-xl bg-[var(--color-surface-800)]/50">
                <p className="text-xs text-[var(--color-surface-500)] mb-1">
                  {mode === "unit" ? "Địa vực" : "Khu vực"} hiện tại
                </p>
                <p className="text-sm font-medium text-[var(--color-surface-300)]">
                  {mode === "unit"
                    ? student.unit?.name ?? "Chưa gán"
                    : student.area?.name ?? "Chưa gán"}
                </p>
              </div>

              {/* Unit selection (for unit mode) */}
              {mode === "unit" && (
                <div>
                  <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-2">
                    Chọn địa vực đích
                  </label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {units
                      .filter((u) => u.id !== currentUnitId)
                      .map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setSelectedUnitId(u.id); setSelectedAreaId(""); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-sm transition-all ${
                            selectedUnitId === u.id
                              ? "bg-[var(--color-primary-600)]/15 border border-[var(--color-primary-500)]/30 text-[var(--color-surface-100)]"
                              : "hover:bg-[var(--color-surface-800)] border border-transparent text-[var(--color-surface-300)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              selectedUnitId === u.id ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-surface-600)]"
                            }`} />
                            <span className="font-medium">{u.name}</span>
                            {u.code && <span className="text-xs text-[var(--color-surface-500)]">({u.code})</span>}
                          </div>
                          {selectedUnitId === u.id && (
                            <svg className="w-4 h-4 text-[var(--color-primary-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Area selection */}
              {((mode === "unit" && selectedUnitId && areasForSelectedUnit.length > 0) || mode === "area") && (
                <div>
                  <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-2">
                    {mode === "unit" ? "Chọn khu vực (tùy chọn)" : "Chọn khu vực đích"}
                  </label>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {(mode === "unit" ? areasForSelectedUnit : areas.filter(a => a.id !== currentAreaId)).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAreaId(selectedAreaId === a.id ? "" : a.id)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-sm transition-all ${
                          selectedAreaId === a.id
                            ? "bg-[var(--color-primary-600)]/15 border border-[var(--color-primary-500)]/30 text-[var(--color-surface-100)]"
                            : "hover:bg-[var(--color-surface-800)] border border-transparent text-[var(--color-surface-300)]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedAreaId === a.id ? "bg-[var(--color-primary-400)]" : "bg-[var(--color-surface-600)]"
                          }`} />
                          <span>{a.name}</span>
                          {a.code && <span className="text-xs text-[var(--color-surface-500)]">({a.code})</span>}
                        </div>
                        {selectedAreaId === a.id && (
                          <svg className="w-4 h-4 text-[var(--color-primary-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Next button */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleNextStep}
                  disabled={mode === "unit" ? !selectedUnitId : !selectedAreaId}
                  className="flex-1 py-2.5 rounded-xl font-medium text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
                >
                  Tiếp tục
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-surface-400)] text-sm border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)]">
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP 2: Choose Caretaker ========== */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Summary of step 1 */}
              <div className="p-3 rounded-xl bg-[var(--color-surface-800)]/50 flex items-center gap-2 text-xs">
                <svg className="w-4 h-4 text-[var(--color-primary-400)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[var(--color-surface-400)]">
                  Chuyển sang: <span className="text-[var(--color-surface-200)] font-medium">
                    {units.find(u => u.id === selectedUnitId)?.name ?? areas.find(a => a.id === selectedAreaId)?.name}
                  </span>
                  {selectedAreaId && mode === "unit" && (
                    <> → <span className="text-[var(--color-surface-200)] font-medium">
                      {areas.find(a => a.id === selectedAreaId)?.name}
                    </span></>
                  )}
                </span>
              </div>

              {/* Search */}
              <input
                type="text"
                value={caretakerSearch}
                onChange={(e) => setCaretakerSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)]"
              />

              {/* Caretaker list */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredCaretakers.map((m) => {
                  const isSelected = selectedCaretakerId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedCaretakerId(isSelected ? "" : m.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-[var(--color-primary-600)]/15 border border-[var(--color-primary-500)]/30"
                          : "hover:bg-[var(--color-surface-800)] border border-transparent"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
                        {m.profile?.full_name?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-surface-200)] truncate">{m.profile?.full_name}</p>
                        <p className="text-xs text-[var(--color-surface-500)]">{ROLE_LABELS[m.role_in_course]}</p>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-[var(--color-primary-400)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
                {filteredCaretakers.length === 0 && (
                  <p className="text-sm text-[var(--color-surface-500)] text-center py-4">
                    Không có thành viên nào tại {mode === "unit" ? "địa vực" : "khu vực"} đích
                  </p>
                )}
              </div>

              {/* Keep linked caretakers option */}
              {(student.linked_caretaker_id || student.linked_caretaker_id_2) && (
                <label className="flex items-center gap-2 px-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepLinkedCaretakers}
                    onChange={(e) => setKeepLinkedCaretakers(e.target.checked)}
                    className="rounded border-[var(--color-surface-600)] accent-[var(--color-primary-500)]"
                  />
                  <span className="text-xs text-[var(--color-surface-400)]">
                    Giữ nguyên NCS liên kết hiện tại
                  </span>
                </label>
              )}

              {/* Warning */}
              <div className="p-2.5 rounded-lg text-xs"
                style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
                💡 Toàn bộ thông tin sẵn có (nội dung CS, trạng thái, ghi chú...) sẽ được giữ nguyên
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setStep(1); setSelectedCaretakerId(""); setCaretakerSearch(""); }}
                  className="px-4 py-2.5 rounded-xl font-medium text-[var(--color-surface-400)] text-sm border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)] flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Quay lại
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl font-medium text-white text-sm transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
                >
                  {loading ? "Đang chuyển..." : "Xác nhận chuyển"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
