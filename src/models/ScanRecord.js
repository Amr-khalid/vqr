import { Schema, model } from "mongoose";
import mongoose from "mongoose";
const ScanRecordSchema = new Schema({
  studentId: String,
  name: String,
  section: String,
  type: String,
  email: String,
  team: String,
  course: String,
  attendance: Number,
  scannedAt: { type: Date, default: Date.now },
  location: String,
  deviceId: String,
  userId:{type:Schema.Types.ObjectId,ref:"User"}
});
export default model("ScanRecord", ScanRecordSchema);
