import mongoose from "mongoose";
import Booking from "../Models/Booking.js";
import SeatInventory from "../Models/SeatInventory.js";
import getWorkingDate from "./scheduleDays.js";

function toUTCDateOnly(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

function isBufferWindow(now, selectedDate) {
  const openPrevDayHour = 15; // 3 PM
  const closeSameDayHour = 12; // 12 PM

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(selectedDate);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((target - today) / 86400000);

  // Tomorrow booking allowed after 3 PM today
  if (diffDays === 1) {
    const start = new Date(today);
    start.setHours(openPrevDayHour, 0, 0, 0);
    return now >= start;
  }

  // Same-day booking allowed before 12 PM
  if (diffDays === 0) {
    const end = new Date(target);
    end.setHours(closeSameDayHour, 0, 0, 0);
    return now < end;
  }

  return false;
}

async function ensureInventory(date) {
  const d = toUTCDateOnly(date);
  let inv = await SeatInventory.findOne({ date: d });
  if (!inv) {
    try {
      inv = await SeatInventory.create({ date: d });
    } catch {
      inv = await SeatInventory.findOne({ date: d });
    }
  }
  return inv;
}

function computeSeatTypeForUser(date, userBatch) {
  const dayBatch = getWorkingDate(date);
  if (!dayBatch) return { allowed: false, reason: "Weekend" };
  if (dayBatch === userBatch) return { allowed: true, seatType: "designated" };
  return { allowed: true, seatType: "buffer" };
}

async function bookSeatAtomic(user, date) {
  const selectedDate = toUTCDateOnly(date);
  const now = new Date();
  const seatTypeDecision = computeSeatTypeForUser(selectedDate, user.batch);
  if (!seatTypeDecision.allowed) {
    throw new Error("Office is closed on weekends");
  }
  // Fast duplicate check to avoid capacity claims when user already booked
  const already = await Booking.findOne({ user: user._id, date: selectedDate, status: "booked" }).lean();
  if (already) {
    throw new Error("You have already booked a seat for this date");
  }
  const seatType = seatTypeDecision.seatType;
  if (seatType === "designated") {
    const today = toUTCDateOnly(new Date());
    const diffDays = Math.floor((selectedDate - today) / 86400000);
    if (diffDays > 14) {
      throw new Error("Designated seats can be booked only for the next 2 weeks");
    }
  }
  if (seatType === "buffer" && !isBufferWindow(now, selectedDate)) {
    throw new Error("Buffer seats can be booked from previous day 3 PM until 12 PM on the day");
  }

  let session;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const inv = await ensureInventory(selectedDate);
      const q = { _id: inv._id };
      let update;
      if (seatType === "designated") {
        q.designatedBooked = { $lt: inv.designatedCapacity };
        update = { $inc: { designatedBooked: 1 } };
      } else {
        const effectiveBufferCapacity = inv.bufferBaseCapacity + inv.designatedReleasedToBuffer;
        q.bufferBooked = { $lt: effectiveBufferCapacity };
        update = { $inc: { bufferBooked: 1 } };
      }
      const upd = await SeatInventory.findOneAndUpdate(q, update, { new: true, session });
      if (!upd) throw new Error("No seats available");

      await Booking.create(
        [
          {
            user: user._id,
            userBatch: user.batch,
            date: selectedDate,
            status: "booked",
            seatType
          }
        ],
        { session }
      );
    });
  } catch (err) {
    if (String(err?.message || "").includes("Transaction numbers are only allowed") || err?.code === 20) {
      await ensureInventory(selectedDate);
      let claimQuery;
      let incClaim;
      if (seatType === "designated") {
        claimQuery = {
          date: selectedDate,
          $expr: { $lt: ["$designatedBooked", "$designatedCapacity"] }
        };
        incClaim = { $inc: { designatedBooked: 1 } };
      } else {
        claimQuery = {
          date: selectedDate,
          $expr: { $lt: ["$bufferBooked", { $add: ["$bufferBaseCapacity", "$designatedReleasedToBuffer"] }] }
        };
        incClaim = { $inc: { bufferBooked: 1 } };
      }
      const claimed = await SeatInventory.findOneAndUpdate(claimQuery, incClaim, { new: true });
      if (!claimed) throw new Error("No seats available");
      try {
        await Booking.create({
          user: user._id,
          userBatch: user.batch,
          date: selectedDate,
          status: "booked",
          seatType
        });
      } catch (createErr) {
        const rollback = seatType === "designated" ? { $inc: { designatedBooked: -1 } } : { $inc: { bufferBooked: -1 } };
        await SeatInventory.updateOne({ date: selectedDate }, rollback);
        if (createErr && createErr.code === 11000) {
          throw new Error("You have already booked a seat for this date");
        }
        throw createErr;
      }
    } else {
      if (err && err.code === 11000) {
        throw new Error("You have already booked a seat for this date");
      }
      throw err;
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

async function releaseSeatAtomic(userId, date) {
  const selectedDate = toUTCDateOnly(date);
  let session;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const booking = await Booking.findOne({ user: userId, date: selectedDate, status: "booked" }).session(session);
      if (!booking) throw new Error("No booking found for this user on this date");
      const inv = await ensureInventory(selectedDate);
      const inc = {};
      if (booking.seatType === "designated") {
        inc.designatedBooked = -1;
        inc.designatedReleasedToBuffer = 1;
        inc.designatedCapacity = -1; // move capacity from designated to buffer pool
      } else {
        inc.bufferBooked = -1;
      }
      await SeatInventory.updateOne({ _id: inv._id }, { $inc: inc }).session(session);
      booking.status = "cancelled";
      await booking.save({ session });
    });
  } catch (err) {
    if (String(err?.message || "").includes("Transaction numbers are only allowed") || err?.code === 20) {
      const booking = await Booking.findOne({ user: userId, date: selectedDate, status: "booked" });
      if (!booking) throw new Error("No booking found for this user on this date");
      await ensureInventory(selectedDate);
      const inc = booking.seatType === "designated"
        ? { $inc: { designatedBooked: -1, designatedReleasedToBuffer: 1, designatedCapacity: -1 } }
        : { $inc: { bufferBooked: -1 } };
      await SeatInventory.updateOne({ date: selectedDate }, inc);
      try {
        booking.status = "cancelled";
        await booking.save();
      } catch (saveErr) {
        const rollback = booking.seatType === "designated"
          ? { $inc: { designatedBooked: 1, designatedReleasedToBuffer: -1, designatedCapacity: 1 } }
          : { $inc: { bufferBooked: 1 } };
        await SeatInventory.updateOne({ date: selectedDate }, rollback);
        throw saveErr;
      }
    } else {
      throw err;
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

async function availability(date) {
  const d = toUTCDateOnly(date);
  const inv = await ensureInventory(d);
  const designatedRemaining = Math.max(inv.designatedCapacity - inv.designatedBooked, 0);
  const bufferCapacity = inv.bufferBaseCapacity + inv.designatedReleasedToBuffer;
  const bufferRemaining = Math.max(bufferCapacity - inv.bufferBooked, 0);
  return {
    designatedRemaining,
    bufferRemaining,
    designatedCapacity: inv.designatedCapacity,
    bufferCapacity
  };
}

function eligibility(date, user) {
  const d = toUTCDateOnly(date);
  const seatTypeDecision = computeSeatTypeForUser(d, user.batch);
  if (!seatTypeDecision.allowed) {
    return { eligible: false, reason: "Weekend" };
  }
  if (seatTypeDecision.seatType === "designated") {
    const today = toUTCDateOnly(new Date());
    const diffDays = Math.floor((d - today) / 86400000);
    if (diffDays > 14) {
      return { eligible: false, seatType: "designated", reason: "Beyond 2-week window" };
    }
    return { eligible: true, seatType: "designated" };
  }
  const now = new Date();
  const ok = isBufferWindow(now, d);
  return ok
    ? { eligible: true, seatType: "buffer" }
    : { eligible: false, seatType: "buffer", reason: "Buffer seats can be booked from previous day 3 PM until 12 PM on the day" };
}

export { bookSeatAtomic, releaseSeatAtomic, availability, eligibility, toUTCDateOnly };
