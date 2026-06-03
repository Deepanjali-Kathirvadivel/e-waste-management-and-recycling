const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeAdmin, (req, res, next) => auditLogController.getAll(req, res, next));

module.exports = router;
