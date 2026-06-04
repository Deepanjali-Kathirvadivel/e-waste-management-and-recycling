const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(4).max(100).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

module.exports = { loginSchema, forgotPasswordSchema };
