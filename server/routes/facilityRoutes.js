const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { centerValidator } = require('../validators/facilityValidator');
const { validate } = require('../middleware/validate');

router.get('/analytics', authenticateToken, authorizeAdmin, (req, res, next) => facilityController.getAnalytics(req, res, next));

router.get('/centers', authenticateToken, (req, res, next) => facilityController.getAllCenters(req, res, next));
router.get('/centers/:id', authenticateToken, (req, res, next) => facilityController.getCenterById(req, res, next));
router.post('/centers', authenticateToken, authorizeAdmin, centerValidator, validate, (req, res, next) => facilityController.createCenter(req, res, next));
router.put('/centers/:id', authenticateToken, authorizeAdmin, (req, res, next) => facilityController.updateCenter(req, res, next));
router.delete('/centers/:id', authenticateToken, authorizeAdmin, (req, res, next) => facilityController.deleteCenter(req, res, next));

router.get('/centers/:id/costs', authenticateToken, (req, res, next) => facilityController.getCenterCosts(req, res, next));
router.post('/centers/:id/costs', authenticateToken, authorizeAdmin, (req, res, next) => facilityController.addCenterCost(req, res, next));

router.get('/units', authenticateToken, (req, res, next) => facilityController.getAllUnits(req, res, next));
router.get('/units/:id', authenticateToken, (req, res, next) => facilityController.getUnitById(req, res, next));
router.post('/units', authenticateToken, authorizeAdmin, (req, res, next) => facilityController.createUnit(req, res, next));
router.put('/units/:id', authenticateToken, authorizeAdmin, (req, res, next) => facilityController.updateUnit(req, res, next));
router.delete('/units/:id', authenticateToken, authorizeAdmin, (req, res, next) => facilityController.deleteUnit(req, res, next));

router.get('/units/:id/costs', authenticateToken, (req, res, next) => facilityController.getUnitCosts(req, res, next));
router.post('/units/:id/costs', authenticateToken, authorizeAdmin, (req, res, next) => facilityController.addUnitCost(req, res, next));

module.exports = router;
