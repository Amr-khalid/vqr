// models/Student.ts
import { Schema, model } from "mongoose";
const StudentSchema = new Schema({
  studentId: { type: String, required: true, unique: true },
  userId:{type:Schema.Types.ObjectId,ref:"User"},
  name: String,
  section: String,
  attendance: Number,
  team: String,
  email: String,
  course: String,
  createdAt: { type: Date, default: Date.now },
});
export default model("Student", StudentSchema);

