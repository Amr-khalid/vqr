import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const filePath = path.resolve("attendance_records.xlsx");

export async function saveToExcel(record) {
  try {
    let workbook;
    let worksheet;

    // ✅ تحقق من وجود الملف أولاً
    if (fs.existsSync(filePath)) {
      // لو الملف موجود، نقرأه
      const fileData = fs.readFileSync(filePath);
      workbook = XLSX.read(fileData, { type: "buffer" });
      worksheet = workbook.Sheets[workbook.SheetNames[0]];
    } else {
      // لو مش موجود، ننشئ جديد
      workbook = XLSX.utils.book_new();
      worksheet = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    }

    // ✅ نقرأ البيانات الحالية (لو فيه)
    const existingData = XLSX.utils.sheet_to_json(worksheet);

    // ✅ نضيف السجل الجديد
    existingData.push(record);

    // ✅ نحول البيانات من جديد إلى Sheet
    const newSheet = XLSX.utils.json_to_sheet(existingData);
    workbook.Sheets[workbook.SheetNames[0]] = newSheet;

    // ✅ نحفظ الملف بأمان
    XLSX.writeFile(workbook, filePath);

    console.log("✅ Excel saved successfully:", record.studentId);
  } catch (err) {
    console.error("❌ Error saving to Excel:", err.message);
  }
}
