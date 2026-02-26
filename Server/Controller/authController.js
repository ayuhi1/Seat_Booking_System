import User from "../Models/User.js";

async function login(req, res) {
  try {
    const { email, employeeId } = req.body;
    if (!email || !employeeId) {
      return res.status(400).json({ success: false, message: "email and employeeId are required" });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedEmpId = String(employeeId).trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.findOne({ employeeId: normalizedEmpId });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please register." });
    }
    if (user.employeeId && user.employeeId !== normalizedEmpId) {
      return res.status(401).json({ success: false, message: "Employee ID does not match" });
    }
    if (!user.employeeId) {
      user.employeeId = normalizedEmpId;
      await user.save();
    }
    return res.status(200).json({
      success: true,
      userId: user._id.toString(),
      email: user.email,
      employeeId: user.employeeId,
      batch: user.batch,
      name: user.name
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function register(req, res) {
  try {
    const { email, batch, name, employeeId } = req.body;
    if (!email || !batch || !name || !employeeId) {
      return res.status(400).json({ success: false, message: "name, email, employeeId and batch are required" });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedEmpId = String(employeeId).trim();
    const byEmail = await User.findOne({ email: normalizedEmail });
    const byEmp = await User.findOne({ employeeId: normalizedEmpId });
    if (byEmp && (!byEmail || String(byEmp._id) !== String(byEmail._id))) {
      return res.status(409).json({ success: false, message: "Employee ID already in use" });
    }
    if (byEmail) {
      if (byEmail.employeeId && byEmail.employeeId !== normalizedEmpId) {
        return res.status(409).json({ success: false, message: "Email already registered with a different employee ID" });
      }
      byEmail.name = name;
      byEmail.batch = batch;
      byEmail.employeeId = normalizedEmpId;
      await byEmail.save();
      return res.status(200).json({ success: true, userId: byEmail._id.toString(), email: byEmail.email, employeeId: byEmail.employeeId, batch: byEmail.batch, name: byEmail.name });
    }
    const user = await User.create({ email: normalizedEmail, employeeId: normalizedEmpId, batch, name });
    return res.status(201).json({ success: true, userId: user._id.toString(), email: user.email, employeeId: user.employeeId, batch: user.batch, name: user.name });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

export { login, register };
