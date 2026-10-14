import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import useFetch from "../hooks/useFetch.js";
import NearbyInsights from "../components/NearbyInsights.jsx";
import ReviewSummary from "../components/ReviewSummary.jsx";
import SafetyScore from "../components/SafetyScore.jsx";
import PriceBreakdown from "../components/PriceBreakdown.jsx";
import Reviews from "../components/Reviews.jsx";

export default function ListingDetail() {
  const { id } = useParams(); // the :id from the URL /listings/:id
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: listing, loading, error, reload } = useFetch(`/listings/${id}`);
  const [reviewVersion, setReviewVersion] = useState(0);
  const [actionError, setActionError] = useState("");

  if (loading && !listing) return <p className="status container page">Loading…</p>;
  if (error) {
    return (
      <div className="container page">
        <div className="notice notice-error"><span>{error}</span><Link className="btn btn-outline" to="/">Back to home</Link></div>
      </div>
    );
  }

  const isOwner = user && listing.owner && user.id === listing.owner._id;

  // After a review is added or deleted: reload the listing AND refresh the two AI cards.
  // Changing a component's `key` makes React rebuild it, which makes it fetch again.
  const handleReviewsChanged = () => {
    reload();
    setReviewVersion((v) => v + 1);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await api.delete(`/listings/${id}`);
      navigate("/");
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  return (
    <div className="container page">
      <h1 className="detail-title">{listing.title}</h1>
      <p className="detail-sub">
        <span>{listing.avgRating ? `★ ${listing.avgRating} (${listing.reviewCount} reviews)` : "No reviews yet"}</span>
        <span className="muted">{listing.location}, {listing.country}</span>
      </p>

      {listing.image?.url && <img className="detail-image" src={listing.image.url} alt={listing.title} />}

      <div className="detail-layout">
        <div className="detail-main">
          <section className="section">
            <h2>Hosted by {listing.owner?.username || "a StayMiles host"}</h2>
            <p>{listing.description}</p>

            {isOwner && (
              <div className="actions">
                <Link className="btn btn-outline" to={`/listings/${id}/edit`}>Edit listing</Link>
                <button className="btn btn-danger" onClick={handleDelete}>Delete listing</button>
              </div>
            )}
            {actionError && <p className="error-text">{actionError}</p>}
          </section>

          {/* Feature 1: nearby places (Overpass API) */}
          <NearbyInsights listingId={id} />

          {/* Features 2 and 3: Gemini review summary and safety score */}
          <section className="section">
            <h2>Guest reviews</h2>
            <div className="insight-grid">
              <ReviewSummary key={`summary-${reviewVersion}`} listingId={id} />
              <SafetyScore key={`safety-${reviewVersion}`} listingId={id} />
            </div>
            <Reviews listingId={id} reviews={listing.reviews} onChange={handleReviewsChanged} />
          </section>
        </div>

        <aside className="detail-side">
          <PriceBreakdown price={listing.price} />
        </aside>
      </div>
    </div>
  );
}
