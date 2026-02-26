import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as apiRegister } from "../services/api";
import { setUser } from "../services/auth";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [batch, setBatch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!name || !email || !employeeId || !batch) {
      setError("All fields are required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    setError("");
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const data = await apiRegister(name, email, employeeId, batch);
      setUser({ userId: data.userId, email: data.email, employeeId: data.employeeId, batch: data.batch, name: data.name });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="col-12 col-sm-10 col-md-6 col-lg-4">
        <div className="card shadow-lg rounded-4">
          <div className="card-body">
            <h5 className="card-title text-center mb-4">Create Account</h5>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={onSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Employee ID</label>
                <input className="form-control" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="form-label">Batch</label>
                <select className="form-select" value={batch} onChange={(e) => setBatch(e.target.value)} required>
                  <option value="">Select your batch</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                </select>
              </div>
              <div className="d-grid">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Creating...</> : "Register"}
                </button>
              </div>
              <div className="mt-3 text-center">
                <small>
                  Already have an account? <Link to="/login">Login</Link>
                </small>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
