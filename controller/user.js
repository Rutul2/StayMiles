const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const ExpressError = require("../utils/expressError.js");

// The token only carries the user id. It is signed, so it can't be edited, and it expires in 7 days.
const signToken = (user) => jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicUser = (user) => ({ id: user._id, username: user.username, email: user.email });

module.exports.signUp = async (req, res) => {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (exists) throw new ExpressError(409, "That username or email is already registered");

    const hashed = await bcrypt.hash(password, 10); // 10 = salt rounds (cost)
    const user = await User.create({ username, email: email.toLowerCase(), password: hashed });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
};

module.exports.login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    const ok = user && user.password && (await bcrypt.compare(password, user.password));
    // Same message for "no such user" and "wrong password" so attackers can't probe for emails
    if (!ok) throw new ExpressError(401, "Incorrect email or password");

    res.json({ token: signToken(user), user: publicUser(user) });
};

module.exports.me = (req, res) => {
    res.json({ user: publicUser(req.user) });
};
