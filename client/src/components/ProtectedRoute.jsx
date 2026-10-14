import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Wraps pages that need a login. Not logged in -> send to /login, and remember where they wanted to go.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="status container">Loading…</p>; // still checking the saved token
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}
