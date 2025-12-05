import { Router } from "express";
import find from "local-devices";
import DeviceMap from "../models/DeviceMap.js";
import {
  getLocalIP,
  pingDevice,
  populateArpTable,
  determineDeviceType,
} from "../utils/networkTools.js";

const router = Router();

// 1️⃣ واجهة المستخدم (HTML) للتسجيل
router.get("/ui", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تسجيل جهاز الطالب</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #000; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; color: #fff;background: #020024;
background: linear-gradient(343deg, rgba(2, 0, 36, 1) 0%, rgba(97, 9, 121, 1) 35%, rgba(3, 2, 3, 1) 100%); }
            .card { background: rgba(255, 255, 255, 0.1); box-shadow: 0 2px 10px  rgba(255, 255, 255,.5);padding: 2rem; border-radius: 1rem;  width: 100%; max-width: 400px; text-align: center; }
            h2 { color: #fff; margin-bottom: 1.5rem; }
            .info-box { ; border: 1px solid #bfdbfe; color: #fff; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; }
            .mac-address { font-family: monospace; font-weight: bold; font-size: 1.2rem; display: block; margin-top: 0.5rem; }
            .input-group { margin-bottom: 1rem; text-align: right; }
            label { display: block; margin-bottom: 0.5rem; color: #fff; font-weight: 500; }
            input { width: 100%; padding: 0.75rem;box-shadow: 0 2px 10px  rgba(255, 255, 255,.5); border-radius: 0.5rem; box-sizing: border-box; font-size: 1rem; }
            button { width: 100%; background-color: #2563eb;box-shadow: 0 2px 10px  rgba(255, 255, 255,.5); color: white; padding: 0.75rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; transition: background 0.2s; }
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
            async function fetchMyInfo() {
                try {
                    // نستخدم المسار النسبي للـ API
                    const response = await fetch('/api/network/my-info');
                    const data = await response.json();
                    
                    document.getElementById('loadingSection').style.display = 'none';
                    document.getElementById('mainSection').style.display = 'block';

                    if (data.mac) {
                        currentMac = data.mac;
                        document.getElementById('macDisplay').textContent = data.mac;
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
                    const response = await fetch('/api/network/register', {
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

// 2️⃣ API لمعرفة معلومات المستخدم الحالي (IP -> MAC -> DB Check)
router.get("/my-info", async (req, res) => {
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  ip = ip.replace("::ffff:", "");
  if (ip === "::1") ip = "127.0.0.1";

  try {
    // Ping لضمان تحديث جدول ARP
    if (ip !== "127.0.0.1") {
      await pingDevice(ip);
      await new Promise((r) => setTimeout(r, 200));
    }

    const devices = await find();
    const myDevice = devices.find((d) => d.ip === ip);

    if (myDevice) {
      // بحث في قاعدة البيانات MongoDB
      const savedDevice = await DeviceMap.findOne({ mac: myDevice.mac });
      res.json({
        ip: ip,
        mac: myDevice.mac,
        studentId: savedDevice ? savedDevice.studentId : null,
      });
    } else {
      res.json({ ip: ip, mac: null, error: "Device not found in ARP table" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// 3️⃣ API لتسجيل الجهاز
router.post("/register", async (req, res) => {
  const { studentId } = req.body;

  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  ip = ip.replace("::ffff:", "");
  if (ip === "::1") ip = "127.0.0.1";

  const devices = await find();
  const myDevice = devices.find((d) => d.ip === ip);

  if (myDevice && myDevice.mac) {
    try {
      // حفظ أو تحديث في MongoDB
      await DeviceMap.findOneAndUpdate(
        { mac: myDevice.mac },
        {
          studentId,
          lastIp: ip,
          deviceType: determineDeviceType(myDevice.name),
          lastSeen: new Date(),
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Registered: Student ${studentId} -> MAC ${myDevice.mac}`);
      res.json({ message: "تم ربط الجهاز بنجاح", mac: myDevice.mac });
    } catch (err) {
      res.status(500).json({ message: "خطأ في قاعدة البيانات" });
    }
  } else {
    res
      .status(400)
      .json({ message: "تعذر التعرف على عنوان MAC. تأكد من الاتصال بالشبكة." });
  }
});

// 4️⃣ API الفحص الشامل (Admin Scan)
router.get("/scan", async (req, res) => {
  try {
    console.log("🔍 Starting network scan...");
    const myIP = getLocalIP();
    const subnet = myIP.substring(0, myIP.lastIndexOf("."));

    // تنفيذ الفحص النشط
    await populateArpTable(subnet);
    await new Promise((r) => setTimeout(r, 500));

    // قراءة الأجهزة المتصلة
    const devices = await find();

    // جلب كل التسجيلات من قاعدة البيانات لربطها
    const allRegistrations = await DeviceMap.find({});

    // تحويل المصفوفة إلى Map للسرعة
    const regMap = {};
    allRegistrations.forEach((r) => (regMap[r.mac] = r.studentId));

    const enrichedDevices = devices.map((device, index) => ({
      id: index + 1,
      name: device.name || "Unknown",
      ip: device.ip,
      mac: device.mac,
      studentId: regMap[device.mac] || "غير مسجل",
      type: determineDeviceType(device.name),
      status: "online",
    }));

    res.json({ count: enrichedDevices.length, devices: enrichedDevices });
  } catch (error) {
    console.error("Scan Error:", error);
    res.status(500).json({ error: "فشل الفحص" });
  }
});

export default router;
