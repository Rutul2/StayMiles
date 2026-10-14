import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import ListingForm from "./pages/ListingForm.jsx";
import AuthPage from "./pages/AuthPage.jsx";

function NotFound() {
  return (
    <div className="container page center-text">
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for doesn't exist.</p>
      <Link className="btn btn-primary" to="/">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/listings/new" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
          <Route path="/listings/:id/edit" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">StayMiles</div>
      </footer>
    </>
  );
}
