import { Schema, model } from "mongoose";
import mongoose from "mongoose";

const userSchema = new Schema({
  name: String,
  phone: String,
  email: String,
  password: String,
 list:[{type:mongoose.Schema.Types.ObjectId,ref:"ScanRecord"}],
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}
});
export default model("userQR", userSchema);
