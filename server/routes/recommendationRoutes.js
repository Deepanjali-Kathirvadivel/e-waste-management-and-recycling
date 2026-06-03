const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res, next) => recommendationController.getAll(req, res, next));
router.get('/:id', authenticateToken, (req, res, next) => recommendationController.getById(req, res, next));
router.post('/generate', authenticateToken, authorizeAdmin, (req, res, next) => recommendationController.generate(req, res, next));
router.patch('/:id/status', authenticateToken, authorizeAdmin, (req, res, next) => recommendationController.updateStatus(req, res, next));
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res, next) => recommendationController.remove(req, res, next));

router.get('/:id/actions', authenticateToken, (req, res, next) => recommendationController.getActions(req, res, next));
router.post('/:id/actions', authenticateToken, (req, res, next) => recommendationController.createAction(req, res, next));
router.patch('/actions/:actionId', authenticateToken, (req, res, next) => recommendationController.updateAction(req, res, next));
router.delete('/actions/:actionId', authenticateToken, (req, res, next) => recommendationController.removeAction(req, res, next));

module.exports = router;
