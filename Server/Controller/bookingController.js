import User from "../Models/User.js";
import Booking from "../Models/Booking.js";
import { bookSeatAtomic, releaseSeatAtomic, availability, eligibility, toUTCDateOnly } from "../services/bookingService.js";

async function bookSeat(req, res) {
  try {
    const { userId, date } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ success: false, message: "userId and date are required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const selectedDateUTC = toUTCDateOnly(date);
    const todayUTC = toUTCDateOnly(new Date());
    if (selectedDateUTC < todayUTC) {
      return res.status(400).json({ success: false, message: "Cannot book for past dates" });
    }
    await bookSeatAtomic(user, selectedDateUTC);
    return res.status(200).json({ success: true, message: "Seat booked successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

async function cancelBooking(req, res) {
  try {
    const { userId, date } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ success: false, message: "userId and date are required" });
    }
    await releaseSeatAtomic(userId, date);
    return res.status(200).json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

async function getAvailability(req, res) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "Date query parameter is required" });
    }
    const result = await availability(date);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

async function getEligibility(req, res) {
  try {
    const { userId, date } = req.query;
    if (!userId || !date) {
      return res.status(400).json({ success: false, message: "userId and date query parameters are required" });
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const result = eligibility(date, user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

export { bookSeat, getAvailability, cancelBooking, getEligibility };

async function getUserBookings(req, res) {
  try {
    const { userId, includePast } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    const query = { user: userId, status: "booked" };
    if (includePast !== "true") {
      query.date = { $gte: toUTCDateOnly(new Date()) };
    }
    const bookings = await Booking.find(query).select("date seatType userBatch status").sort({ date: 1 }).lean();
    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

export { getUserBookings };
