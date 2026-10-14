import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate } from "../utils/format.js";
import StarRating from "./StarRating.jsx";

// Review list + "write a review" form. onChange() tells the page to reload after a change.
export default function Reviews({ listingId, reviews, onChange }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/listings/${listingId}/reviews`, { rating, comment });
      setComment("");
      setRating(5);
      onChange();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await api.delete(`/listings/${listingId}/reviews/${reviewId}`);
      onChange();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      {user ? (
        <form className="review-form" onSubmit={handleSubmit}>
          <h3>Write a review</h3>
          <StarRating value={rating} onChange={setRating} />
          <label className="field">
            <span>Your comment</span>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell future guests about the stay, the area and how safe you felt"
              required
              minLength={3}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? "Posting…" : "Post review"}
          </button>
        </form>
      ) : (
        <p className="muted"><Link to="/login">Log in</Link> to write a review.</p>
      )}

      <h3 className="small-heading">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</h3>
      {reviews.length === 0 && <p className="muted">No reviews yet. Be the first to share your experience.</p>}

      <ul className="review-list">
        {[...reviews].reverse().map((review) => (
          <li key={review._id} className="review">
            <div className="review-head">
              <span className="avatar">{(review.author?.username || "?")[0].toUpperCase()}</span>
              <div>
                <p className="review-author">{review.author?.username || "Anonymous"}</p>
                <p className="muted">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <StarRating value={review.rating} />
            <p>{review.comment}</p>
            {/* Only the author sees Delete (the server checks this again) */}
            {user && review.author?._id === user.id && (
              <button className="link-button" onClick={() => handleDelete(review._id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
