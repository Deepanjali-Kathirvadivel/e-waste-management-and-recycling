const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { logisticsValidator } = require('../validators/facilityValidator');
const { validate } = require('../middleware/validate');

router.get('/', authenticateToken, (req, res, next) => logisticsController.getAll(req, res, next));
router.get('/total-costs', authenticateToken, (req, res, next) => logisticsController.getTotalCosts(req, res, next));
router.get('/analytics', authenticateToken, authorizeAdmin, (req, res, next) => logisticsController.getAnalytics(req, res, next));
router.get('/:id', authenticateToken, (req, res, next) => logisticsController.getById(req, res, next));
router.post('/', authenticateToken, authorizeAdmin, logisticsValidator, validate, (req, res, next) => logisticsController.create(req, res, next));
router.put('/:id', authenticateToken, authorizeAdmin, (req, res, next) => logisticsController.update(req, res, next));
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res, next) => logisticsController.delete(req, res, next));

module.exports = router;
