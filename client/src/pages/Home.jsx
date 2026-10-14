import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useFetch from "../hooks/useFetch.js";
import ListingCard from "../components/ListingCard.jsx";

export default function Home() {
  const [params] = useSearchParams();
  const search = params.get("search") || "";
  const [withTax, setWithTax] = useState(false);

  // Fetches GET /api/listings?search=...  (runs again whenever `search` changes)
  const { data: listings, loading, error, reload } = useFetch("/listings", { search });

  return (
    <div className="container page">
      <div className="page-head">
        <h1>{search ? `Stays matching "${search}"` : "Explore stays"}</h1>
        <label className="switch">
          <input type="checkbox" checked={withTax} onChange={(e) => setWithTax(e.target.checked)} />
          <span>Show prices with GST</span>
        </label>
      </div>

      {loading && !listings && <p className="status">Loading stays…</p>}

      {error && (
        <div className="notice notice-error">
          <span>{error}</span>
          <button className="btn btn-outline" onClick={reload}>Try again</button>
        </div>
      )}

      {listings && listings.length === 0 && (
        <div className="empty">
          <h2>No stays found</h2>
          <p className="muted">Try a different city or country.</p>
          <Link className="btn btn-outline" to="/">Clear search</Link>
        </div>
      )}

      {listings && listings.length > 0 && (
        <div className="grid">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} withTax={withTax} />
          ))}
        </div>
      )}
    </div>
  );
}
