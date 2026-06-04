const router = require('express').Router();
const ctrl = require('../controllers/bi.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/sustainability', auth, rbac('admin', 'root'), ctrl.sustainability);
router.get('/profitability', auth, rbac('admin', 'root'), ctrl.profitability);
router.get('/scenarios', auth, rbac('admin', 'root'), ctrl.scenarios);
router.post('/recommendations', auth, rbac('admin', 'root'), ctrl.recommendations);
router.get('/reports/:type/:format', auth, rbac('admin', 'root'), ctrl.reports);

module.exports = router;
