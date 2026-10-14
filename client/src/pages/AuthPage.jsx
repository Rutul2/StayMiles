import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

// One page for both login and signup. The `mode` prop decides which fields and text to show.
export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // One handler for all inputs: updates the field whose name matches the input
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignup) await signup(form.username, form.email, form.password);
      else await login(form.email, form.password);
      navigate(location.state?.from || "/"); // go back to the page that asked for login
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth-wrap">
      <form className="panel auth-card" onSubmit={handleSubmit}>
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>

        {isSignup && (
          <label className="field">
            <span>Username</span>
            <input name="username" value={form.username} onChange={handleChange} required minLength={3} autoComplete="username" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </label>

        {error && <p className="error-text" role="alert">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
        </button>

        <p className="muted center-text">
          {isSignup ? "Already have an account? " : "New to StayMiles? "}
          <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Sign up"}</Link>
        </p>
      </form>
    </div>
  );
}
