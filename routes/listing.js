const express = require("express");
const router = express.Router();
const { isLoggedIn, isOwner, validate } = require("../middleware.js");
const { ListingSchema } = require("../schema.js");
const { upload } = require("../cloudConfig.js");
const listingController = require("../controller/listing.js");
const insights = require("../controller/insights.js");

router.get("/", listingController.index);
router.post("/", isLoggedIn, upload.single("image"), validate(ListingSchema), listingController.createListing);

router.get("/:id", listingController.showListing);
router.put("/:id", isLoggedIn, isOwner, upload.single("image"), validate(ListingSchema), listingController.updateListing);
router.delete("/:id", isLoggedIn, isOwner, listingController.destroyListing);

// The three headline features
router.get("/:id/nearby", insights.nearby);   // Overpass API
router.get("/:id/summary", insights.summary); // Gemini: review summary
router.get("/:id/safety", insights.safety);   // Gemini: safety keywords + score

module.exports = router;
