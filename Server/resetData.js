import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "./models/Booking.js";
import SeatInventory from "./models/SeatInventory.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/seat_booking_system";

async function reset() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected");

    const bookingResult = await Booking.deleteMany({});
    const inventoryResult = await SeatInventory.deleteMany({});

    console.log(`Bookings deleted: ${bookingResult.deletedCount}`);
    console.log(`SeatInventory deleted: ${inventoryResult.deletedCount}`);
    console.log("Data reset completed successfully");
  } catch (err) {
    console.error("Reset failed:", err?.message || err);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (closeErr) {
      console.error("Error closing connection:", closeErr?.message || closeErr);
    }
  }
}

reset();
