require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");

const listingRoutes = require("./routes/listing.js");
const reviewRoutes = require("./routes/review.js");
const userRoutes = require("./routes/user.js");
const ExpressError = require("./utils/expressError.js");

const DB_URL = process.env.ATLASDB_URL;
const PORT = process.env.PORT || 8080;

// Fail fast with a clear message instead of a confusing error later
if (!DB_URL || !process.env.JWT_SECRET) {
    console.error("Missing ATLASDB_URL or JWT_SECRET. Copy .env.example to .env and fill it in.");
    process.exit(1);
}

const app = express();
app.use(express.json());

// ---------- API routes (all return JSON) ----------
app.use("/api/auth", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/listings/:id/reviews", reviewRoutes);
app.use("/api", (req, res, next) => next(new ExpressError(404, "API route not found")));

// ---------- Production: serve the React build from the same server ----------
if (process.env.NODE_ENV === "production") {
    const dist = path.join(__dirname, "client", "dist");
    app.use(express.static(dist));
    // Any non-API URL (e.g. /listings/123) is handled by React Router in the browser
    app.use((req, res) => res.sendFile(path.join(dist, "index.html")));
}

// ---------- One central error handler ----------
// Express 5 forwards errors thrown inside async handlers here automatically.
app.use((err, req, res, next) => {
    if (err.name === "CastError") err = new ExpressError(404, "Not found"); // bad ObjectId in URL
    if (err.code === "LIMIT_FILE_SIZE") err = new ExpressError(400, "Image must be smaller than 5 MB");

    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({
        message: status === 500 ? "Something went wrong on our side. Please try again." : err.message,
    });
});

mongoose.set("strictQuery", true);
mongoose
    .connect(DB_URL)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error("Could not connect to MongoDB:", err.message);
        process.exit(1);
    });
