import mongoose from "mongoose";
import User from "./User.js";

const BATCHES = ["B1", "B2"];
const BOOKING_STATUS = ["booked", "cancelled"];
const SEAT_TYPES = ["designated", "buffer"];

function toUTCDateOnly(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.floor(((d - yearStart) / 86400000 + 1) / 7) + 1;
}

function isBatchAllowed(date, batch) {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  const isWeek1 = getISOWeek(date) % 2 === 1;
  if (day >= 1 && day <= 3) return isWeek1 ? batch === "B1" : batch === "B2";
  if (day >= 4 && day <= 5) return isWeek1 ? batch === "B2" : batch === "B1";
  return false;
}

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userBatch: { type: String, required: true, enum: BATCHES },
    date: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUS, default: "booked" },
    seatType: { type: String, enum: SEAT_TYPES, required: true }
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, date: 1 }, { unique: true, partialFilterExpression: { status: "booked" } });
bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ date: 1, status: 1, seatType: 1 });

bookingSchema.pre("validate", async function () {
  this.date = toUTCDateOnly(this.date);
  const today = toUTCDateOnly(new Date());
  if (this.date < today) throw new Error("Cannot book past dates");
  const day = this.date.getUTCDay();
  if (day === 0 || day === 6) throw new Error("Cannot book weekends");

  if (!this.userBatch) {
    const u = await User.findById(this.user).select("batch");
    if (!u) throw new Error("User not found");
    this.userBatch = u.batch;
  }

  if (this.seatType === "designated") {
    if (!isBatchAllowed(this.date, this.userBatch)) {
      throw new Error("Batch not allowed for selected date");
    }
  }
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
