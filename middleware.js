const jwt = require("jsonwebtoken");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const ExpressError = require("./utils/expressError.js");

// 1) Is the caller logged in?  Reads "Authorization: Bearer <token>" and verifies the JWT.
module.exports.isLoggedIn = async (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) {
        throw new ExpressError(401, "Please log in to continue");
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET); // checks signature + expiry
    } catch {
        throw new ExpressError(401, "Your session has expired. Please log in again");
    }

    const user = await User.findById(payload.id);
    if (!user) throw new ExpressError(401, "Account not found. Please log in again");

    req.user = user;
    next();
};

// 2) Does this listing belong to the logged-in user?
module.exports.isOwner = async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError(404, "Listing not found");
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        throw new ExpressError(403, "Only the owner of this listing can do that");
    }
    req.listing = listing;
    next();
};

// 3) Did the logged-in user write this review?
module.exports.isReviewAuthor = async (req, res, next) => {
    const review = await Review.findById(req.params.reviewId);
    if (!review) throw new ExpressError(404, "Review not found");
    if (!review.author || !review.author.equals(req.user._id)) {
        throw new ExpressError(403, "You can only delete your own reviews");
    }
    req.review = review;
    next();
};

// 4) Generic validator: validate(SomeJoiSchema)
module.exports.validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        throw new ExpressError(400, error.details.map((d) => d.message).join(", "));
    }
    req.body = value; // cleaned data (trimmed, numbers converted)
    next();
};
