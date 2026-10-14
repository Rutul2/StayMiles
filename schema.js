const Joi = require("joi");

// Joi checks the shape of incoming data before it reaches the database.
module.exports.ListingSchema = Joi.object({
    title: Joi.string().trim().max(100).required(),
    description: Joi.string().trim().max(2000).required(),
    location: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    price: Joi.number().min(0).required(),
});

module.exports.ReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().min(3).max(1000).required(),
});

module.exports.SignupSchema = Joi.object({
    username: Joi.string().trim().min(3).max(30).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).max(72).required(), // bcrypt only uses the first 72 bytes
});

module.exports.LoginSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required(),
});
