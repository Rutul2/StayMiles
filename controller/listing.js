const Listing = require("../models/listing.js");
const { cloudinary } = require("../cloudConfig.js");
const ExpressError = require("../utils/expressError.js");

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Adds avgRating and reviewCount to a listing
const withRating = (listing) => {
    const obj = listing.toObject();
    const ratings = (obj.reviews || []).map((r) => r.rating).filter(Number.isFinite);
    obj.reviewCount = ratings.length;
    obj.avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    return obj;
};

const deleteImage = async (filename) => {
    if (!filename) return;
    try {
        await cloudinary.uploader.destroy(filename);
    } catch (err) {
        console.error("Could not delete image:", err.message); // not worth failing the request for
    }
};

module.exports.index = async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter = search
        ? {
              $or: ["title", "location", "country"].map((field) => ({
                  [field]: { $regex: escapeRegex(search), $options: "i" },
              })),
          }
        : {};

    const listings = await Listing.find(filter)
        .select("-aiSummary -safety")
        .populate("reviews", "rating")
        .sort({ _id: -1 });

    res.json(
        listings.map((listing) => {
            const obj = withRating(listing);
            delete obj.reviews; // the cards only need avgRating + reviewCount
            return obj;
        })
    );
};

module.exports.showListing = async (req, res) => {
    const listing = await Listing.findById(req.params.id)
        .select("-aiSummary -safety")
        .populate("owner", "username")
        .populate({ path: "reviews", populate: { path: "author", select: "username" } });

    if (!listing) throw new ExpressError(404, "This listing does not exist");
    res.json(withRating(listing));
};

module.exports.createListing = async (req, res) => {
    if (!req.file) throw new ExpressError(400, "Please upload a photo of the property");

    const listing = new Listing({
        ...req.body,
        owner: req.user._id,
        image: { filename: req.file.filename, url: req.file.path },
    });
    await listing.save();
    res.status(201).json(listing);
};

module.exports.updateListing = async (req, res) => {
    const listing = req.listing; // loaded by the isOwner middleware

    const addressChanged = req.body.location !== listing.location || req.body.country !== listing.country;
    listing.set(req.body);

    if (addressChanged) {
        // Forget the old coordinates; they will be looked up again for the new address
        listing.set("coordinates.lat", undefined);
        listing.set("coordinates.lng", undefined);
    }
    if (req.file) {
        await deleteImage(listing.image?.filename);
        listing.image = { filename: req.file.filename, url: req.file.path };
    }

    await listing.save();
    res.json(listing);
};

module.exports.destroyListing = async (req, res) => {
    // findByIdAndDelete triggers the hook in models/listing.js that removes its reviews
    await Listing.findByIdAndDelete(req.params.id);
    await deleteImage(req.listing.image?.filename);
    res.json({ message: "Listing deleted" });
};
