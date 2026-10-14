// Finds the closest grocery stores, medical places, food places and transport stops
// around a point, using the free Overpass API (OpenStreetMap data).

const axios = require("axios");
const ExpressError = require("./expressError.js");

// Overpass has several public servers. If one is busy we try the next (fallback).
const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
];

// What counts as each category: OpenStreetMap tag key + allowed values
const CATEGORIES = {
    grocery: [["shop", ["supermarket", "convenience", "grocery", "greengrocer"]]],
    medical: [["amenity", ["hospital", "clinic", "pharmacy", "doctors"]]],
    food: [["amenity", ["restaurant", "cafe", "fast_food"]]],
    transport: [
        ["highway", ["bus_stop"]],
        ["railway", ["station"]],
        ["amenity", ["bus_station"]],
    ],
};

// Simple in-memory cache (1 hour) so repeat visits don't hit the public API again
const cache = new Map();
const CACHE_MS = 60 * 60 * 1000;

// Straight-line distance between two coordinates in metres (haversine formula)
function distanceInMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in metres
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

// Builds ONE Overpass query that asks for every category at once.
// "nwr" = nodes, ways and relations (shops are sometimes drawn as buildings).
function buildQuery(lat, lng, radius) {
    const lines = [];
    for (const filters of Object.values(CATEGORIES)) {
        for (const [key, values] of filters) {
            lines.push(`nwr(around:${radius},${lat},${lng})["${key}"~"^(${values.join("|")})$"];`);
        }
    }
    return `[out:json][timeout:25];(${lines.join("")});out center tags 400;`;
}

// Which category does this place belong to?
function categoryOf(tags) {
    for (const [name, filters] of Object.entries(CATEGORIES)) {
        for (const [key, values] of filters) {
            if (values.includes(tags[key])) return name;
        }
    }
    return null;
}

// "fast_food" -> "Fast food"
function readableType(tags) {
    const raw = tags.shop || tags.amenity || tags.railway || tags.highway || "place";
    const text = raw.replace(/_/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}

async function fetchFromOverpass(query) {
    let lastError;
    for (const url of ENDPOINTS) {
        try {
            const body = new URLSearchParams({ data: query }).toString();
            const { data } = await axios.post(url, body, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: 30000,
            });
            return data.elements || [];
        } catch (err) {
            lastError = err;
            console.error(`Overpass server failed (${url}):`, err.message);
        }
    }
    throw lastError;
}

// Returns { grocery: [...], medical: [...], food: [...], transport: [...] }
// where each list holds the k closest places, nearest first.
async function getNearbyData(lat, lng, { radius = 2000, k = 3 } = {}) {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${radius}`;
    let elements;

    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.time < CACHE_MS) {
        elements = hit.elements;
    } else {
        try {
            elements = await fetchFromOverpass(buildQuery(lat, lng, radius));
        } catch {
            // No fake data: tell the user honestly and let the UI show a retry option
            throw new ExpressError(502, "Nearby places are temporarily unavailable. Please try again shortly.");
        }
        cache.set(cacheKey, { elements, time: Date.now() });
    }

    const result = {};
    for (const name of Object.keys(CATEGORIES)) result[name] = [];

    for (const el of elements) {
        const tags = el.tags || {};
        const category = categoryOf(tags);
        if (!category) continue;

        // Nodes have lat/lon. Ways (buildings) have a computed centre point.
        const placeLat = el.lat ?? el.center?.lat;
        const placeLng = el.lon ?? el.center?.lon;
        if (placeLat == null || placeLng == null) continue;

        result[category].push({
            id: `${el.type}/${el.id}`,
            name: tags.name || readableType(tags),
            type: readableType(tags),
            distance: distanceInMeters(lat, lng, placeLat, placeLng),
        });
    }

    // Top-K: sort by distance (closest first) and keep the first k
    for (const name of Object.keys(result)) {
        result[name].sort((a, b) => a.distance - b.distance);
        result[name] = result[name].slice(0, k);
    }
    return result;
}

module.exports = getNearbyData;
module.exports.distanceInMeters = distanceInMeters; // exported for testing
module.exports.buildQuery = buildQuery;
