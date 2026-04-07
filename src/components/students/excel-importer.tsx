"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseExcelFile, rowToStudentData } from "@/lib/utils/excel-parser";
import type { ExcelColumnMapping, ImportResult } from "@/lib/types";
import { FIXED_COLUMN_POSITIONS } from "@/lib/types";

interface ExcelImporterProps {
  courseId: string;
  courseName: string;
  onImported: (result: ImportResult) => void;
}

// Readable labels for fixed DB fields
const DB_FIELD_LABELS: Record<string, string> = {
  full_name: "Họ tên",
  birth_year: "Năm sinh",
  gender: "Giới tính",
  phone_zalo: "SĐT/Zalo",
  facebook_link: "Facebook",
  occupation: "Nghề nghiệp",
  residence: "Nơi ở",
  advisor_note: "Ghi chú TVV",
  care_content: "Nội dung CS",
};

export function ExcelImporter({ courseId, courseName, onImported }: ExcelImporterProps) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"idle" | "preview" | "importing" | "done">("idle");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<ExcelColumnMapping[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setFileName(file.name);

    try {
      const parsed = await parseExcelFile(file);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMappings(parsed.mappings);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi đọc file");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    setError("");

    let newCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < rows.length; i++) {
        const { fixedData, dynamicData } = rowToStudentData(rows[i], mappings);

        if (!fixedData.full_name || !fixedData.phone_zalo) {
          errors.push(`Hàng ${i + 2}: Thiếu Họ tên hoặc SĐT`);
          continue;
        }

        // Check existing by full_name + phone_zalo
        const { data: existing } = await supabase
          .from("students")
          .select("id, dynamic_data")
          .eq("course_id", courseId)
          .eq("full_name", fixedData.full_name)
          .eq("phone_zalo", fixedData.phone_zalo)
          .maybeSingle();

        if (existing) {
          // Merge dynamic_data
          const mergedDynamic = {
            ...((existing.dynamic_data as Record<string, unknown>) ?? {}),
            ...dynamicData,
          };

          await supabase.from("students").update({
            ...fixedData,
            dynamic_data: mergedDynamic,
            updated_at: new Date().toISOString(),
          }).eq("id", existing.id);

          updatedCount++;
        } else {
          await supabase.from("students").insert({
            course_id: courseId,
            ...fixedData,
            dynamic_data: dynamicData,
          });
          newCount++;
        }
      }

      // Save import batch
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("import_batches").insert({
        course_id: courseId,
        file_name: fileName,
        total_rows: rows.length,
        new_rows: newCount,
        updated_rows: updatedCount,
        imported_by: user?.id,
      });

      const importResult: ImportResult = {
        totalRows: rows.length,
        newRows: newCount,
        updatedRows: updatedCount,
        errors,
      };

      setResult(importResult);
      setStep("done");
      onImported(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi import");
      setStep("preview");
    }
  };

  const reset = () => {
    setStep("idle");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMappings([]);
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const fixedCount = mappings.filter((m) => m.isFixed).length;
  const dynamicCount = mappings.filter((m) => !m.isFixed).length;

  return (
    <div className="space-y-4">
      {/* Course Badge */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[var(--color-primary-400)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span className="text-[var(--color-primary-300)]">Import vào:</span>
          <span className="font-semibold text-[var(--color-surface-100)]">{courseName}</span>
        </div>
      </div>

      {/* Upload Area */}
      {step === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[var(--color-surface-700)] rounded-2xl p-8 text-center cursor-pointer hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]/5 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-3 text-[var(--color-surface-500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-[var(--color-surface-300)] font-medium">Nhấn để chọn file Excel</p>
          <p className="text-xs text-[var(--color-surface-500)] mt-1">Hỗ trợ .xlsx, .xls • Cột A→G cố định, H+ tùy biến</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* Preview */}
      {step === "preview" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-surface-300)] font-medium">📄 {fileName}</p>
              <p className="text-xs text-[var(--color-surface-500)]">{rows.length} hàng dữ liệu • {fixedCount} cột cố định • {dynamicCount} cột tùy biến</p>
            </div>
          </div>

          {/* Column Mapping */}
          <div className="glass rounded-xl p-4">
            <h4 className="text-sm font-semibold text-[var(--color-surface-200)] mb-3">Mapping cột</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mappings.map((m) => {
                const colLetter = String.fromCharCode(65 + m.columnIndex);
                return (
                  <div
                    key={m.excelHeader}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${m.isFixed ? "badge-success" : "badge-info"}`}
                  >
                    <span className="font-mono text-[10px] opacity-60 flex-shrink-0">{colLetter}</span>
                    <span className="font-medium truncate">{m.excelHeader}</span>
                    <span className="flex-shrink-0">→</span>
                    <span className="flex-shrink-0">
                      {m.isFixed && m.dbField ? (DB_FIELD_LABELS[m.dbField] ?? m.dbField) : "Dữ liệu bổ sung"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto glass rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-surface-800)]">
                  <th className="px-3 py-2 text-left text-[var(--color-surface-400)]">#</th>
                  {headers.slice(0, 7).map((h, i) => (
                    <th key={h} className="px-3 py-2 text-left text-[var(--color-surface-400)] max-w-[120px] truncate">
                      <span className="font-mono text-[10px] text-[var(--color-surface-500)] mr-1">{String.fromCharCode(65 + i)}</span>
                      {h}
                    </th>
                  ))}
                  {headers.length > 7 && <th className="px-3 py-2 text-[var(--color-surface-500)]">+{headers.length - 7} cột</th>}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-[var(--color-surface-800)]/50">
                    <td className="px-3 py-2 text-[var(--color-surface-500)]">{i + 1}</td>
                    {headers.slice(0, 7).map((h) => (
                      <td key={h} className="px-3 py-2 text-[var(--color-surface-300)] max-w-[120px] truncate">{row[h]}</td>
                    ))}
                    {headers.length > 7 && <td className="px-3 py-2 text-[var(--color-surface-500)]">...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <p className="text-xs text-center py-2 text-[var(--color-surface-500)]">... và {rows.length - 5} hàng nữa</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              className="px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))" }}
            >
              Import {rows.length} hàng vào &quot;{courseName}&quot;
            </button>
            <button onClick={reset} className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-surface-400)] text-sm border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)]">
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Importing */}
      {step === "importing" && (
        <div className="glass rounded-2xl p-8 text-center animate-fade-in">
          <svg className="animate-spin w-10 h-10 text-[var(--color-primary-500)] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[var(--color-surface-300)]">Đang import vào &quot;{courseName}&quot;...</p>
        </div>
      )}

      {/* Done */}
      {step === "done" && result && (
        <div className="glass rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(34, 197, 94, 0.15)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#4ade80]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-surface-100)]">Import thành công!</h3>
              <p className="text-xs text-[var(--color-surface-400)]">Khóa: {courseName}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-[var(--color-surface-800)]">
              <p className="text-2xl font-bold text-[var(--color-surface-100)]">{result.totalRows}</p>
              <p className="text-xs text-[var(--color-surface-400)]">Tổng hàng</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--color-surface-800)]">
              <p className="text-2xl font-bold text-[#4ade80]">{result.newRows}</p>
              <p className="text-xs text-[var(--color-surface-400)]">Tạo mới</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--color-surface-800)]">
              <p className="text-2xl font-bold text-[#60a5fa]">{result.updatedRows}</p>
              <p className="text-xs text-[var(--color-surface-400)]">Cập nhật</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="p-3 rounded-lg text-xs mb-3" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#fbbf24" }}>
              <p className="font-medium mb-1">Cảnh báo ({result.errors.length}):</p>
              {result.errors.slice(0, 5).map((err, i) => <p key={i}>• {err}</p>)}
            </div>
          )}
          <button onClick={reset} className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-surface-300)] text-sm border border-[var(--color-surface-700)] hover:bg-[var(--color-surface-800)]">
            Import thêm
          </button>
        </div>
      )}
    </div>
  );
}
