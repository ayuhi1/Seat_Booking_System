import getWorkingDate from "../services/scheduleDays.js";
import Booking from "../Models/Booking.js";
import User from "../Models/User.js";

const TOTAL_SEATS = 40;

async function bookSeat(req, res) {
    try {
        const { userId, date } = req.body;
        if (!userId || !date) {
            return res.status(400).json({
                success: false,
                message: "userId and date are required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const today = new Date();
        today.setHours(0,0,0,0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0,0,0,0);
        if (selectedDate < today) {
            return res.status(400).json({ success: false, message: "Cannot book for past dates" });
        }

        const allowedBatch = getWorkingDate(selectedDate);
        if (!allowedBatch) {
            return res.status(400).json({ success: false, message: "Office is closed on weekends" });
        }
        if (allowedBatch !== user.batch) {
            return res.status(403).json({ success: false, message: "Your batch is not allowed to work on this day" });
        }

        const existing = await Booking.findOne({ user: user._id, date: selectedDate, status: "booked" }).lean();
        if (existing) {
            return res.status(400).json({ success: false, message: "You have already booked a seat for this date" });
        }

        const bookedSeats = await Booking.countDocuments({ date: selectedDate, status: "booked" });
        if (bookedSeats >= TOTAL_SEATS) {
            return res.status(400).json({ success: false, message: "All seats are booked for this date" });
        }

        await Booking.create({
            user: user._id,
            userBatch: user.batch,
            date: selectedDate,
            status: "booked"
        });

        return res.status(200).json({ success: true, message: "Seat booked successfully" });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

async function cancelBooking(req, res) {
    try {
        const { userId, date } = req.body;

        if (!userId || !date) {
            return res.status(400).json({
                success: false,
                message: "userId and date are required"
            });
        }

        const selectedDate = new Date(date);
        selectedDate.setHours(0,0,0,0);
        const booking = await Booking.findOne({ user: userId, date: selectedDate, status: "booked" });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "No booking found for this user on this date"
            });
        }

        booking.status = "cancelled";
        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}


// 🔹 GET AVAILABILITY API
async function getAvailability(req, res) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date query parameter is required"
            });
        }

        const selectedDate = new Date(date);
        selectedDate.setHours(0,0,0,0);

        const bookedSeats = await Booking.countDocuments({ date: selectedDate, status: "booked" });
        const remainingSeats = TOTAL_SEATS - bookedSeats;

        return res.status(200).json({
            success: true,
            totalSeats: TOTAL_SEATS,
            bookedSeats,
            remainingSeats
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}
async function getStats(req, res) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date query parameter is required"
            });
        }

        const selectedDate = new Date(date);
        selectedDate.setHours(0,0,0,0);

        const totalBookings = await Booking.countDocuments({ date: selectedDate, status: "booked" });
        const B1Bookings = await Booking.countDocuments({ date: selectedDate, status: "booked", userBatch: "B1" });
        const B2Bookings = await Booking.countDocuments({ date: selectedDate, status: "booked", userBatch: "B2" });

        return res.status(200).json({
            success: true,
            totalBookings,
            B1Bookings,
            B2Bookings
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

// 🔹 Export at bottom
export { bookSeat, getAvailability, cancelBooking, getStats };
