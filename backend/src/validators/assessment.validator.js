const Joi = require('joi');

const createAssessmentSchema = Joi.object({
  customer_name: Joi.string().max(100).allow('', null),
  customer_email: Joi.string().email().allow('', null),
  customer_phone: Joi.string().max(20).allow('', null),
  customer_address: Joi.string().allow('', null),
  product_type_id: Joi.number().integer().allow(null),
  brand: Joi.string().max(100).allow('', null),
  model: Joi.string().max(100).allow('', null),
  year_of_manufacture: Joi.number().integer().min(1980).max(2030).allow(null),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'damaged').allow(null),
  weight_kg: Joi.number().precision(2).allow(null),
  notes: Joi.string().allow('', null),
});

const updateAssessmentSchema = Joi.object({
  customer_name: Joi.string().max(100).allow('', null),
  customer_email: Joi.string().email().allow('', null),
  customer_phone: Joi.string().max(20).allow('', null),
  customer_address: Joi.string().allow('', null),
  product_type_id: Joi.number().integer().allow(null),
  brand: Joi.string().max(100).allow('', null),
  model: Joi.string().max(100).allow('', null),
  year_of_manufacture: Joi.number().integer().min(1980).max(2030).allow(null),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'damaged').allow(null),
  weight_kg: Joi.number().precision(2).allow(null),
  notes: Joi.string().allow('', null),
  status: Joi.string().valid('draft', 'in_progress', 'completed', 'cancelled'),
});

module.exports = { createAssessmentSchema, updateAssessmentSchema };
