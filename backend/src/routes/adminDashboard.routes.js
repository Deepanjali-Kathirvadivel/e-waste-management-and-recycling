const router = require('express').Router();
const ctrl = require('../controllers/adminDashboard.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/kpi', auth, rbac('admin', 'root'), ctrl.kpi);
router.get('/charts', auth, rbac('admin', 'root'), ctrl.charts);
router.get('/activities', auth, rbac('admin', 'root'), ctrl.activities);

module.exports = router;
