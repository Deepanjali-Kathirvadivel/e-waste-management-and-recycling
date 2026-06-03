const express = require('express');
const router = express.Router();
const profitController = require('../controllers/profitController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, authorizeAdmin, (req, res, next) => profitController.getDashboard(req, res, next));
router.get('/comparison', authenticateToken, authorizeAdmin, (req, res, next) => profitController.getComparison(req, res, next));
router.post('/simulate', authenticateToken, authorizeAdmin, (req, res, next) => profitController.simulate(req, res, next));
router.post('/simulate-all', authenticateToken, authorizeAdmin, (req, res, next) => profitController.simulateAll(req, res, next));

module.exports = router;
