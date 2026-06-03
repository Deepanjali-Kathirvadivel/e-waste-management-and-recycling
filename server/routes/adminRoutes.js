const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, authorizeAdmin, (req, res, next) => adminController.getDashboard(req, res, next));

module.exports = router;
