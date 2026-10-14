import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get("search") || "");

  // The search text lives in the URL (/?search=goa), so results can be shared and survive a refresh
  const handleSearch = (e) => {
    e.preventDefault();
    const text = term.trim();
    navigate(text ? `/?search=${encodeURIComponent(text)}` : "/");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">StayMiles</Link>

        <form className="search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by city, country or title"
            aria-label="Search stays"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <nav className="nav-links">
          <Link to="/listings/new">Add your place</Link>
          {user ? (
            <>
              <span className="nav-user">{user.username}</span>
              <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup" className="btn btn-outline">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
