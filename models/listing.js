const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    image: { filename: String, url: String },
    price: Number,
    location: String,
    country: String,
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    owner: { type: Schema.Types.ObjectId, ref: "User" },

    // Saved the first time "nearby" is requested, so we geocode each listing only once
    coordinates: { lat: Number, lng: Number },

    // Cached Gemini results. They are cleared whenever a review is added or deleted,
    // so we only call Gemini when the reviews have actually changed.
    aiSummary: Object,
    safety: Object,
});

// When a listing is deleted, delete its reviews too
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

module.exports = mongoose.model("Listing", listingSchema);
