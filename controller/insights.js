// The three headline features. Each one is its own endpoint so the page loads fast
// and React can show a loading state for each card independently.
const Listing = require("../models/listing.js");
const geocode = require("../utils/geocode.js");
const getNearbyData = require("../utils/nearBy.js");
const generateSummary = require("../utils/aiSummary.js");
const getSafetyScore = require("../utils/safetyScore.js");
const ExpressError = require("../utils/expressError.js");

// Reads a number from the query string and keeps it between min and max
const clampInt = (value, fallback, min, max) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

// GET /api/listings/:id/nearby?k=3&radius=2000
module.exports.nearby = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError(404, "This listing does not exist");

    const k = clampInt(req.query.k, 3, 1, 10);
    const radius = clampInt(req.query.radius, 2000, 500, 5000);

    // Coordinates are looked up once, then saved on the listing
    if (!listing.coordinates?.lat) {
        const coords = await geocode(`${listing.location}, ${listing.country}`);
        if (!coords) throw new ExpressError(422, "We couldn't find this address on the map");
        await Listing.updateOne({ _id: listing._id }, { coordinates: coords });
        listing.coordinates = coords;
    }

    const places = await getNearbyData(listing.coordinates.lat, listing.coordinates.lng, { radius, k });
    res.json({ radius, k, places });
};

// GET /api/listings/:id/summary
module.exports.summary = async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("reviews", "rating comment");
    if (!listing) throw new ExpressError(404, "This listing does not exist");

    if (listing.aiSummary) return res.json(listing.aiSummary); // cached, no Gemini call

    const result = await generateSummary(listing.reviews);
    if (result.source === "gemini") {
        await Listing.updateOne({ _id: listing._id }, { aiSummary: result });
    }
    res.json(result);
};

// GET /api/listings/:id/safety
module.exports.safety = async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("reviews", "rating comment");
    if (!listing) throw new ExpressError(404, "This listing does not exist");

    if (listing.safety) return res.json(listing.safety);

    const result = await getSafetyScore(listing.reviews);
    if (result.source === "gemini") {
        await Listing.updateOne({ _id: listing._id }, { safety: result });
    }
    res.json(result);
};
