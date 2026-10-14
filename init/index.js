// Fills a LOCAL database with sample listings:  npm run seed
// It deletes existing listings, so it never touches Atlas unless you set SEED_DB_URL yourself.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const URL = process.env.SEED_DB_URL || "mongodb://127.0.0.1:27017/staymiles";

async function seed() {
    await mongoose.connect(URL);

    let host = await User.findOne({ username: "demohost" });
    if (!host) {
        host = await User.create({
            username: "demohost",
            email: "demohost@example.com",
            password: await bcrypt.hash("demo1234", 10),
        });
    }

    await Listing.deleteMany({});
    await Listing.insertMany(initData.data.map((item) => ({ ...item, owner: host._id })));
    console.log(`Seeded ${initData.data.length} listings into ${URL}`);
    console.log("Demo login -> email: demohost@example.com  password: demo1234");
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
