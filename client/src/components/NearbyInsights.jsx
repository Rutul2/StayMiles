import { useState } from "react";
import useFetch from "../hooks/useFetch.js";
import { formatDistance } from "../utils/format.js";

const TABS = [
  { key: "grocery", label: "Grocery" },
  { key: "medical", label: "Medical" },
  { key: "food", label: "Food" },
  { key: "transport", label: "Transport" },
];

export default function NearbyInsights({ listingId }) {
  const [tab, setTab] = useState("grocery"); // which category is showing
  const [k, setK] = useState(3);             // how many places to show

  // Changing k changes the params, so useFetch calls the API again: GET /listings/:id/nearby?k=5
  const { data, loading, error, reload } = useFetch(`/listings/${listingId}/nearby`, { k });

  const places = data?.places?.[tab] || [];
  const tabLabel = TABS.find((t) => t.key === tab).label.toLowerCase();

  return (
    <section className="section">
      <h2>What's nearby</h2>
      <p className="muted">
        The closest places to this stay{data ? `, within ${data.radius / 1000} km` : ""}. Data from OpenStreetMap.
      </p>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? "tab active" : "tab"}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {data && <span className="tab-count">{data.places[t.key].length}</span>}
            </button>
          ))}
        </div>

        <label className="inline-field">
          Show top
          <select value={k} onChange={(e) => setK(Number(e.target.value))}>
            {[3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {loading && !data && <p className="status">Finding places nearby…</p>}

      {error && (
        <div className="notice notice-error">
          <span>{error}</span>
          <button className="btn btn-outline" onClick={reload}>Try again</button>
        </div>
      )}

      {data && (
        <ul className={loading ? "place-list is-loading" : "place-list"}>
          {places.length === 0 && (
            <li className="muted">No {tabLabel} places found within {data.radius / 1000} km.</li>
          )}
          {places.map((place) => (
            <li key={place.id} className="place">
              <div>
                <p className="place-name">{place.name}</p>
                <p className="muted">{place.type}</p>
              </div>
              <span className="place-distance">{formatDistance(place.distance)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
