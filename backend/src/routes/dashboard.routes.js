const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { auth } = require('../middleware/auth');

router.get('/kpi', auth, ctrl.staffKPI);
router.get('/charts/daily-trend', auth, ctrl.staffDailyTrend);
router.get('/charts/category', auth, ctrl.staffCategoryDistribution);
router.get('/charts/branch', auth, ctrl.staffBranchDistribution);
router.get('/charts/trend', auth, ctrl.staffTrends);
router.get('/charts/distribution', auth, ctrl.staffDistribution);

module.exports = router;
