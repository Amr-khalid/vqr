// backend/src/index.js
import networkRoutes from "./src/routes/network.js"
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import ScanRecord from "./src/models/ScanRecord.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch((e) => console.error("❌ Mongo error:", e));

import qrRoutes from "./src/routes/qr.js";
import scanRoutes from "./src/routes/scan.js";
import exportRoutes from "./src/routes/export.js";
import userRoutes from "./src/routes/users.js"; // ✅ استخدمه كـ router
import userSchema from "./src/models/userSchema.js";
import scanExcelRouter from "./src/routes/scanExcel.js";

app.use("/api/qr", qrRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/users", userRoutes); // ✅ هنا





app.use("/api/excel", scanExcelRouter);

// ✅ إضافة مسار الشبكة الجديد
app.use("/api/network", networkRoutes);

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

app.get("/", (req, res) => {
  res.send("Hello World!");
});








const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
/*
const express = require("express");
const find = require("local-devices");
const cors = require("cors");
const os = require("os");
const { exec } = require("child_process"); // إضافة مكتبة لتنفيذ أوامر النظام

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // ضروري لقراءة بيانات POST

// قاعدة بيانات بسيطة في الذاكرة لتخزين ربط الطلاب بالأجهزة
// (ملاحظة: ستفقد البيانات عند إعادة تشغيل السيرفر، لقاعدة بيانات دائمة يمكن استخدام ملف JSON أو SQLite)
const studentDatabase = {};

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

// دالة تنفيذ Ping باستخدام أوامر النظام
function pingDevice(ip) {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    const cmd = isWin ? `ping -n 1 -w 200 ${ip}` : `ping -c 1 -W 1 ${ip}`;
    exec(cmd, (error, stdout, stderr) => {
      resolve();
    });
  });
}

// --- واجهة المستخدم (الجديدة) ---
// عند الدخول إلى الصفحة الرئيسية، نعرض واجهة التسجيل
app.get("/ip", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تسجيل جهاز الطالب</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; text-align: center; }
            h2 { color: #1f2937; margin-bottom: 1.5rem; }
            .info-box { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; }
            .mac-address { font-family: monospace; font-weight: bold; font-size: 1.2rem; display: block; margin-top: 0.5rem; }
            .input-group { margin-bottom: 1rem; text-align: right; }
            label { display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500; }
            input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; box-sizing: border-box; font-size: 1rem; }
            button { wudth: 100%; width: 100%; background-color: #2563eb; color: white; padding: 0.75rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; transition: background 0.2s; }
            button:hover { background-color: #1d4ed8; }
            button:disabled { background-color: #9ca3af; cursor: not-allowed; }
            .status { margin-top: 1rem; font-size: 0.9rem; min-height: 1.2rem; }
            .loader { border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>ربط الجهاز بالطالب</h2>
            
            <div id="loadingSection">
                <div class="loader"></div>
                <p>جاري التعرف على جهازك...</p>
            </div>

            <div id="mainSection" style="display: none;">
                <div class="info-box">
                    <span>عنوان MAC الخاص بك:</span>
                    <span id="macDisplay" class="mac-address">...</span>
                </div>

                <div class="input-group">
                    <label>رقم الطالب (Student ID):</label>
                    <input type="text" id="studentId" placeholder="مثال: 2024001">
                </div>

                <button id="saveBtn" onclick="saveData()">حفظ وربط الجهاز</button>
                <p id="statusMsg" class="status"></p>
            </div>
        </div>

        <script>
            let currentMac = '';

            // عند تحميل الصفحة، اطلب معلومات الجهاز من السيرفر
            async function fetchMyInfo() {
                try {
                    const response = await fetch('/my-info');
                    const data = await response.json();
                    
                    document.getElementById('loadingSection').style.display = 'none';
                    document.getElementById('mainSection').style.display = 'block';

                    if (data.mac) {
                        currentMac = data.mac;
                        document.getElementById('macDisplay').textContent = data.mac;
                        
                        // إذا كان الطالب مسجلاً مسبقاً، املأ الحقل
                        if (data.studentId) {
                            document.getElementById('studentId').value = data.studentId;
                            document.getElementById('statusMsg').textContent = '✅ هذا الجهاز مسجل مسبقاً';
                            document.getElementById('statusMsg').style.color = 'green';
                            document.getElementById('saveBtn').textContent = 'تحديث البيانات';
                        }
                    } else {
                        document.getElementById('macDisplay').textContent = 'غير معروف';
                        document.getElementById('statusMsg').textContent = '⚠️ تعذر تحديد الـ MAC. تأكد أنك متصل بنفس الشبكة.';
                        document.getElementById('statusMsg').style.color = '#dc2626';
                        document.getElementById('saveBtn').disabled = true;
                    }
                } catch (err) {
                    console.error(err);
                    document.getElementById('loadingSection').innerHTML = '<p style="color:red">حدث خطأ في الاتصال</p>';
                }
            }

            async function saveData() {
                const studentId = document.getElementById('studentId').value;
                if (!studentId) return alert('الرجاء إدخال رقم الطالب');

                const btn = document.getElementById('saveBtn');
                btn.disabled = true;
                btn.textContent = 'جاري الحفظ...';

                try {
                    const response = await fetch('/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId })
                    });
                    const result = await response.json();
                    
                    if (response.ok) {
                        document.getElementById('statusMsg').textContent = '✅ ' + result.message;
                        document.getElementById('statusMsg').style.color = 'green';
                    } else {
                        document.getElementById('statusMsg').textContent = '❌ ' + result.message;
                        document.getElementById('statusMsg').style.color = 'red';
                    }
                } catch (err) {
                    alert('حدث خطأ أثناء الحفظ');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'حفظ وربط الجهاز';
                }
            }

            fetchMyInfo();
        </script>
    </body>
    </html>
    `);
});

// مسار جديد: معرفة معلومات المستخدم الحالي (من خلال الـ IP الخاص به)
app.get("/ip/my-info", async (req, res) => {
  // 1. الحصول على IP المستخدم
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  // تنظيف صيغة الـ IP (قد يظهر كـ ::ffff:192.168.1.5)
  ip = ip.replace("::ffff:", "");

  // في حالة التجربة المحلية
  if (ip === "::1") ip = "127.0.0.1";

  try {
    // 2. محاولة عمل Ping سريع لهذا الـ IP للتأكد من وجوده في جدول ARP
    if (ip !== "127.0.0.1") {
      await pingDevice(ip);
      // انتظار قصير لتحديث الجدول
      await new Promise((r) => setTimeout(r, 200));
    }

    // 3. البحث عن الماك أدرس في الجدول
    const devices = await find();
    const myDevice = devices.find((d) => d.ip === ip);

    if (myDevice) {
      // البحث هل الطالب مسجل مسبقاً؟
      const savedStudentId = studentDatabase[myDevice.mac];
      res.json({
        ip: ip,
        mac: myDevice.mac,
        studentId: savedStudentId || null,
      });
    } else {
      res.json({ ip: ip, mac: null, error: "Device not found in ARP table" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// مسار جديد: تسجيل الطالب
app.post("/ip/register", async (req, res) => {
  const { studentId } = req.body;

  // نكرر عملية التعرف على الـ IP لضمان الأمان (كي لا يرسل المستخدم ماك وهمي)
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  ip = ip.replace("::ffff:", "");
  if (ip === "::1") ip = "127.0.0.1";

  const devices = await find();
  const myDevice = devices.find((d) => d.ip === ip);

  if (myDevice && myDevice.mac) {
    // الحفظ في قاعدة البيانات
    studentDatabase[myDevice.mac] = studentId;
    console.log(
      `Registered: Student ${studentId} linked to MAC ${myDevice.mac}`
    );
    res.json({ message: "تم ربط الجهاز بنجاح", mac: myDevice.mac });
  } else {
    res.status(400).json({ message: "تعذر التعرف على عنوان MAC الخاص بك" });
  }
});

// --- بقية الكود القديم للفحص الشامل ---

async function populateArpTable(subnet) {
  console.log(`Performing system PING sweep on ${subnet}.x ...`);
  const batchSize = 50;
  for (let i = 1; i < 255; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && i + j < 255; j++) {
      const ip = `${subnet}.${i + j}`;
      batch.push(pingDevice(ip));
    }
    await Promise.all(batch);
  }
}

app.get("/ip/scan", async (req, res) => {
  try {
    console.log("Starting DEEP active scan...");
    const myIP = getLocalIP();
    const subnet = myIP.substring(0, myIP.lastIndexOf("."));

    await populateArpTable(subnet);
    await new Promise((r) => setTimeout(r, 500));

    const devices = await find();

    const enrichedDevices = devices.map((device, index) => ({
      id: index + 1,
      name: device.name || "Unknown Device",
      ip: device.ip,
      mac: device.mac,
      // إضافة Student ID إذا كان موجوداً
      studentId: studentDatabase[device.mac] || "Not Registered",
      type: determineDeviceType(device.name),
      status: "online",
    }));

    console.log(`Found ${enrichedDevices.length} devices.`);
    res.json(enrichedDevices);
  } catch (error) {
    console.error("Scan Error:", error);
    res.status(500).json({ error: "فشل الفحص" });
  }
});

app.get("/ip/my-ip", (req, res) => {
  res.json({ ip: getLocalIP() });
});

function determineDeviceType(name) {
  if (!name) return "generic";
  const n = name.toLowerCase();
  if (n.includes("iphone") || n.includes("android")) return "mobile";
  if (n.includes("macbook") || n.includes("desktop") || n.includes("win"))
    return "laptop";
  if (n.includes("tv")) return "tv";
  if (n.includes("router") || n.includes("gateway")) return "router";
  return "generic";
}

app.listen(PORT, () => {
  console.log(`
    🚀 السيرفر يعمل الآن!
    -------------------------------------------
    1. واجهة تسجيل الطلاب: http://localhost:${PORT}  <-- (الجديد)
    2. فحص الشبكة (Admin): http://localhost:${PORT}/scan
    -------------------------------------------
    `);
});




*/ 