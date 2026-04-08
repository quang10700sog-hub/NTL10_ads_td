import * as XLSX from "xlsx";
import type { Student } from "@/lib/types";

/**
 * Force download a blob with the correct filename.
 * Uses File System Access API (native Save As dialog) → works on all Chromium browsers including Edge.
 * Falls back to blob URL + <a> click for unsupported browsers.
 */
async function forceDownload(blob: Blob, fileName: string) {
  // Strategy 1: File System Access API (Chrome 86+, Edge 86+)
  // Opens a native "Save As" dialog — always respects filename
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Excel Spreadsheet",
            accept: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return; // Success
    } catch {
      // User cancelled the dialog or API failed — fall through to Strategy 2
    }
  }

  // Strategy 2: Blob URL + <a> download attribute (fallback)
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Export students to Excel file
 */
export async function exportStudentsToExcel(
  students: Student[],
  courseName: string
) {
  if (students.length === 0) return;

  // Collect all dynamic data keys
  const dynamicKeys = new Set<string>();
  students.forEach((s) => {
    if (s.dynamic_data) {
      Object.keys(s.dynamic_data).forEach((k) => dynamicKeys.add(k));
    }
  });

  // Build rows
  const rows = students.map((s, index) => {
    const row: Record<string, unknown> = {
      STT: index + 1,
      "Họ tên": s.full_name ?? "",
      "Năm sinh": s.birth_year ?? "",
      "Giới tính": s.gender ?? "",
      "SĐT/Zalo": s.phone_zalo ?? "",
      "Link Facebook": s.facebook_link ?? "",
      "Nghề nghiệp": s.occupation ?? "",
      "Nơi ở": s.residence ?? "",
      "Địa vực": s.unit?.name ?? "",
      "Khu vực": s.area?.name ?? "",
      "Người chăm sóc": s.assigned_user?.profile?.full_name ?? "",
      "Người CS liên kết 1": s.linked_caretaker_user?.profile?.full_name ?? "",
      "Người CS liên kết 2": s.linked_caretaker_user_2?.profile?.full_name ?? "",
      "Trạng thái học tập": s.learning_status ?? "",
      "Trạng thái liên lạc": s.contact_status ?? "",
      "Nội dung chăm sóc": s.care_content ?? "",
      "Ghi chú tư vấn viên": s.advisor_note ?? "",
    };

    // Add dynamic data columns
    dynamicKeys.forEach((key) => {
      row[key] = (s.dynamic_data?.[key] as string) ?? "";
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Học viên");

  // Auto-size columns
  if (rows.length > 0) {
    const maxWidths: number[] = [];
    const headers = Object.keys(rows[0]);
    headers.forEach((h, i) => {
      let maxLen = h.length;
      rows.forEach((row) => {
        const val = String(row[h] ?? "");
        if (val.length > maxLen) maxLen = val.length;
      });
      maxWidths[i] = Math.min(maxLen + 2, 40);
    });
    worksheet["!cols"] = maxWidths.map((w) => ({ wch: w }));
  }

  // Generate filename
  const now = new Date();
  const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
  const fileName = `HocVien_${courseName.replace(/\s+/g, "_")}_${dateStr}.xlsx`;

  // Generate Excel binary
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  await forceDownload(blob, fileName);
}
