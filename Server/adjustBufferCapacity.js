import mongoose from "mongoose";
import dotenv from "dotenv";
import SeatInventory from "./models/SeatInventory.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/seat_booking_system";
const [, , argDate, argDelta] = process.argv;
function toUTCDateOnly(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}
const DEFAULT_DATE = new Date(Date.UTC(2026, 2, 6));
const TARGET_DATE = argDate ? toUTCDateOnly(argDate) : DEFAULT_DATE;
const DELTA = argDelta ? parseInt(argDelta, 10) : 1;

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    let inv = await SeatInventory.findOne({ date: TARGET_DATE });
    if (!inv) {
      inv = await SeatInventory.create({ date: TARGET_DATE });
    }
    const before = {
      bufferBaseCapacity: inv.bufferBaseCapacity,
      bufferBooked: inv.bufferBooked,
      designatedReleasedToBuffer: inv.designatedReleasedToBuffer
    };
    const cond = DELTA < 0 ? { bufferBaseCapacity: { $gte: Math.abs(DELTA) } } : {};
    await SeatInventory.updateOne({ _id: inv._id, ...cond }, { $inc: { bufferBaseCapacity: DELTA } });
    const afterDoc = await SeatInventory.findById(inv._id).lean();
    const after = {
      bufferBaseCapacity: afterDoc.bufferBaseCapacity,
      bufferBooked: afterDoc.bufferBooked,
      designatedReleasedToBuffer: afterDoc.designatedReleasedToBuffer
    };
    const beforeRemaining = Math.max(before.bufferBaseCapacity + before.designatedReleasedToBuffer - before.bufferBooked, 0);
    const afterRemaining = Math.max(after.bufferBaseCapacity + after.designatedReleasedToBuffer - after.bufferBooked, 0);
    console.log("Date:", TARGET_DATE.toISOString().slice(0, 10));
    console.log("Buffer base capacity:", before.bufferBaseCapacity, "->", after.bufferBaseCapacity);
    console.log("Remaining:", beforeRemaining, "->", afterRemaining);
    console.log("Updated successfully");
  } catch (err) {
    console.error("Update failed:", err?.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
