const { body } = require('express-validator');

const createStaffValidator = [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['collector', 'assessor', 'verifier', 'manager']).withMessage('Invalid role')
];

const updateStaffValidator = [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['collector', 'assessor', 'verifier', 'manager']).withMessage('Invalid role')
];

module.exports = { createStaffValidator, updateStaffValidator };
