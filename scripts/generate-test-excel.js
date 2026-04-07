// Script to generate a test Excel file for the "chạy ads tháng 3" course
const XLSX = require("xlsx");
const path = require("path");

const students = [
  { "STT": 1, "Họ tên": "Trần Văn An", "SĐT/Zalo": "0901234567", "Năm sinh": "1995", "Giới tính": "Nam", "Link Facebook": "https://fb.com/tranvanan", "Nghề nghiệp": "Kỹ sư phần mềm", "Nơi ở": "Quận 1, TP.HCM" },
  { "STT": 2, "Họ tên": "Nguyễn Thị Bình", "SĐT/Zalo": "0912345678", "Năm sinh": "1998", "Giới tính": "Nữ", "Link Facebook": "https://fb.com/ntbinh", "Nghề nghiệp": "Giáo viên", "Nơi ở": "Quận 3, TP.HCM" },
  { "STT": 3, "Họ tên": "Lê Hoàng Cường", "SĐT/Zalo": "0923456789", "Năm sinh": "1990", "Giới tính": "Nam", "Link Facebook": "https://fb.com/lhcuong", "Nghề nghiệp": "Bác sĩ", "Nơi ở": "Quận 7, TP.HCM" },
  { "STT": 4, "Họ tên": "Phạm Thị Dung", "SĐT/Zalo": "0934567890", "Năm sinh": "1992", "Giới tính": "Nữ", "Link Facebook": "", "Nghề nghiệp": "Nhân viên văn phòng", "Nơi ở": "Thủ Đức, TP.HCM" },
  { "STT": 5, "Họ tên": "Hoàng Văn Em", "SĐT/Zalo": "0945678901", "Năm sinh": "2000", "Giới tính": "Nam", "Link Facebook": "https://fb.com/hvem", "Nghề nghiệp": "Sinh viên", "Nơi ở": "Quận Bình Thạnh, TP.HCM" },
  { "STT": 6, "Họ tên": "Đỗ Thị Phương", "SĐT/Zalo": "0956789012", "Năm sinh": "1988", "Giới tính": "Nữ", "Link Facebook": "https://fb.com/dtphuong", "Nghề nghiệp": "Kinh doanh", "Nơi ở": "Quận 10, TP.HCM" },
  { "STT": 7, "Họ tên": "Vũ Quang Hải", "SĐT/Zalo": "0967890123", "Năm sinh": "1993", "Giới tính": "Nam", "Link Facebook": "", "Nghề nghiệp": "Lập trình viên", "Nơi ở": "Quận Tân Bình, TP.HCM" },
  { "STT": 8, "Họ tên": "Mai Thị Kim", "SĐT/Zalo": "0978901234", "Năm sinh": "1997", "Giới tính": "Nữ", "Link Facebook": "https://fb.com/mtkim", "Nghề nghiệp": "Kế toán", "Nơi ở": "Quận 5, TP.HCM" },
];

const worksheet = XLSX.utils.json_to_sheet(students);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Học viên");

// Auto-size columns
const headers = Object.keys(students[0]);
worksheet["!cols"] = headers.map(h => {
  let maxLen = h.length;
  students.forEach(s => {
    const val = String(s[h] ?? "");
    if (val.length > maxLen) maxLen = val.length;
  });
  return { wch: Math.min(maxLen + 2, 35) };
});

const outputPath = path.join(__dirname, "test_data_chay_ads.xlsx");
XLSX.writeFile(workbook, outputPath);
console.log(`✅ Created test Excel file: ${outputPath}`);
console.log(`   ${students.length} students, ${headers.length} columns`);
