const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/assessments', require('./assessment.routes'));
router.use('/admin/dashboard', require('./adminDashboard.routes'));
router.use('/admin/staff', require('./staff.routes'));
router.use('/admin/products', require('./product.routes'));
router.use('/admin/analytics', require('./analytics.routes'));
router.use('/bi', require('./bi.routes'));
router.use('/forecast', require('./forecast.routes'));
router.use('/regions', require('./region.routes'));
router.use('/facilities', require('./facility.routes'));
router.use('/logistics', require('./logistics.routes'));
router.use('/data/import', require('./dataImport.routes'));
router.use('/hr', require('./hr.routes'));

module.exports = router;
