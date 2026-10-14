const express = require("express");
const router = express.Router();
const { isLoggedIn, validate } = require("../middleware.js");
const { SignupSchema, LoginSchema } = require("../schema.js");
const userController = require("../controller/user.js");

router.post("/signup", validate(SignupSchema), userController.signUp);
router.post("/login", validate(LoginSchema), userController.login);
router.get("/me", isLoggedIn, userController.me); // lets React restore the session on page refresh

module.exports = router;
