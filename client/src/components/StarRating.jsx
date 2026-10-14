// Two modes in one component:
//  - read-only:  <StarRating value={4} />
//  - clickable:  <StarRating value={rating} onChange={setRating} />
export default function StarRating({ value, onChange }) {
  if (!onChange) {
    return (
      <span className="stars" aria-label={`${value} out of 5 stars`}>
        {"★".repeat(value)}
        <span className="stars-empty">{"★".repeat(5 - value)}</span>
      </span>
    );
  }

  return (
    <div className="star-input" role="group" aria-label="Choose a rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={n <= value ? "on" : ""}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={n === value}
        >
          ★
        </button>
      ))}
    </div>
  );
}
