const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/expressError.js");

// Reviews changed, so the cached AI summary and safety score are out of date: remove them.
const CLEAR_AI_CACHE = { aiSummary: "", safety: "" };

module.exports.createReview = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError(404, "This listing does not exist");

    const review = await Review.create({ ...req.body, author: req.user._id });
    await Listing.updateOne(
        { _id: listing._id },
        { $push: { reviews: review._id }, $unset: CLEAR_AI_CACHE }
    );

    await review.populate("author", "username");
    res.status(201).json(review);
};

module.exports.destroyReview = async (req, res) => {
    await Listing.updateOne(
        { _id: req.params.id },
        { $pull: { reviews: req.review._id }, $unset: CLEAR_AI_CACHE }
    );
    await req.review.deleteOne();
    res.json({ message: "Review deleted" });
};
