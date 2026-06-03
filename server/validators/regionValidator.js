const { body } = require('express-validator');

const regionValidator = [
  body('name').notEmpty().withMessage('Region name is required'),
  body('code').notEmpty().withMessage('Region code is required')
];

module.exports = { regionValidator };
