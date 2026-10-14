const axios = require("axios");
const ExpressError = require("./expressError.js");

// Turns an address like "Surat, India" into { lat, lng } using OpenStreetMap's Nominatim.
// Nominatim requires a User-Agent header; requests without one are often rejected.
async function geocode(address) {
    try {
        const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: { q: address, format: "json", limit: 1 },
            headers: { "User-Agent": "StayMiles/2.0 (student project)" },
            timeout: 8000,
        });
        if (!data.length) return null; // address not found
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (err) {
        console.error("Geocoding failed:", err.message);
        throw new ExpressError(502, "The map service is busy right now. Please try again in a moment.");
    }
}

module.exports = geocode;
