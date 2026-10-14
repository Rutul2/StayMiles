export const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export const formatDistance = (meters) =>
  meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
