const Joi = require('joi');

const createAssessmentSchema = Joi.object({
  customer_name: Joi.string().max(100).allow('', null),
  customer_email: Joi.string().email().allow('', null),
  customer_phone: Joi.string().max(20).allow('', null),
  customer_address: Joi.string().allow('', null),
  customer_state: Joi.string().max(50).allow('', null),
  customer_district: Joi.string().max(50).allow('', null),
  customer_pincode: Joi.string().max(10).allow('', null),
  customer_area_category: Joi.string().max(30).allow('', null),
  customer_ward_number: Joi.string().max(20).allow('', null),
  product_type_id: Joi.number().integer().allow(null),
  product_type: Joi.string().max(100).allow('', null),
  product_category: Joi.string().max(10).allow('', null),
  brand: Joi.string().max(100).allow('', null),
  model: Joi.string().max(100).allow('', null),
  serial_number: Joi.string().max(100).allow('', null),
  year_of_manufacture: Joi.number().integer().min(1980).max(2030).allow(null),
  purchase_year: Joi.number().integer().min(1980).max(2030).allow(null),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'damaged').allow(null),
  warranty_status: Joi.string().max(30).allow('', null),
  ownership_type: Joi.string().max(30).allow('', null),
  accessories_available: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.array().items(Joi.string())
  ),
  weight_kg: Joi.number().precision(2).allow(null),
  specifications: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.object()
  ),
  notes: Joi.string().allow('', null),
  value_estimate: Joi.number().precision(2).allow(null),
  value_min: Joi.number().precision(2).allow(null),
  value_max: Joi.number().precision(2).allow(null),
  customer_expected_value: Joi.number().precision(2).allow(null),
  status: Joi.string().allow('', null),
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
  value_estimate: Joi.number().precision(2).allow(null),
});

module.exports = { createAssessmentSchema, updateAssessmentSchema };
