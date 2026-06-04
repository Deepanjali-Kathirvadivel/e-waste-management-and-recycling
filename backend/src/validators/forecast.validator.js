const Joi = require('joi');

const regionSchema = Joi.object({
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('state', 'city').default('city'),
  parent_id: Joi.number().integer().allow(null),
  population: Joi.number().integer().allow(null),
  growth_rate: Joi.number().precision(2).allow(null),
  collection_quantity: Joi.number().precision(2).allow(null),
  revenue: Joi.number().precision(2).allow(null),
});

const facilitySchema = Joi.object({
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('collection_center', 'preprocessing_unit', 'dismantling', 'recovery').required(),
  region_id: Joi.number().integer().allow(null),
  capacity: Joi.number().integer().allow(null),
  rent: Joi.number().precision(2).allow(null),
  electricity_cost: Joi.number().precision(2).allow(null),
  staff_cost: Joi.number().precision(2).allow(null),
  status: Joi.string().valid('active', 'inactive', 'under_maintenance').default('active'),
  location: Joi.string().allow('', null),
});

const logisticsSchema = Joi.object({
  route_name: Joi.string().max(100).required(),
  origin_facility_id: Joi.number().integer().allow(null),
  destination_facility_id: Joi.number().integer().allow(null),
  distance_km: Joi.number().precision(2).allow(null),
  fuel_cost: Joi.number().precision(2).allow(null),
  driver_salary: Joi.number().precision(2).allow(null),
  vehicle_cost: Joi.number().precision(2).allow(null),
  maintenance_cost: Joi.number().precision(2).allow(null),
});

module.exports = { regionSchema, facilitySchema, logisticsSchema };
