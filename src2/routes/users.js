import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const router = express.Router();

// نموذج المستخدم
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  list:[{type:mongoose.Schema.Types.ObjectId,ref:"ScanRecord"}],
  
});

const User = mongoose.model("UserQR", userSchema);

// ✅ التسجيل
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "يرجى إدخال البريد وكلمة المرور" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "المستخدم موجود بالفعل" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
    });
    await newUser.save();

    res.json({data:newUser, message: "✅ تم التسجيل بنجاح" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "❌ حدث خطأ أثناء التسجيل" });
  }
});

// ✅ تسجيل الدخول
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "كلمة المرور غير صحيحة" });
    res.json({ data: user, message: "✅ تم التسجيل بنجاح" });
 
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "❌ خطأ في تسجيل الدخول" });
  }
});

router.post("/addToList", async (req, res) => {
  try {
    const { userId, scanRecordId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    user.list.push(scanRecordId);
    await user.save();
    res.json({ message: "✅ تم اضافة المستخدم للقائمة", user });
  } catch (error) {
    console.error("Add to list error:", error);
    res.status(500).json({ message: "❌ حدث خطاء في اضافة المستخدم للقائمة" });
  }
})
export default router;
