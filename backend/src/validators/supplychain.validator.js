const Joi = require('joi');

exports.generateOTP = Joi.object({});

exports.verifyOTP = Joi.object({
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
});

exports.collectProduct = Joi.object({
  payment_method: Joi.string().valid('cash', 'bank_transfer', 'upi', 'cheque', 'other').optional().default('cash'),
  transaction_id: Joi.string().max(50).optional(),
});

exports.updateTransportStatus = Joi.object({
  status: Joi.string().valid('collected', 'in_transit', 'delivered_to_hub', 'received').required(),
});

exports.updateStock = Joi.object({
  storage_location: Joi.string().max(100).optional(),
  stock_status: Joi.string().valid('in_stock', 'in_transit', 'under_analysis', 'forwarded', 'disposed', 'recovered').optional(),
  lifecycle_stage: Joi.string().valid('received', 'analysing', 'classified', 'processing', 'completed').optional(),
  notes: Joi.string().max(500).optional(),
}).min(1);

exports.completeAnalysis = Joi.object({
  classification: Joi.string().valid('reusable', 'repairable', 'recyclable', 'scrap').required(),
  condition_assessment: Joi.string().max(2000).optional().allow(''),
  repairable_components: Joi.array().items(Joi.string()).optional(),
  recoverable_materials: Joi.array().items(Joi.string()).optional(),
  hazardous_materials: Joi.array().items(Joi.string()).optional(),
  weight_breakdown: Joi.object().pattern(Joi.string(), Joi.number().min(0)).optional(),
  notes: Joi.string().max(1000).optional().allow(''),
});

exports.assignStorageLocation = Joi.object({
  storage_location: Joi.string().max(100).required(),
});

exports.scanQR = Joi.object({
  qr_data: Joi.required(),
});
