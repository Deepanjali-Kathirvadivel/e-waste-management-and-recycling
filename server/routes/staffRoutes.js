const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { createStaffValidator, updateStaffValidator } = require('../validators/staffValidator');
const { validate } = require('../middleware/validate');

router.get('/dashboard', authenticateToken, (req, res, next) => staffController.getDashboard(req, res, next));

router.get('/', authenticateToken, authorizeAdmin, (req, res, next) => staffController.getAll(req, res, next));
router.get('/:id', authenticateToken, authorizeAdmin, (req, res, next) => staffController.getById(req, res, next));
router.post('/', authenticateToken, authorizeAdmin, createStaffValidator, validate, (req, res, next) => staffController.create(req, res, next));
router.put('/:id', authenticateToken, authorizeAdmin, updateStaffValidator, validate, (req, res, next) => staffController.update(req, res, next));
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res, next) => staffController.delete(req, res, next));
router.patch('/:id/status', authenticateToken, authorizeAdmin, (req, res, next) => staffController.updateStatus(req, res, next));
router.patch('/:id/reset-password', authenticateToken, authorizeAdmin, (req, res, next) => staffController.resetPassword(req, res, next));

module.exports = router;
