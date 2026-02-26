const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

async function json(req) {
  const res = await fetch(req.url, {
    method: req.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: req.body ? JSON.stringify(req.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const login = (email, employeeId) =>
  json({ url: `${API_BASE}/auth/login`, method: "POST", body: { email, employeeId } });

export const register = (name, email, employeeId, batch) =>
  json({ url: `${API_BASE}/auth/register`, method: "POST", body: { name, email, employeeId, batch } });

export const getAvailability = (date) =>
  json({ url: `${API_BASE}/available?date=${encodeURIComponent(date)}` });

export const getEligibility = (userId, date) =>
  json({ url: `${API_BASE}/eligibility?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}` });

export const bookSeat = (userId, date) =>
  json({ url: `${API_BASE}/book`, method: "POST", body: { userId, date } });

export const cancelBooking = (userId, date) =>
  json({ url: `${API_BASE}/book`, method: "DELETE", body: { userId, date } });

export const getUserBookings = (userId, includePast = false) =>
  json({ url: `${API_BASE}/bookings?userId=${encodeURIComponent(userId)}&includePast=${includePast ? "true" : "false"}` });
