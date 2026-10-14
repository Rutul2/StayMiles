import { useState } from "react";
import { calculatePrice } from "../utils/pricing.js";
import { formatPrice } from "../utils/format.js";

export default function PriceBreakdown({ price }) {
  const [nights, setNights] = useState(1);

  // Keep nights between 1 and 30 even if the user types something odd
  const safeNights = Math.min(Math.max(Number(nights) || 1, 1), 30);
  const { base, tax, serviceFee, total } = calculatePrice(price, safeNights);

  return (
    <div className="panel booking-card">
      <p className="booking-price"><strong>{formatPrice(price)}</strong> <span className="muted">night</span></p>

      <label className="field">
        <span>Number of nights</span>
        <input type="number" min="1" max="30" value={nights} onChange={(e) => setNights(e.target.value)} />
      </label>

      <h3 className="small-heading">Price breakdown</h3>
      <dl className="price-list">
        <div><dt>{formatPrice(price)} x {safeNights} night{safeNights > 1 ? "s" : ""}</dt><dd>{formatPrice(base)}</dd></div>
        <div><dt>GST (18%)</dt><dd>{formatPrice(tax)}</dd></div>
        <div><dt>Service fee</dt><dd>{formatPrice(serviceFee)}</dd></div>
        <div className="total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
      </dl>
    </div>
  );
}
