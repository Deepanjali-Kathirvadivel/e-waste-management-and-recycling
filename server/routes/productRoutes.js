const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { productValidator } = require('../validators/assessmentValidator');
const { validate } = require('../middleware/validate');

router.get('/', authenticateToken, (req, res, next) => productController.getAll(req, res, next));
router.get('/catalog', authenticateToken, (req, res, next) => productController.getCatalog(req, res, next));
router.get('/type/:type', authenticateToken, (req, res, next) => productController.getByType(req, res, next));
router.get('/search', authenticateToken, (req, res, next) => productController.search(req, res, next));
router.get('/:id', authenticateToken, (req, res, next) => productController.getById(req, res, next));
router.post('/', authenticateToken, authorizeAdmin, productValidator, validate, (req, res, next) => productController.create(req, res, next));
router.put('/:id', authenticateToken, authorizeAdmin, (req, res, next) => productController.update(req, res, next));
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res, next) => productController.delete(req, res, next));

module.exports = router;
