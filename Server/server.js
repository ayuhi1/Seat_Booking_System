import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import bookingRoutes from "./Routes/bookingRoutes.js";
import authRoutes from "./Routes/authRoutes.js";

const app = express();
app.use(express.json());

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/seat_booking_system";

await mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
});
console.log("MongoDB connected");

app.use("/api", bookingRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Server running");
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
