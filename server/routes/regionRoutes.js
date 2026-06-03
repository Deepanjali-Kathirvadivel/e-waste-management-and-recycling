const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { regionValidator } = require('../validators/regionValidator');
const { validate } = require('../middleware/validate');

router.get('/', authenticateToken, (req, res, next) => regionController.getAll(req, res, next));
router.get('/summary', authenticateToken, (req, res, next) => regionController.getSummary(req, res, next));
router.get('/:id', authenticateToken, (req, res, next) => regionController.getById(req, res, next));
router.get('/:id/stats', authenticateToken, (req, res, next) => regionController.getStats(req, res, next));
router.post('/', authenticateToken, authorizeAdmin, regionValidator, validate, (req, res, next) => regionController.create(req, res, next));
router.put('/:id', authenticateToken, authorizeAdmin, regionValidator, validate, (req, res, next) => regionController.update(req, res, next));
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res, next) => regionController.delete(req, res, next));

module.exports = router;
