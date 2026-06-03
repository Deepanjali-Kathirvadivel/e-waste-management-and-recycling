const { body } = require('express-validator');

const customerValidator = [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

const productValidator = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('type').isIn(['TV', 'AC', 'Fridge', 'Washing Machine', 'Fan', 'Laptop', 'Mobile', 'Monitor', 'Keyboard', 'Mouse', 'Other']).withMessage('Invalid product type')
];

const auditValidator = [
  body('power_status').optional().isIn(['yes', 'no', 'unknown']),
  body('working_status').optional().isIn(['yes', 'no', 'partial', 'unknown']),
  body('battery_status').optional().isIn(['good', 'swollen', 'dead', 'missing', 'unknown'])
];

module.exports = { customerValidator, productValidator, auditValidator };
