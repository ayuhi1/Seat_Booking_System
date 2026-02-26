import express from "express";
import {bookSeat,getAvailability,cancelBooking,getStats} from "../Controller/bookingController.js";
const router= express.Router();

router.post("/book",bookSeat);
router.get("/available",getAvailability);
router.delete("/book",cancelBooking);
router.get("/stats",getStats);
export default router;