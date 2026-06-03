const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');
const uploadProcessingController = require('../controllers/uploadProcessingController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { uploadExcel } = require('../middleware/upload');
const { forecastGenerateValidator } = require('../validators/forecastValidator');
const { validate } = require('../middleware/validate');

router.get('/dashboard', authenticateToken, authorizeAdmin, (req, res, next) => forecastController.getDashboard(req, res, next));
router.get('/models', authenticateToken, authorizeAdmin, (req, res, next) => forecastController.getModels(req, res, next));
router.get('/chart-data', authenticateToken, (req, res, next) => forecastController.getChartData(req, res, next));

router.get('/', authenticateToken, (req, res, next) => forecastController.getAll(req, res, next));
router.get('/results/:id', authenticateToken, (req, res, next) => forecastController.getResults(req, res, next));
router.get('/by-region/:regionId', authenticateToken, (req, res, next) => forecastController.getResultsByRegion(req, res, next));

router.post('/generate', authenticateToken, authorizeAdmin, forecastGenerateValidator, validate, (req, res, next) => forecastController.generate(req, res, next));
router.post('/upload', authenticateToken, authorizeAdmin, uploadExcel.single('file'), (req, res, next) => forecastController.upload(req, res, next));

router.get('/inputs', authenticateToken, authorizeAdmin, (req, res, next) => forecastController.getInputs(req, res, next));
router.post('/inputs/:id/validate', authenticateToken, authorizeAdmin, (req, res, next) => forecastController.validateInput(req, res, next));

router.post('/data/preview', authenticateToken, authorizeAdmin, uploadExcel.single('file'), (req, res, next) => uploadProcessingController.preview(req, res, next));
router.post('/data/validate', authenticateToken, authorizeAdmin, uploadExcel.single('file'), (req, res, next) => uploadProcessingController.validate(req, res, next));
router.post('/data/process', authenticateToken, authorizeAdmin, uploadExcel.single('file'), (req, res, next) => uploadProcessingController.process(req, res, next));

module.exports = router;
