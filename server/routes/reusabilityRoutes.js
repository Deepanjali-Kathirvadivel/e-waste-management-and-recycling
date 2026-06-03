const express = require('express');
const router = express.Router();
const reusabilityController = require('../controllers/reusabilityController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res, next) => reusabilityController.getAll(req, res, next));
router.get('/analytics', authenticateToken, authorizeAdmin, (req, res, next) => reusabilityController.getAnalytics(req, res, next));
router.get('/:id', authenticateToken, (req, res, next) => reusabilityController.getById(req, res, next));

module.exports = router;
