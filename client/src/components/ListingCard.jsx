import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format.js";
import { GST_RATE } from "../utils/pricing.js";

export default function ListingCard({ listing, withTax }) {
  // "withTax" comes from the toggle on the Home page
  const price = withTax ? Math.round(listing.price * (1 + GST_RATE)) : listing.price;

  return (
    <Link to={`/listings/${listing._id}`} className="card">
      <div className="card-image">
        {listing.image?.url ? (
          <img src={listing.image.url} alt={listing.title} loading="lazy" />
        ) : (
          <div className="image-fallback" />
        )}
      </div>

      <div className="card-row">
        <h3>{listing.location}, {listing.country}</h3>
        <span className="rating">{listing.avgRating ? `★ ${listing.avgRating}` : "New"}</span>
      </div>
      <p className="muted card-title">{listing.title}</p>
      <p className="card-price">
        <strong>{formatPrice(price)}</strong> night {withTax && <span className="muted">incl. GST</span>}
      </p>
    </Link>
  );
}
