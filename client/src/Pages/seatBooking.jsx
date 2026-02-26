import React, { useState, useEffect } from "react";

function SeatBooking() {
  const [date, setDate] = useState("");
  const [batch, setBatch] = useState("B1");
  const [userId, setUserId] = useState("");
  const [remainingSeats, setRemainingSeats] = useState(null);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:5000/api";

  const fetchAvailability = async (selectedDate) => {
    if (!selectedDate) return;

    const res = await fetch(`${API_URL}/availability?date=${selectedDate}`);
    const data = await res.json();

    if (data.success) {
      setRemainingSeats(data.remainingSeats);
    }
  };

  const handleBooking = async () => {
    if (!userId || !date) {
      setMessage("Please fill all fields");
      return;
    }

    const res = await fetch(`${API_URL}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, batch, date }),
    });

    const data = await res.json();
    setMessage(data.message);
    fetchAvailability(date);
  };

  const handleCancel = async () => {
    const res = await fetch(`${API_URL}/book`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, date }),
    });

    const data = await res.json();
    setMessage(data.message);
    fetchAvailability(date);
  };

  useEffect(() => {
    if (date) fetchAvailability(date);
  }, [date]);

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">Seat Booking System</h3>

        <div className="mb-3">
          <label className="form-label">Select Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Select Batch</label>
          <select
            className="form-select"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          >
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">User ID</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <button className="btn btn-primary w-100 mb-2" onClick={handleBooking}>
          Book Seat
        </button>

        <button className="btn btn-danger w-100 mb-3" onClick={handleCancel}>
          Cancel Booking
        </button>

        {remainingSeats !== null && (
          <div className="alert alert-info text-center">
            Remaining Seats: <strong>{remainingSeats}</strong>
          </div>
        )}

        {message && (
          <div className="alert alert-secondary text-center">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default SeatBooking;