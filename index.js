import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import ScanRecord from "./api/models/ScanRecord.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb+srv://node:1234@learnnode.tca96.mongodb.net/qrcode"
  )
  .then(() => console.log("✅ Mongo connected"))
  .catch((e) => console.error("❌ Mongo error:", e));

import qrRoutes from "./api/routes/qr.js";
import scanRoutes from "./api/routes/scan.js";
import exportRoutes from "./api/routes/export.js";
import userRoutes from "./api/routes/users.js"; // ✅ استخدمه كـ router
import userSchema from "./api/models/userSchema.js";
import scanExcelRouter from "./api/routes/scanExcel.js";

app.use("/api/qr", qrRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/users", userRoutes); // ✅ هنا

// اختبار حذف الداتا

app.post("/api/drop", async (req, res) => {
  try {
    const { id } = req.body; // 👈 ناخد id من البودي
    if (!id)
      return res.status(400).json({ ok: false, message: "User ID مطلوب" });

    // ✅ تفرغ list بتاعة المستخدم (من غير ما تحذف المستخدم نفسه)
    await userSchema.findByIdAndUpdate(id, { $set: { list: [] } });

    // ✅ تحذف كل السجلات الخاصة بالمستخدم ده فقط
    await ScanRecord.deleteMany({});

    res.json({ ok: true, message: "تم حذف جميع البيانات الخاصة بالمستخدم" });
  } catch (err) {
    console.error("❌ Drop error:", err);
    res.status(500).json({ ok: false, message: "خطأ أثناء حذف البيانات" });
  }
});

app.get("/api/all", async (req, res) => {
  try {
    const { studentId } = req.body || req.query;
    const data = await ScanRecord.find({studentId});
    res.json({ ok: true, data });
  } catch (err) {
    console.error("❌ Get all error:", err);
    res.status(500).json({ ok: false, message: "خطاء في استخراج البيانات" });
  }
})

app.get("/api/alls", async (req, res) => {
  try {
    const { studentId } = req.body || req.query;
    const data = await ScanRecord.find({ studentId });
    res.json({ ok: true, data });
  } catch (err) {
    console.error("❌ Get all error:", err);
    res.status(500).json({ ok: false, message: "خطاء في استخراج البيانات" });
  }
});



app.use("/api/excel", scanExcelRouter);







import multer from "multer";
import xlsx from "xlsx";


// تفعيل CORS للسماح بالطلبات من الواجهة الأمامية
app.use(cors());

// إعداد Multer لتخزين الملفات في الذاكرة المؤقتة بدلاً من حفظها على القرص
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// إنشاء Endpoint لاستقبال الملفات
// نستخدم upload.single('excelFile') حيث 'excelFile' هو اسم الحقل في الفورم
app.post("/upload", upload.single("excelFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("لم يتم رفع أي ملف.");
  }

  try {
    // قراءة الملف من الـ buffer المخزن في الذاكرة
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    // الحصول على اسم أول ورقة عمل (sheet)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // تحويل بيانات ورقة العمل إلى صيغة JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    // طباعة البيانات في طرفية الخادم
    console.log("تمت قراءة محتويات الملف بنجاح:");
    console.log(data);

    // إرسال رسالة نجاح إلى العميل
    res.status(200).json({
      message: "تمت معالجة الملف وطباعة محتوياته في الطرفية بنجاح!",
      data: data, // يمكنك إرسال البيانات للواجهة الأمامية إذا أردت
    });
  } catch (error) {
    console.error("حدث خطأ أثناء معالجة الملف:", error);
    res.status(500).send("حدث خطأ في الخادم.");
  }
});










// const PORT = Number(process.env.PORT || 5000);
// app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
