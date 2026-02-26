import express from "express";
import {bookSeat,getAvailability,cancelBooking,getEligibility,getUserBookings} from "../Controller/bookingController.js";
const router= express.Router();

router.post("/book",bookSeat);
router.get("/availability",getAvailability);
router.get("/available",getAvailability); // backward compat
router.delete("/release",cancelBooking);
router.delete("/book",cancelBooking); // backward compat
router.get("/eligibility",getEligibility);
router.get("/bookings",getUserBookings);
export default router;
