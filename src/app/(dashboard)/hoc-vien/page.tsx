"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/use-user";
import { useStudents } from "@/lib/hooks/use-students";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { canImportExcel, canExportExcel } from "@/lib/utils/permissions";
import { exportStudentsToExcel } from "@/lib/utils/excel-export";
import { StudentTable } from "@/components/students/student-table";
import { StudentDetailPopup } from "@/components/students/student-detail-popup";
import { StudentAssignDialog } from "@/components/students/student-assign-dialog";
import { StudentTransferDialog } from "@/components/students/student-transfer-dialog";
import { ExcelImporter } from "@/components/students/excel-importer";
import type { Student, Course, Unit, Area } from "@/lib/types";

export default function StudentsPage() {
  const { profile, role, courseUsers, currentCourseUser, setCurrentCourseId } = useUser();
  const supabase = createClient();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterAreaId, setFilterAreaId] = useState("");
  const [search, setSearch] = useState("");
  const [showImporter, setShowImporter] = useState(false);

  // Detail & Assign & Linked dialogs
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [assignStudent, setAssignStudent] = useState<Student | null>(null);
  const [assignLinkedStudent, setAssignLinkedStudent] = useState<Student | null>(null);
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);
  const [transferMode, setTransferMode] = useState<"unit" | "area">("unit");

  // Fetch students
  const { students, loading, refresh, totalCount } = useStudents({
    courseId: selectedCourseId,
    unitId: filterUnitId || undefined,
    areaId: filterAreaId || undefined,
    search: search || undefined,
  });

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Realtime
  useRealtime({
    table: "students",
    filter: selectedCourseId ? `course_id=eq.${selectedCourseId}` : undefined,
    enabled: !!selectedCourseId,
    onChange: useCallback(() => {
      refresh();
      showToast("Dữ liệu đã được cập nhật");
    }, [refresh]),
  });

  // Fetch courses
  useEffect(() => {
    async function loadCourses() {
      const { data } = await supabase.from("courses").select("*").eq("status", "active").order("name");
      setCourses(data ?? []);
      if (data?.length && !selectedCourseId) {
        setSelectedCourseId(data[0].id);
        setCurrentCourseId(data[0].id);
      }
    }
    loadCourses();
  }, []);

  // Fetch units & areas when course changes
  useEffect(() => {
    if (!selectedCourseId) return;
    setCurrentCourseId(selectedCourseId);

    async function loadUnitsAreas() {
      const { data: unitsData } = await supabase.from("units").select("*").eq("course_id", selectedCourseId).order("name");
      setUnits(unitsData ?? []);
      if (unitsData?.length) {
        const unitIds = unitsData.map((u: Unit) => u.id);
        const { data: areasData } = await supabase.from("areas").select("*").in("unit_id", unitIds).order("name");
        setAreas(areasData ?? []);
      } else {
        setAreas([]);
      }
    }
    loadUnitsAreas();
    setFilterUnitId("");
    setFilterAreaId("");
  }, [selectedCourseId]);

  const handleUpdateField = async (studentId: string, field: string, value: string) => {
    await supabase.from("students").update({
      [field]: value || null,
      updated_at: new Date().toISOString(),
    }).eq("id", studentId);
    refresh();
  };

  const handleDelete = async (studentId: string) => {
    await supabase.from("students").delete().eq("id", studentId);
    refresh();
    showToast("Đã xóa học viên");
  };

  const handleExport = () => {
    const courseName = courses.find((c) => c.id === selectedCourseId)?.name ?? "Export";
    exportStudentsToExcel(students, courseName);
    showToast("Đã xuất file Excel");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">Quản lý Học viên</h1>
          <p className="text-[var(--color-surface-400)] mt-1">
            {totalCount > 0 ? `${totalCount} học viên` : "Chọn khóa học để xem danh sách"}
          </p>
        </div>
        <div className="flex gap-2">
          {canImportExcel(role) && (
            <button
              onClick={() => setShowImporter(!showImporter)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
            >
              📥 Nhập Excel
            </button>
          )}
          {canExportExcel(role) && students.length > 0 && (
            <button
              onClick={handleExport}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-surface-300)] border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)] transition-all"
            >
              📤 Xuất Excel
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Course Select */}
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-sm text-[var(--color-surface-100)] focus:outline-none focus:border-[var(--color-primary-500)]"
        >
          <option value="">-- Chọn khóa học --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Unit Filter */}
        <select
          value={filterUnitId}
          onChange={(e) => { setFilterUnitId(e.target.value); setFilterAreaId(""); }}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-sm text-[var(--color-surface-100)] focus:outline-none focus:border-[var(--color-primary-500)]"
        >
          <option value="">Tất cả ĐV</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Area Filter */}
        <select
          value={filterAreaId}
          onChange={(e) => setFilterAreaId(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-sm text-[var(--color-surface-100)] focus:outline-none focus:border-[var(--color-primary-500)]"
        >
          <option value="">Tất cả KV</option>
          {areas
            .filter((a) => !filterUnitId || a.unit_id === filterUnitId)
            .map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
        </select>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Tìm theo tên hoặc SĐT..."
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)]"
        />
      </div>

      {/* Excel Importer */}
      {showImporter && selectedCourseId && (
        <div className="glass rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-surface-100)]">Import Excel</h3>
            <button onClick={() => setShowImporter(false)} className="text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <ExcelImporter
            courseId={selectedCourseId}
            courseName={courses.find((c) => c.id === selectedCourseId)?.name ?? ""}
            onImported={(result) => {
              refresh();
              showToast(`Import: ${result.newRows} mới, ${result.updatedRows} cập nhật`);
            }}
          />
        </div>
      )}

      {/* Student Table */}
      {selectedCourseId ? (
        <StudentTable
          students={students}
          userRole={role}
          courseUser={currentCourseUser}
          onViewDetail={(s) => setDetailStudent(s)}
          onEdit={(s) => setDetailStudent(s)}
          onAssign={(s) => setAssignStudent(s)}
          onAssignLinked={(s) => setAssignLinkedStudent(s)}
          onTransferUnit={(s) => { setTransferStudent(s); setTransferMode("unit"); }}
          onTransferArea={(s) => { setTransferStudent(s); setTransferMode("area"); }}
          onDelete={handleDelete}
          onUpdateField={handleUpdateField}
          loading={loading}
        />
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-4 text-[var(--color-surface-600)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 12 3 12 0v-5" />
          </svg>
          <p className="text-[var(--color-surface-400)]">Vui lòng chọn khóa học để xem danh sách học viên</p>
        </div>
      )}

      {/* Detail Popup */}
      <StudentDetailPopup
        student={detailStudent}
        open={!!detailStudent}
        onClose={() => setDetailStudent(null)}
      />

      {/* Assign Dialog - Primary */}
      <StudentAssignDialog
        student={assignStudent}
        courseId={selectedCourseId}
        open={!!assignStudent}
        onClose={() => setAssignStudent(null)}
        onAssigned={() => {
          refresh();
          showToast("Đã phân bổ học viên");
        }}
        currentCourseUser={currentCourseUser}
        userRole={role}
        mode="primary"
      />

      {/* Assign Dialog - Linked Caretaker */}
      <StudentAssignDialog
        student={assignLinkedStudent}
        courseId={selectedCourseId}
        open={!!assignLinkedStudent}
        onClose={() => setAssignLinkedStudent(null)}
        onAssigned={() => {
          refresh();
          showToast("Đã gán người CS liên kết");
        }}
        currentCourseUser={currentCourseUser}
        userRole={role}
        mode="linked"
      />

      {/* Transfer Dialog */}
      <StudentTransferDialog
        student={transferStudent}
        courseId={selectedCourseId}
        open={!!transferStudent}
        onClose={() => setTransferStudent(null)}
        onTransferred={() => {
          refresh();
          showToast(transferMode === "unit" ? "Đã chuyển đơn vị" : "Đã chuyển khu vực");
        }}
        mode={transferMode}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="px-5 py-3 rounded-xl text-sm font-medium text-white shadow-[var(--shadow-elevated)]"
            style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
