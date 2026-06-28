const router = require('express').Router();
const ctrl = require('../controllers/bi.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/sustainability', auth, rbac('admin', 'root'), ctrl.sustainability);
router.get('/environmental', auth, rbac('admin', 'root'), ctrl.environmental);
router.get('/profitability', auth, rbac('admin', 'root'), ctrl.profitability);
router.get('/scenarios', auth, rbac('admin', 'root'), ctrl.scenarios);
router.post('/simulate', auth, rbac('admin', 'root'), ctrl.simulate);
router.post('/recommendations', auth, rbac('admin', 'root'), ctrl.recommendations);
router.get('/executive', auth, rbac('admin', 'root'), ctrl.executiveDashboard);
router.get('/reports/:type/:format', auth, rbac('admin', 'root'), ctrl.reports);

module.exports = router;
