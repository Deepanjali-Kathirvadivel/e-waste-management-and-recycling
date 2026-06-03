const express = require('express');
const router = express.Router();
const simController = require('../controllers/scenarioSimulationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res, next) => simController.getAll(req, res, next));
router.get('/stats', authenticateToken, (req, res, next) => simController.getStats(req, res, next));
router.get('/:id', authenticateToken, (req, res, next) => simController.getById(req, res, next));
router.post('/', authenticateToken, (req, res, next) => simController.create(req, res, next));
router.put('/:id', authenticateToken, (req, res, next) => simController.update(req, res, next));
router.delete('/:id', authenticateToken, (req, res, next) => simController.remove(req, res, next));

module.exports = router;
