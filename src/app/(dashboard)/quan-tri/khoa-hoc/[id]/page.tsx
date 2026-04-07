"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/use-user";
import { useToast } from "@/components/ui/toast";
import type { Course, Unit, Area, CourseUser, Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

type CourseUserWithProfile = CourseUser & { profile: Profile; unit: Unit | null; area: Area | null };

// ─── Icons ───────────────────────────────────────────────────────
const IconEdit = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconPlus = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconBuilding = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ─── Confirm Dialog ─────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center confirm-overlay" onClick={onCancel}>
      <div className="glass rounded-2xl p-6 w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}
        style={{ border: "1px solid var(--color-surface-600)" }}>
        <h3 className="text-lg font-semibold text-[var(--color-surface-100)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--color-surface-400)] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-surface-400)] border border-[var(--color-surface-600)] hover:bg-[var(--color-surface-800)] transition-colors">
            Hủy
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: "rgba(239,68,68,0.8)" }}>
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Editable Text ───────────────────────────────────────
function InlineEdit({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => {
    if (text.trim() && text !== value) onSave(text.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="inline-edit-input" style={{ minWidth: 120 }} />
        <button onClick={save} className="p-1 rounded text-green-400 hover:bg-green-400/10 transition-colors"><IconCheck /></button>
        <button onClick={() => { setText(value); setEditing(false); }} className="p-1 rounded text-[var(--color-surface-400)] hover:bg-[var(--color-surface-700)] transition-colors"><IconX /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditing(true)}>
      <span>{value}</span>
      <span className="opacity-0 group-hover:opacity-60 transition-opacity text-[var(--color-surface-400)]"><IconEdit /></span>
    </div>
  );
}

// ─── Searchable User Dropdown ───────────────────────────────────
function UserSelect({ profiles, value, onChange, placeholder }: {
  profiles: Profile[]; value: string; onChange: (id: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = profiles.find(p => p.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = profiles.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--color-surface-800)] border border-[var(--color-surface-600)] text-sm text-left transition-colors hover:border-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)]">
        {selected ? (
          <span className="text-[var(--color-surface-100)] truncate">
            {selected.full_name} <span className="text-[var(--color-surface-500)]">({selected.email})</span>
          </span>
        ) : (
          <span className="text-[var(--color-surface-500)]">{placeholder || "Chọn tài khoản..."}</span>
        )}
        <svg className={`w-4 h-4 text-[var(--color-surface-400)] flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full z-[70] dropdown-menu animate-slide-in-down"
          style={{ maxHeight: "280px", display: "flex", flexDirection: "column" }}>
          <div className="p-2 border-b border-[var(--color-surface-700)] flex-shrink-0">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--color-surface-900)] border border-[var(--color-surface-700)]">
              <IconSearch />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="flex-1 bg-transparent text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] outline-none" autoFocus />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--color-surface-500)]">Không tìm thấy tài khoản</div>
            ) : (
              filtered.map(p => (
                <div key={p.id} className={`dropdown-item flex items-center gap-3 ${value === p.id ? "bg-[var(--color-primary-500)]/10" : ""}`}
                  onClick={() => { onChange(p.id); setOpen(false); setSearch(""); }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-surface-200)] truncate">{p.full_name}</p>
                    <p className="text-xs text-[var(--color-surface-500)] truncate">{p.email}</p>
                  </div>
                  {value === p.id && <span className="ml-auto text-[var(--color-primary-400)]"><IconCheck /></span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { isAdmin } = useUser();
  const supabase = createClient();
  const toast = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [members, setMembers] = useState<CourseUserWithProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<"units" | "members">("units");
  const [loading, setLoading] = useState(true);

  // Unit form
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitCode, setUnitCode] = useState("");

  // Area form
  const [showAreaForm, setShowAreaForm] = useState<string | null>(null);
  const [areaName, setAreaName] = useState("");
  const [areaCode, setAreaCode] = useState("");

  // Member form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState<string>("ntd");
  const [memberUnitId, setMemberUnitId] = useState("");
  const [memberAreaId, setMemberAreaId] = useState("");

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean; title: string; message: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => { fetchAll(); }, [courseId]);

  async function fetchAll() {
    setLoading(true);
    const [courseRes, unitsRes, membersRes, profilesRes] = await Promise.all([
      supabase.from("courses").select("*").eq("id", courseId).single(),
      supabase.from("units").select("*").eq("course_id", courseId).order("name"),
      supabase.from("course_users").select("*, profile:profiles(*), unit:units(*), area:areas(*)").eq("course_id", courseId),
      supabase.from("profiles").select("*").eq("approval_status", "approved").order("full_name"),
    ]);
    setCourse(courseRes.data);
    setUnits(unitsRes.data ?? []);
    setMembers((membersRes.data as CourseUserWithProfile[]) ?? []);
    setAllProfiles(profilesRes.data ?? []);

    if (unitsRes.data?.length) {
      const unitIds = unitsRes.data.map((u: Unit) => u.id);
      const { data: areasData } = await supabase.from("areas").select("*").in("unit_id", unitIds).order("name");
      setAreas(areasData ?? []);
    } else {
      setAreas([]);
    }
    setLoading(false);
  }

  // ─── CRUD: Units ─────────────────────────────────────────────
  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("units").insert({ course_id: courseId, name: unitName, code: unitCode || null });
    if (error) { toast.error("Lỗi tạo đơn vị: " + error.message); return; }
    setShowUnitForm(false); setUnitName(""); setUnitCode("");
    toast.success("Đã tạo đơn vị thành công");
    fetchAll();
  }

  async function handleUpdateUnitName(unitId: string, newName: string) {
    const { error } = await supabase.from("units").update({ name: newName }).eq("id", unitId);
    if (error) { toast.error("Lỗi cập nhật: " + error.message); return; }
    toast.success("Đã cập nhật tên đơn vị");
    fetchAll();
  }

  async function handleDeleteUnit(unit: Unit) {
    setConfirmDelete({
      open: true,
      title: "Xóa đơn vị",
      message: `Bạn chắc chắn muốn xóa "${unit.name}"? Tất cả khu vực bên trong cũng sẽ bị xóa.`,
      onConfirm: async () => {
        // Delete areas first
        await supabase.from("areas").delete().eq("unit_id", unit.id);
        const { error } = await supabase.from("units").delete().eq("id", unit.id);
        if (error) { toast.error("Lỗi xóa: " + error.message); } else { toast.success("Đã xóa đơn vị"); }
        setConfirmDelete(prev => ({ ...prev, open: false }));
        fetchAll();
      },
    });
  }

  // ─── CRUD: Areas ─────────────────────────────────────────────
  async function handleCreateArea(e: React.FormEvent, unitId: string) {
    e.preventDefault();
    const { error } = await supabase.from("areas").insert({ unit_id: unitId, name: areaName, code: areaCode || null });
    if (error) { toast.error("Lỗi tạo khu vực: " + error.message); return; }
    setShowAreaForm(null); setAreaName(""); setAreaCode("");
    toast.success("Đã tạo khu vực thành công");
    fetchAll();
  }

  async function handleUpdateAreaName(areaId: string, newName: string) {
    const { error } = await supabase.from("areas").update({ name: newName }).eq("id", areaId);
    if (error) { toast.error("Lỗi cập nhật: " + error.message); return; }
    toast.success("Đã cập nhật tên khu vực");
    fetchAll();
  }

  async function handleDeleteArea(area: Area) {
    setConfirmDelete({
      open: true, title: "Xóa khu vực",
      message: `Bạn chắc chắn muốn xóa khu vực "${area.name}"?`,
      onConfirm: async () => {
        const { error } = await supabase.from("areas").delete().eq("id", area.id);
        if (error) { toast.error("Lỗi xóa: " + error.message); } else { toast.success("Đã xóa khu vực"); }
        setConfirmDelete(prev => ({ ...prev, open: false }));
        fetchAll();
      },
    });
  }

  // ─── CRUD: Members ───────────────────────────────────────────
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) { toast.warning("Vui lòng chọn tài khoản"); return; }

    // Business Logic: ĐVT requires unit, KV disabled
    if (memberRole === "dvt") {
      if (!memberUnitId) { toast.warning("Vui lòng chọn đơn vị cho Địa vực trưởng"); return; }
      const existingDVT = members.find(m => m.unit_id === memberUnitId && m.role_in_course === "dvt");
      if (existingDVT) {
        toast.error(`Đơn vị này đã có Địa vực trưởng: ${existingDVT.profile?.full_name}`);
        return;
      }
    }

    if (memberRole === "kvt") {
      if (!memberAreaId) { toast.warning("Vui lòng chọn khu vực cho Khu vực trưởng"); return; }
      const existingKVT = members.find(m => m.area_id === memberAreaId && m.role_in_course === "kvt");
      if (existingKVT) {
        toast.error(`Khu vực này đã có Khu vực trưởng: ${existingKVT.profile?.full_name}`);
        return;
      }
    }

    const { error } = await supabase.from("course_users").insert({
      course_id: courseId,
      user_id: selectedUserId,
      role_in_course: memberRole,
      unit_id: memberUnitId || null,
      area_id: memberRole === "dvt" ? null : (memberAreaId || null),
    });

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        toast.error("Thành viên này đã tồn tại trong khóa học");
      } else {
        toast.error("Lỗi thêm thành viên: " + error.message);
      }
      return;
    }

    setShowMemberForm(false); setSelectedUserId(""); setMemberRole("ntd"); setMemberUnitId(""); setMemberAreaId("");
    toast.success("Đã thêm thành viên thành công");
    fetchAll();
  }

  async function handleDeleteMember(member: CourseUserWithProfile) {
    setConfirmDelete({
      open: true, title: "Xóa thành viên",
      message: `Bạn chắc chắn muốn xóa "${member.profile?.full_name}" khỏi khóa học?`,
      onConfirm: async () => {
        const { error } = await supabase.from("course_users").delete().eq("id", member.id);
        if (error) { toast.error("Lỗi xóa: " + error.message); } else { toast.success("Đã xóa thành viên"); }
        setConfirmDelete(prev => ({ ...prev, open: false }));
        fetchAll();
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────
  const areasForUnit = (unitId: string) => areas.filter(a => a.unit_id === unitId);
  const membersForUnit = (unitId: string) => members.filter(m => m.unit_id === unitId);
  const isAreaDisabled = memberRole === "dvt";

  // Available profiles (not already in course)
  const memberIds = new Set(members.map(m => m.user_id));
  const availableProfiles = allProfiles.filter(p => !memberIds.has(p.id));

  // ─── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton w-48 h-8" /><div className="skeleton w-full h-64" />
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-12 text-[var(--color-surface-400)]">Không tìm thấy khóa học</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(prev => ({ ...prev, open: false }))} />

      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <a href="/quan-tri/khoa-hoc" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] transition-colors mb-3">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Quay lại danh sách
        </a>
        <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">{course.name}</h1>
        {course.description && <p className="text-[var(--color-surface-400)] mt-1">{course.description}</p>}
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-[var(--color-surface-700)]">
        {(["units", "members"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === tab
                ? "border-[var(--color-primary-500)] text-[var(--color-primary-400)]"
                : "border-transparent text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)]"
            }`}>
            {tab === "units" ? <IconBuilding /> : <IconUsers />}
            {tab === "units" ? `Đơn vị & Khu vực (${units.length})` : `Thành viên (${members.length})`}
          </button>
        ))}
      </div>

      {/* ══════════════════ UNITS TAB ══════════════════════ */}
      {activeTab === "units" && (
        <div className="space-y-4">
          {isAdmin && (
            <button onClick={() => setShowUnitForm(!showUnitForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:shadow-[var(--shadow-glow)] hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}>
              <IconPlus /> Thêm đơn vị
            </button>
          )}

          {showUnitForm && (
            <form onSubmit={handleCreateUnit} className="glass rounded-xl p-5 flex gap-3 items-end animate-fade-in"
              style={{ borderColor: "var(--color-surface-600)" }}>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-1.5">Tên đơn vị *</label>
                <input value={unitName} onChange={e => setUnitName(e.target.value)} required placeholder="VD: Đơn vị 1"
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-800)] border border-[var(--color-surface-600)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] transition-colors" />
              </div>
              <div className="w-36">
                <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-1.5">Mã ĐV</label>
                <input value={unitCode} onChange={e => setUnitCode(e.target.value)} placeholder="DV1"
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-800)] border border-[var(--color-surface-600)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] transition-colors" />
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] transition-colors">Tạo</button>
              <button type="button" onClick={() => setShowUnitForm(false)}
                className="px-4 py-2.5 rounded-lg text-sm text-[var(--color-surface-400)] border border-[var(--color-surface-600)] hover:bg-[var(--color-surface-800)] transition-colors">Hủy</button>
            </form>
          )}

          {units.length === 0 ? (
            <div className="text-center py-16">
              <IconBuilding />
              <p className="text-[var(--color-surface-400)] mt-4">Chưa có đơn vị nào</p>
              {isAdmin && <p className="text-sm text-[var(--color-surface-500)] mt-1">Nhấn "Thêm đơn vị" để bắt đầu cấu trúc</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {units.map((unit) => {
                const unitAreas = areasForUnit(unit.id);
                const unitMembers = membersForUnit(unit.id);
                return (
                  <div key={unit.id} className="glass rounded-xl overflow-hidden card-accent" style={{ borderColor: "var(--color-surface-600)" }}>
                    {/* Unit Header */}
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
                          <IconBuilding />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[var(--color-surface-100)]">
                            <InlineEdit value={unit.name} onSave={(v) => handleUpdateUnitName(unit.id, v)} />
                          </h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            {unit.code && <span className="text-xs text-[var(--color-surface-500)]">Mã: {unit.code}</span>}
                            <span className="text-xs text-[var(--color-surface-500)]">
                              {unitAreas.length} khu vực • {unitMembers.length} thành viên
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowAreaForm(showAreaForm === unit.id ? null : unit.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium badge-primary transition-all hover:scale-105">
                          <IconPlus /> Thêm KV
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDeleteUnit(unit)} className="btn-icon-danger" title="Xóa đơn vị">
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Area Form */}
                    {showAreaForm === unit.id && (
                      <form onSubmit={(e) => handleCreateArea(e, unit.id)}
                        className="px-5 py-3 flex gap-3 items-end animate-fade-in"
                        style={{ background: "rgba(30, 41, 59, 0.5)", borderTop: "1px solid var(--color-surface-700)" }}>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-1">Tên khu vực *</label>
                          <input value={areaName} onChange={e => setAreaName(e.target.value)} required placeholder="Tên khu vực"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-900)] border border-[var(--color-surface-600)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] transition-colors" />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-1">Mã KV</label>
                          <input value={areaCode} onChange={e => setAreaCode(e.target.value)} placeholder="KV1"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-900)] border border-[var(--color-surface-600)] text-sm text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] transition-colors" />
                        </div>
                        <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] transition-colors">Tạo</button>
                        <button type="button" onClick={() => setShowAreaForm(null)}
                          className="px-3 py-2 rounded-lg text-xs text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)] transition-colors">Hủy</button>
                      </form>
                    )}

                    {/* Areas List */}
                    {unitAreas.length > 0 && (
                      <div className="px-5 py-3 space-y-1.5" style={{ borderTop: "1px solid var(--color-surface-800)" }}>
                        {unitAreas.map(area => (
                          <div key={area.id} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg hover:bg-[var(--color-surface-800)]/60 transition-colors group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-400)] flex-shrink-0" />
                              <span className="text-sm text-[var(--color-surface-200)]">
                                <InlineEdit value={area.name} onSave={(v) => handleUpdateAreaName(area.id, v)} />
                              </span>
                              {area.code && <span className="text-xs text-[var(--color-surface-500)]">({area.code})</span>}
                            </div>
                            {isAdmin && (
                              <button onClick={() => handleDeleteArea(area)}
                                className="btn-icon-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                <IconTrash />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {unitAreas.length === 0 && (
                      <div className="px-5 py-4 text-xs text-[var(--color-surface-500)]" style={{ borderTop: "1px solid var(--color-surface-800)" }}>
                        Chưa có khu vực — nhấn "Thêm KV" để tạo
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ MEMBERS TAB ════════════════════ */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {isAdmin && (
            <button onClick={() => setShowMemberForm(!showMemberForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:shadow-[var(--shadow-glow)] hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}>
              <IconPlus /> Thêm thành viên
            </button>
          )}

          {showMemberForm && (
            <form onSubmit={handleAddMember} className="glass rounded-xl p-5 space-y-4 animate-fade-in relative"
              style={{ borderColor: "var(--color-surface-600)", zIndex: 20 }}>
              <h3 className="text-sm font-semibold text-[var(--color-surface-200)]">Thêm thành viên mới</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Select */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-1.5">Tài khoản *</label>
                  <UserSelect profiles={availableProfiles} value={selectedUserId} onChange={setSelectedUserId}
                    placeholder="Chọn từ danh sách tài khoản..." />
                </div>
                {/* Role Select */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-1.5">Vai trò *</label>
                  <select value={memberRole} onChange={e => { setMemberRole(e.target.value); if (e.target.value === "dvt") setMemberAreaId(""); }}
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-800)] border border-[var(--color-surface-600)] text-sm text-[var(--color-surface-100)] focus:outline-none focus:border-[var(--color-primary-500)] transition-colors">
                    <option value="dvt">Địa vực trưởng</option>
                    <option value="kvt">Khu vực trưởng</option>
                    <option value="ntd">Người truyền đạo</option>
                    <option value="tuvanvien">Tư vấn viên</option>
                  </select>
                </div>
                {/* Unit Select */}
                <div>
                  <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-1.5">Đơn vị</label>
                  <select value={memberUnitId} onChange={e => { setMemberUnitId(e.target.value); setMemberAreaId(""); }}
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-800)] border border-[var(--color-surface-600)] text-sm text-[var(--color-surface-100)] focus:outline-none focus:border-[var(--color-primary-500)] transition-colors">
                    <option value="">— Chọn đơn vị —</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                {/* Area Select - disabled for ĐVT */}
                <div className={isAreaDisabled ? "field-disabled" : ""}>
                  <label className="block text-xs font-medium text-[var(--color-surface-300)] mb-1.5">
                    Khu vực {isAreaDisabled && <span className="text-[var(--color-surface-500)]">(ĐVT quản lý toàn đơn vị)</span>}
                  </label>
                  <select value={memberAreaId} onChange={e => setMemberAreaId(e.target.value)} disabled={isAreaDisabled}
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-800)] border border-[var(--color-surface-600)] text-sm text-[var(--color-surface-100)] focus:outline-none focus:border-[var(--color-primary-500)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <option value="">— Chọn khu vực —</option>
                    {areas.filter(a => !memberUnitId || a.unit_id === memberUnitId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] transition-colors">
                  Thêm thành viên
                </button>
                <button type="button" onClick={() => { setShowMemberForm(false); setSelectedUserId(""); }}
                  className="px-4 py-2.5 rounded-lg text-sm text-[var(--color-surface-400)] border border-[var(--color-surface-600)] hover:bg-[var(--color-surface-800)] transition-colors">
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Members Table */}
          <div className="glass rounded-xl overflow-hidden" style={{ borderColor: "var(--color-surface-600)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(30, 41, 59, 0.5)" }}>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-surface-300)] uppercase tracking-wider">Họ tên</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-surface-300)] uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-surface-300)] uppercase tracking-wider">Vai trò</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-surface-300)] uppercase tracking-wider">Đơn vị</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--color-surface-300)] uppercase tracking-wider">Khu vực</th>
                  {isAdmin && <th className="text-right px-5 py-3.5 text-xs font-semibold text-[var(--color-surface-300)] uppercase tracking-wider w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-[var(--color-surface-400)]">Chưa có thành viên</td></tr>
                ) : (
                  members.map(m => (
                    <tr key={m.id} className="border-t border-[var(--color-surface-800)] table-row-hover">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
                            style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
                            {m.profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="text-sm font-medium text-[var(--color-surface-200)]">{m.profile?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[var(--color-surface-400)]">{m.profile?.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="badge-primary px-2.5 py-1 rounded-md text-xs font-medium">
                          {ROLE_LABELS[m.role_in_course]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[var(--color-surface-400)]">{m.unit?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-sm text-[var(--color-surface-400)]">{m.area?.name ?? "—"}</td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => handleDeleteMember(m)} className="btn-icon-danger" title="Xóa thành viên">
                            <IconTrash />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
