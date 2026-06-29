const router = require('express').Router();
const { auth, rbac } = require('../../middleware/auth');
const ctrl = require('../../controllers/bi.controller');

router.get('/sustainability', auth, rbac('admin', 'root'), ctrl.sustainability);
router.get('/environmental', auth, rbac('admin', 'root'), ctrl.environmental);
router.get('/profitability', auth, rbac('admin', 'root'), ctrl.profitability);
router.get('/scenarios', auth, rbac('admin', 'root'), ctrl.scenarios);
router.get('/simulate', auth, rbac('admin', 'root'), ctrl.simulate);
router.get('/recommendations', auth, rbac('admin', 'root'), ctrl.recommendations);
router.get('/executive-dashboard', auth, rbac('admin', 'root'), ctrl.executiveDashboard);
router.get('/reports', auth, rbac('admin', 'root'), ctrl.reports);

module.exports = { route: '/bi', router };
