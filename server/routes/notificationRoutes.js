const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res, next) => notificationController.getAll(req, res, next));
router.patch('/read-all', authenticateToken, (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.patch('/:id/read', authenticateToken, (req, res, next) => notificationController.markAsRead(req, res, next));
router.delete('/:id', authenticateToken, (req, res, next) => notificationController.remove(req, res, next));

module.exports = router;
