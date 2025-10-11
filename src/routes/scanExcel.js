import { Router } from "express";
import XLSX from "xlsx";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const router = Router();

// 📤 إعداد SMTP (gmail مثال)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "sensosafee@gmail.com", // بريد الإرسال
    pass: process.env.EMAIL_PASS || "abcd efgh ijkl mnop", // كلمة مرور التطبيق (App Password)
  },
});

// 📚 تحميل ملف Excel وتحويله لمصفوفة
router.post("/generateAndSendQR", async (req, res) => {
  try {
    const filePath = path.join(process.cwd() , "uploads", "students.xlsx");
    if (!fs.existsSync(filePath))
      return res.status(404).send("❌ ملف Excel غير موجود");

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = XLSX.utils.sheet_to_json(sheet);

    // 🌀 معالجة كل طالب
    for (const student of students) {
      const { studentId, name, email, section, team, course, type } = student;

      if (!email) continue;

      // 🧾 توليد QR يحتوي بيانات الطالب
      const qrData = JSON.stringify({
        studentId,
        name,
        section,
        team,
        course,
        type,
      });

      const qrPath = path.join("temp", `${studentId}.png`);
      await QRCode.toFile(qrPath, qrData);

      // 📩 إرسال البريد
      await transporter.sendMail({
        from: `"نظام الحضور" <${process.env.EMAIL_USER || "sensosafee@gmail.com"}>`,
        to: email,
        subject: " كود الحضور الخاص بك",
        html: `
          <h3>مرحباً ${name} </h3>
          <p>هذا هو كود الـ QR الخاص بك لاستخدامه في نظام الحضور.</p>
          <p><b>الرجاء عدم مشاركته مع أي شخص.</b></p>
        `,
        attachments: [
          {
            filename: `${name}_QR.png`,
            path: qrPath,
          },
        ],
      });

      console.log(`📤 تم إرسال الكود إلى ${email}`);
    }

    res.json({ ok: true, message: "✅ تم إرسال جميع الأكواد بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).send("حدث خطأ أثناء المعالجة");
  }
});

export default router;
