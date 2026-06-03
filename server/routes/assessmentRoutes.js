const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { customerValidator, productValidator, auditValidator } = require('../validators/assessmentValidator');
const { validate } = require('../middleware/validate');

router.get('/history', authenticateToken, (req, res, next) => assessmentController.getHistory(req, res, next));

router.post('/customers', authenticateToken, customerValidator, validate, (req, res, next) => assessmentController.createCustomer(req, res, next));
router.get('/customers', authenticateToken, (req, res, next) => assessmentController.getCustomers(req, res, next));
router.get('/customers/:id', authenticateToken, (req, res, next) => assessmentController.getCustomerById(req, res, next));

router.get('/products/catalog', authenticateToken, (req, res, next) => assessmentController.getCatalog(req, res, next));
router.post('/products', authenticateToken, productValidator, validate, (req, res, next) => assessmentController.createProduct(req, res, next));

router.post('/', authenticateToken, (req, res, next) => assessmentController.createAssessment(req, res, next));
router.get('/:id', authenticateToken, (req, res, next) => assessmentController.getAssessmentById(req, res, next));
router.put('/:id', authenticateToken, (req, res, next) => assessmentController.updateAssessment(req, res, next));

router.post('/:id/upload', authenticateToken, upload.array('images', 10), (req, res, next) => assessmentController.uploadImages(req, res, next));
router.post('/:id/cv-analysis', authenticateToken, (req, res, next) => assessmentController.runCVAnalysis(req, res, next));
router.post('/:id/audit', authenticateToken, auditValidator, validate, (req, res, next) => assessmentController.audit(req, res, next));
router.post('/:id/reusability', authenticateToken, (req, res, next) => assessmentController.calculateReusability(req, res, next));
router.post('/:id/valuation', authenticateToken, (req, res, next) => assessmentController.calculateValuation(req, res, next));
router.post('/:id/submit', authenticateToken, (req, res, next) => assessmentController.submit(req, res, next));

module.exports = router;
