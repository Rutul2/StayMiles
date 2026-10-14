const express = require("express");
const router = express.Router({ mergeParams: true }); // gives access to :id from the parent path
const { isLoggedIn, isReviewAuthor, validate } = require("../middleware.js");
const { ReviewSchema } = require("../schema.js");
const reviewController = require("../controller/review.js");

router.post("/", isLoggedIn, validate(ReviewSchema), reviewController.createReview);
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, reviewController.destroyReview);

module.exports = router;
