const Joi = require('joi');

const createStaffSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).max(100).required(),
  full_name: Joi.string().max(100).required(),
  phone: Joi.string().max(20).allow('', null),
  role: Joi.string().valid('admin', 'center_manager', 'employee').required(),
  region_id: Joi.number().integer().allow(null),
});

const updateStaffSchema = Joi.object({
  full_name: Joi.string().max(100),
  email: Joi.string().email(),
  phone: Joi.string().max(20).allow('', null),
  role: Joi.string().valid('admin', 'center_manager', 'employee'),
  region_id: Joi.number().integer().allow(null),
  is_active: Joi.boolean(),
  password: Joi.string().min(4).max(100),
});

module.exports = { createStaffSchema, updateStaffSchema };
