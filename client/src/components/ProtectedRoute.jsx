import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const stored = localStorage.getItem("sb_user");
  if (!stored) return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;
