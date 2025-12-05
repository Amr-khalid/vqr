import os from "os";
import { exec } from "child_process";
import find from "local-devices";

// الحصول على IP السيرفر المحلي
export function getLocalIP() {
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

// دالة Ping لجهاز واحد
export function pingDevice(ip) {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    // Windows: -n 1 -w 200 | Linux/Mac: -c 1 -W 1
    const cmd = isWin ? `ping -n 1 -w 200 ${ip}` : `ping -c 1 -W 1 ${ip}`;
    exec(cmd, (error, stdout, stderr) => {
      resolve(); // لا يهمنا الناتج، المهم أننا أرسلنا الباكيت
    });
  });
}

// دالة الفحص النشط (Active Sweep) لتعبئة جدول ARP
export async function populateArpTable(subnet) {
  console.log(`📡 Performing system PING sweep on ${subnet}.x ...`);
  const batchSize = 64; // معالجة 64 جهاز في نفس الوقت للسرعة

  for (let i = 1; i < 255; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && i + j < 255; j++) {
      const ip = `${subnet}.${i + j}`;
      batch.push(pingDevice(ip));
    }
    await Promise.all(batch);
  }
}

// تخمين نوع الجهاز بناءً على الاسم
export function determineDeviceType(name) {
  if (!name) return "generic";
  const n = name.toLowerCase();
  if (n.includes("iphone") || n.includes("android")) return "mobile";
  if (n.includes("macbook") || n.includes("desktop") || n.includes("win"))
    return "laptop";
  if (n.includes("tv")) return "tv";
  if (n.includes("router") || n.includes("gateway")) return "router";
  return "generic";
}
