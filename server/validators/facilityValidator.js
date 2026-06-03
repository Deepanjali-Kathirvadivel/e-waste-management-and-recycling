const { body } = require('express-validator');

const centerValidator = [
  body('name').notEmpty().withMessage('Center name is required'),
  body('type').isIn(['collection_center', 'preprocessing_center']).withMessage('Invalid facility type')
];

const logisticsValidator = [
  body('route_name').notEmpty().withMessage('Route name is required'),
  body('source').notEmpty().withMessage('Source is required'),
  body('destination').notEmpty().withMessage('Destination is required')
];

module.exports = { centerValidator, logisticsValidator };
