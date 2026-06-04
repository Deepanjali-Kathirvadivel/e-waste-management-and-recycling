const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/', auth, rbac('admin', 'root'), ctrl.list);
router.get('/:id', auth, rbac('admin', 'root'), ctrl.getOne);

module.exports = router;
