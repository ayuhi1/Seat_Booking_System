import User from "../Models/User.js";

async function login(req, res) {
  try {
    const { email, batch, name } = req.body;
    if (!email || !batch) {
      return res.status(400).json({ success: false, message: "email and batch are required" });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({ email: normalizedEmail, batch, name: name || normalizedEmail.split("@")[0] });
    } else if (user.batch !== batch) {
      user.batch = batch;
      await user.save();
    }
    return res.status(200).json({ success: true, userId: user._id.toString(), email: user.email, batch: user.batch, name: user.name });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

export { login };
