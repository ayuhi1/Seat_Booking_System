import mongoose from "mongoose";

const seatInventorySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    designatedCapacity: { type: Number, default: 40 },
    bufferBaseCapacity: { type: Number, default: 10 },
    designatedBooked: { type: Number, default: 0 },
    bufferBooked: { type: Number, default: 0 },
    designatedReleasedToBuffer: { type: Number, default: 0 }
  },
  { timestamps: true }
);

seatInventorySchema.index({ date: 1 }, { unique: true });

const SeatInventory = mongoose.model("SeatInventory", seatInventorySchema);
export default SeatInventory;
