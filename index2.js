import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import ScanRecord from "./src/models/ScanRecord.js"; // مسار مقترح بناءً على الصورة
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch((e) => console.error("❌ Mongo error:", e));

// Routes
import qrRoutes from "./src/routes/qr.js";
import scanRoutes from "./src/routes/scan.js";
import exportRoutes from "./src/routes/export.js";
import userRoutes from "./src/routes/users.js";
import scanExcelRouter from "./src/routes/scanExcel.js";

app.use("/api/qr", qrRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/excel", scanExcelRouter);

// Custom Endpoints
app.post("/api/drop", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id)
      return res.status(400).json({ ok: false, message: "User ID مطلوب" });

    // Note: This deletes ALL scan records, not just for one user.
    // If you want to delete for a specific user, you'd need a field like 'userId' in ScanRecord.
    await ScanRecord.deleteMany({});

    res.json({ ok: true, message: "تم حذف جميع بيانات المسح" });
  } catch (err) {
    console.error("❌ Drop error:", err);
    res.status(500).json({ ok: false, message: "خطأ أثناء حذف البيانات" });
  }
});

app.get("/api/all", async (req, res) => {
  try {
    const { studentId } = req.query; // It's better to get params from req.query for GET requests
    const query = studentId ? { studentId } : {};
    const data = await ScanRecord.find(query);
    res.json({ ok: true, data });
  } catch (err) {
    console.error("❌ Get all error:", err);
    res.status(500).json({ ok: false, message: "خطاء في استخراج البيانات" });
  }
});

// Removed the duplicate /api/alls endpoint as it was identical to /api/all

// Multer setup for file uploads
import multer from "multer";
import xlsx from "xlsx";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("excelFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("لم يتم رفع أي ملف.");
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log("File content read successfully:");
    console.log(data);

    res.status(200).json({
      message: "تمت معالجة الملف بنجاح!",
      data: data,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("حدث خطأ في الخادم.");
  }
});
app.get("/", (req, res) => {
  res.send("Hello World!");
})
// The local server start is commented out, which is correct for Vercel.
// const PORT = Number(process.env.PORT || 5000);
// app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

// ✅✅✅ *** هذا هو السطر الأهم لـ Vercel *** ✅✅✅
// This line allows Vercel to use your Express app as a serverless function.
export default app;
