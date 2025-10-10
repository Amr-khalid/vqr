import { Router } from "express";
import ScanRecord from "../models/ScanRecord.js";
import { verifyPayload } from "../utils/hmac.js";
import { saveToExcel } from "../utils/excel.js";

const router = Router();

router.post("/", async (req, res) => {
  const { payload, deviceId, location } = req.body;
  if (!payload) return res.status(400).send("no payload");

  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return res.status(400).send("invalid payload");
  }

  const { sig } = parsed;
  if (!sig) return res.status(400).send("no signature");

  const { sig: _s, ...withoutSig } = parsed;
  const computedOk = verifyPayload(
    JSON.stringify(withoutSig),
    process.env.HMAC_SECRET || "default_secret",
    sig
  );
  if (!computedOk) return res.status(403).send("invalid signature");

  try {
    const courseName = withoutSig.course  || "----";

    // ✅ بحث دقيق حسب الطالب والمادة
    const existing = await ScanRecord.findOne({
      studentId: withoutSig.studentId,
      course: courseName,
      userId: withoutSig.userId
    });

    let rec;
    if (existing) {
      // ✅ تحديث الحضور
      existing.attendance = (existing.attendance || 0) + 1;
      existing.scannedAt = new Date();
      await existing.save();
      rec = existing;
    } else {
      // 🆕 إنشاء سجل جديد
      rec = new ScanRecord({
        studentId: withoutSig.studentId,
        name: withoutSig.name,
        section: withoutSig.section,
        type: withoutSig.type,
        team: withoutSig.team,
        email: withoutSig.email,
        attendance: 1,
        userId: withoutSig.userId,
        scannedAt: new Date(),
        course: courseName,
        deviceId,
        location,
      });
      await rec.save();
    }

    // 💾 حفظ في Excel
    await saveToExcel({
      studentId: rec.studentId,
      name: rec.name,
      section: rec.section,
      type: rec.type,
      email: rec.email,
      team: rec.team,
      attendance: rec.attendance,
      scannedAt: rec.scannedAt,
      userId: rec.userId,
      course: rec.course,
      deviceId: rec.deviceId,
      location: rec.location,
    });

    return res.json({
      ok: true,
      message: existing
        ? `🔁 تم تحديث السجل وزيادة عدد الحضور (${rec.attendance})`
        : "✅ تم إنشاء سجل جديد داخل ملف Excel المحلي",
      record: rec,
    });
  } catch (err) {
    console.error("Error saving scan:", err);
    return res.status(500).send("Error saving scan");
  }
});

export default router;
