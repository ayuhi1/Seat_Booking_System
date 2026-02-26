import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearUser } from "../services/auth";
import CalendarSidebar from "../components/CalendarSidebar";
import BookingPanel from "../components/BookingPanel";
import { getUserBookings, cancelBooking } from "../services/api";
import { FiLogOut, FiUser } from "react-icons/fi";

function Dashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => getUser(), []);
  const [selected, setSelected] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [panelRefresh, setPanelRefresh] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user]);

  async function loadBookings() {
    try {
      const data = await getUserBookings(user.userId, true);
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    }
  }

  async function onCancelDate(iso) {
    try {
      setBusy(true);
      await cancelBooking(user.userId, iso);
      await loadBookings();
      setPanelRefresh((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  function onLogout() {
    clearUser();
    navigate("/login", { replace: true });
  }

  return (
    <div className="container py-4">
      <div className="dashboard-header d-flex justify-content-between align-items-center mb-4 shadow-sm">
        <div>
          <div className="h5 m-0">Seat Booking Dashboard</div>
          <div className="text-muted">Welcome back, {user?.name || user?.email}</div>
        </div>
        <button className="btn btn-outline-danger" onClick={onLogout}>
          <FiLogOut className="me-2" /> Logout
        </button>
      </div>
      <div className="row g-4 align-items-stretch">
        <div className="col-12 col-lg-4">
          <CalendarSidebar value={selected} onChange={setSelected} />
        </div>
        <div className="col-12 col-lg-8">
          <div className="d-flex flex-column justify-content-center h-100">
            <BookingPanel selectedDate={selected} refreshToken={panelRefresh} />
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm rounded-4 lift-hover">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-light border shadow-sm d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                  <FiUser className="text-muted" size={24} />
                </div>
                <div className="ms-3">
                  <div className="fw-semibold">{user?.name || "Profile"}</div>
                  <div className="text-muted small">{user?.email}</div>
                </div>
              </div>
              <div className="small text-muted">Batch</div>
              <div className="mb-2">{user?.batch}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm rounded-4 lift-hover">
            <div className="card-body">
              <h6 className="mb-2">My Bookings</h6>
              {bookings.length === 0 && <p className="text-muted mb-0">No bookings</p>}
              {bookings.length > 0 && (
                <ul className="list-unstyled mb-0">
                  {bookings.map((b) => (
                    <li key={`${b.date}-${b.seatType}`} className="d-flex justify-content-between align-items-center py-2">
                      <div>
                        <span>{new Date(b.date).toLocaleDateString()}</span>
                        <span className="ms-2 badge bg-secondary text-uppercase">{b.seatType}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger lift-hover"
                        disabled={busy}
                        onClick={() => onCancelDate(new Date(b.date).toISOString())}
                      >
                        {busy ? "..." : "Cancel"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
