import { Schema, model } from "mongoose";

const DeviceMapSchema = new Schema({
  mac: { type: String, required: true, unique: true },
  studentId: { type: String, required: true }, // الرقم الجامعي
  lastIp: String, // آخر IP ظهر به
  deviceType: String, // نوع الجهاز المخمن
  lastSeen: { type: Date, default: Date.now },
});

export default model("DeviceMap", DeviceMapSchema);
