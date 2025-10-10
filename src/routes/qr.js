import { Router } from "express";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { signPayload } from "../utils/hmac.js";

const router = Router();

router.post("/generate", async (req, res) => {
  const { studentId, name, section, type, email ,team,course} = req.body;
  if (!studentId || !name || !email)
    return res.status(400).send("missing fields");

  const issuedAt = new Date().toISOString();
  const payload = { studentId, name, section, type, issuedAt, attendance: 0, email,team ,course};
  const secret = process.env.HMAC_SECRET || "default_secret";
  const sig = signPayload(JSON.stringify(payload), secret);
  const full = { ...payload, sig };
  

  try {
    const dataUrl = await QRCode.toDataURL(JSON.stringify(full), {
      errorCorrectionLevel: "M",
    });

    // إعداد SMTP Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER ,
        pass: process.env.EMAIL_PASS , // App Password
      },
    });

    // محتوى الإيميل
    const mailOptions = {
      from: `"QR System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `QR Code for ${name}`,
      html: `
        <p>مرحبًا ${name}،</p>
        <p>تم إنشاء QR Code الخاص بك بنجاح.</p>
        <p>الرجاء تحميل الصورة المرفقة أدناه.</p>
      `,
      attachments: [
        {
          filename: "qrcode.png",
          content: dataUrl.split("base64,")[1],
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.json({ ok: true, qrDataUrl: dataUrl, message: `QR sent to ${email}` });
  } catch (err) {
    console.error("Error generating/sending QR:", err);
    res.status(500).send("Error generating/sending QR");
  }
});

export default router;
