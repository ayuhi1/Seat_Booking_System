import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../services/api";
import { getUser, setUser } from "../services/auth";
import { Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (u) navigate("/dashboard", { replace: true });
  }, [navigate]);

  function validate() {
    if (!email || !employeeId) {
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
      const data = await apiLogin(email, employeeId);
      setUser({ userId: data.userId, email: data.email, employeeId: data.employeeId, batch: data.batch, name: data.name });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="col-12 col-sm-10 col-md-6 col-lg-4">
        <div className="card shadow-lg rounded-4">
          <div className="card-body">
            <h5 className="card-title text-center mb-4">Sign In</h5>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={onSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your employee ID"
                  required
                />
              </div>
              <div className="d-grid">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Signing in...</> : "Login"}
                </button>
              </div>
            </form>
          </div>
          <div className="mt-3 mb-3 text-center">
            <small>
              New here? <Link to="/register">Create an account</Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
