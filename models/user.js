const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // bcrypt hash, never the real password. select:false keeps it out of normal queries.
    password: { type: String, select: false },
});

module.exports = mongoose.model("User", userSchema);
