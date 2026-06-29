const router = require('express').Router();

// ───── Modular Architecture (refactored) ─────
const modules = [
  require('../modules/auth/auth.module'),
  require('../modules/employee/employee.module'),
  require('../modules/manager/manager.module'),
  require('../modules/supply-chain/supplychain.module'),
  require('../modules/hr/hr.module'),
  require('../modules/hub/hub.module'),
  require('../modules/assessment/assessment.module'),
  require('../modules/forecast/forecast.module'),
  require('../modules/bi/bi.module'),
  require('../modules/report/report.module'),
  require('../modules/notification/notification.module'),
  require('../modules/profile/profile.module'),
  require('../modules/admin/admin.module'),
];

modules.forEach(({ route, router: modRouter }) => {
  router.use(route, modRouter);
});

// ───── Legacy Routes (backward compatibility) ─────
router.use('/dashboard', require('./dashboard.routes'));
router.use('/regions', require('./region.routes'));
router.use('/facilities', require('./facility.routes'));
router.use('/logistics', require('./logistics.routes'));
router.use('/data/import', require('./dataImport.routes'));

// Legacy aliases for backward compatibility
router.use('/admin/staff', require('./staff.routes'));

module.exports = router;
