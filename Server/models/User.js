import mongoose from "mongoose";

const BATCHES = ["B1", "B2"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    batch: { type: String, required: true, enum: BATCHES }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
