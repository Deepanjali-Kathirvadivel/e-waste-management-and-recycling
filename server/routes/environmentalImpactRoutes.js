const express = require('express');
const router = express.Router();
const envController = require('../controllers/environmentalImpactController');
const { authenticateToken } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, (req, res, next) => envController.getDashboard(req, res, next));
router.get('/region/:regionId', authenticateToken, (req, res, next) => envController.getByRegion(req, res, next));
router.post('/record', authenticateToken, (req, res, next) => envController.record(req, res, next));

module.exports = router;
