import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import bookingRoutes from "./Routes/bookingRoutes.js";
import authRoutes from "./Routes/authRoutes.js";

const app = express();
app.use(express.json());

dotenv.config();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

const corsOptions = {
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};
app.use(cors(corsOptions));


const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/seat_booking_system";

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB connected");

    app.use("/api", bookingRoutes);
    app.use("/api/auth", authRoutes);
    
    app.get("/", (req, res) => {
      res.send("Server running");
    });
    app.get("/healthz", (req, res) => {
      res.json({ status: "ok" });
    });
  
    const PORT = process.env.PORT || 5000;
  
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
