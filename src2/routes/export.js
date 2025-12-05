import { Router } from "express";
import ExcelJS from "exceljs";
import userSchema from "../models/userSchema.js";
import ScanRecord from "../models/ScanRecord.js";

const router = Router();

router.get("/excel", async (req, res) => {
  try {
    // 🔹 استلام userId من query
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId مطلوب" });
    }

    // 🔹 جلب المستخدم بالـ list الخاص به + عمل populate لبيانات الـ list
    const user = await userSchema.findById(userId).populate("list").lean();

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    if (!user.list || user.list.length === 0) {
      return res
        .status(404)
        .json({ message: "لا توجد بيانات في قائمة المستخدم" });
    }

    // ✅ تجهيز ملف Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("User List");

    ws.columns = [
      { header: "Student ID", key: "studentId", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Section", key: "section", width: 10 },
      { header: "Scanned At", key: "scannedAt", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Team", key: "team", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "Attendance", key: "attendance", width: 12 },
      {header:"Course",key:"course",width:15}
    ];

    // 🔹 نضيف الصفوف من list
    user.list.forEach((record) => {
      ws.addRow({
        studentId: record.studentId,
        name: record.name,
        section: record.section,
        scannedAt: record.scannedAt
          ? new Date(record.scannedAt).toLocaleString()
          : "N/A",

        email: record.email,
        team: record.team,
        type: record.type,
        attendance: record.attendance,
        course:record.course
      });
    });

    // 🔹 إعدادات التحميل
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="scans-${userId}.xlsx"`
    );

    // 🔹 كتابة الملف في الاستجابة
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Excel export error:", err);
    res.status(500).json({ error: "فشل في إنشاء ملف Excel" });
  }
});

export default router;
