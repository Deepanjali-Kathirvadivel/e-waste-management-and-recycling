const { body } = require('express-validator');

const forecastGenerateValidator = [
  body('region_id').optional().isInt().withMessage('Valid region ID required'),
  body('target_year').isInt({ min: 2026, max: 2035 }).withMessage('Target year must be between 2026 and 2035')
];

module.exports = { forecastGenerateValidator };
