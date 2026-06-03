const express = require('express');
const router = express.Router();
const sustainabilityController = require('../controllers/sustainabilityController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, authorizeAdmin, (req, res, next) => sustainabilityController.getDashboard(req, res, next));

module.exports = router;
