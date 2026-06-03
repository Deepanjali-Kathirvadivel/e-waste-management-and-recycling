const { body } = require('express-validator');

const updateProfileValidator = [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

module.exports = { updateProfileValidator };
