// Same rules as before: 18% GST on the stay + a flat service fee.
export const GST_RATE = 0.18;
export const SERVICE_FEE = 100;

export function calculatePrice(pricePerNight, nights) {
  const base = pricePerNight * nights;
  const tax = Math.round(base * GST_RATE);
  return { base, tax, serviceFee: SERVICE_FEE, total: base + tax + SERVICE_FEE };
}
