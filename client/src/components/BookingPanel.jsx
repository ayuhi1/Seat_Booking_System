import { useEffect, useMemo, useState } from "react";
import { getAvailability, getEligibility, bookSeat } from "../services/api";
import { getUser } from "../services/auth";

function toISODateUTC(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}

function toYMD(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function BookingPanel({ selectedDate, refreshToken = 0 }) {
  const user = useMemo(() => getUser(), []);
  const [designated, setDesignated] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [eligibility, setEligibility] = useState({ eligible: null, seatType: null, reason: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function refreshAvailability(dateYMD) {
    const data = await getAvailability(dateYMD);
    if (typeof data.designatedRemaining === "number" && typeof data.bufferRemaining === "number") {
      setDesignated(data.designatedRemaining);
      setBuffer(data.bufferRemaining);
    } else {
      setDesignated(null);
      setBuffer(null);
    }
  }

  async function refreshEligibility(dateYMD) {
    const data = await getEligibility(user.userId, dateYMD);
    setEligibility({ eligible: data.eligible, seatType: data.seatType, reason: data.reason || "" });
  }

  useEffect(() => {
    if (!selectedDate || !user) return;
    const ymd = toYMD(selectedDate);
    setError("");
    setSuccess("");
    refreshAvailability(ymd);
    refreshEligibility(ymd);
  }, [selectedDate, user, refreshToken]);

  async function onBook() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await bookSeat(user.userId, toISODateUTC(selectedDate));
      setSuccess("Seat booked successfully");
      const ymd = toYMD(selectedDate);
      await refreshAvailability(ymd);
    } catch (e) {
      setError(e.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  const total = designated !== null && buffer !== null ? Math.min(50, designated + buffer) : null;
  const accentClass =
    eligibility.seatType === "buffer" ? "panel-accent-yellow" :
    eligibility.seatType === "designated" ? "panel-accent-blue" : "panel-accent-neutral";

  return (
    <div className={`card shadow-sm rounded-4 lift-hover ${accentClass}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            {eligibility.seatType === "designated" && (
              <span className="badge bg-primary text-uppercase">DESIGNATED</span>
            )}
            {eligibility.seatType === "buffer" && (
              <span className="badge rounded-pill bg-warning text-dark">BUFFER MODE</span>
            )}
            <h5 className="m-0">Seat Booking</h5>
          </div>
          <div className="text-muted">{new Date(selectedDate).toLocaleDateString()}</div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="row g-3 align-items-stretch">
          <div className="col-12 col-md-4">
            <div className="stat-card rounded-4 shadow-sm h-100 border-0 stat-blue">
              <div className="small text-muted">Designated Remaining</div>
              <div className="fw-bold fs-3">{designated ?? "-"}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="stat-card rounded-4 shadow-sm h-100 border-0 stat-yellow">
              <div className="small text-muted">Buffer Remaining</div>
              <div className="fw-bold fs-3">{buffer ?? "-"}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="stat-card rounded-4 shadow-sm h-100 border-0 stat-green">
              <div className="small text-muted">Total Remaining</div>
              <div className="fw-bold fs-3">{total ?? "-"}</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="d-flex align-items-center gap-2">
            <div className="badge bg-primary text-uppercase">{eligibility.seatType || "-"}</div>
            {!eligibility.eligible && eligibility.reason && (
              <span className="text-danger small">{eligibility.reason}</span>
            )}
            {eligibility.eligible && eligibility.seatType === "buffer" && (
              <div className="alert alert-warning py-2 px-3 m-0 rounded-3">
                Buffer seat booking window policy applies (prev day 3 PM → same day 12 PM)
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 d-grid">
          <button className="btn btn-primary w-100 shadow-lg rounded-4 lift-hover" onClick={onBook} disabled={loading || !eligibility.eligible}>
            {loading ? "Processing..." : "Book Seat"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingPanel;
