const router = require('express').Router();
const { auth, rbac } = require('../../middleware/auth');

// Admin Dashboard
const dashCtrl = require('../../controllers/adminDashboard.controller');
router.get('/dashboard/kpi', auth, rbac('admin', 'root'), dashCtrl.kpi);
router.get('/dashboard/charts', auth, rbac('admin', 'root'), dashCtrl.charts);
router.get('/dashboard/heatmap', auth, rbac('admin', 'root'), dashCtrl.heatmap);
router.get('/dashboard/activities', auth, rbac('admin', 'root'), dashCtrl.activities);

// Admin Analytics
const analyticsCtrl = require('../../controllers/analytics.controller');
router.get('/analytics/reusability', auth, rbac('admin', 'root'), analyticsCtrl.reusability);

// Admin Products
const productCtrl = require('../../controllers/product.controller');
router.get('/products', auth, rbac('admin', 'root'), productCtrl.list);
router.post('/products', auth, rbac('admin', 'root'), productCtrl.create);
router.put('/products/:id', auth, rbac('admin', 'root'), productCtrl.update);
router.delete('/products/:id', auth, rbac('admin', 'root'), productCtrl.remove);

// Admin Regions
const regionCtrl = require('../../controllers/region.controller');
router.get('/regions', auth, rbac('admin', 'root'), regionCtrl.list);
router.post('/regions', auth, rbac('admin', 'root'), regionCtrl.create);
router.put('/regions/:id', auth, rbac('admin', 'root'), regionCtrl.update);
router.delete('/regions/:id', auth, rbac('admin', 'root'), regionCtrl.remove);

// Admin Facilities
const facilityCtrl = require('../../controllers/facility.controller');
router.get('/facilities', auth, rbac('admin', 'root'), facilityCtrl.list);
router.post('/facilities', auth, rbac('admin', 'root'), facilityCtrl.create);
router.put('/facilities/:id', auth, rbac('admin', 'root'), facilityCtrl.update);
router.delete('/facilities/:id', auth, rbac('admin', 'root'), facilityCtrl.remove);

// Admin Logistics
const logisticsCtrl = require('../../controllers/logistics.controller');
router.get('/logistics', auth, rbac('admin', 'root'), logisticsCtrl.list);
router.post('/logistics', auth, rbac('admin', 'root'), logisticsCtrl.create);
router.put('/logistics/:id', auth, rbac('admin', 'root'), logisticsCtrl.update);
router.delete('/logistics/:id', auth, rbac('admin', 'root'), logisticsCtrl.remove);

// Admin BI
const biCtrl = require('../../controllers/bi.controller');
router.get('/bi/sustainability', auth, rbac('admin', 'root'), biCtrl.sustainability);
router.get('/bi/profit-optimization', auth, rbac('admin', 'root'), biCtrl.profitability);
router.get('/bi/scenario-simulation', auth, rbac('admin', 'root'), biCtrl.scenarios);
router.get('/bi/recommendations', auth, rbac('admin', 'root'), biCtrl.recommendations);

// Admin Data Import
const importCtrl = require('../../controllers/dataImport.controller');
router.post('/data/import', auth, rbac('admin', 'root'), importCtrl.importData);

// ───── Employee Management ─────
const empCtrl = require('./admin.employee.controller');
const { createEmployeeSchema, updateEmployeeSchema } = require('../../validators/employee.validator');
const validate = require('../../middleware/validate');

router.get('/employees', auth, rbac('admin', 'root'), empCtrl.list);
router.post('/employees', auth, rbac('admin', 'root'), validate(createEmployeeSchema), empCtrl.create);
router.get('/employees/:id', auth, rbac('admin', 'root'), empCtrl.getOne);
router.put('/employees/:id', auth, rbac('admin', 'root'), validate(updateEmployeeSchema), empCtrl.update);
router.delete('/employees/:id', auth, rbac('admin', 'root'), empCtrl.remove);
router.patch('/employees/:id/status', auth, rbac('admin', 'root'), empCtrl.toggleStatus);
router.post('/employees/:id/reset-password', auth, rbac('admin', 'root'), empCtrl.resetPassword);

// ───── Manager Management ─────
const mgrCtrl = require('./admin.manager.controller');
const { createManagerSchema, updateManagerSchema } = require('../../validators/manager.validator');

router.get('/managers', auth, rbac('admin', 'root'), mgrCtrl.list);
router.post('/managers', auth, rbac('admin', 'root'), validate(createManagerSchema), mgrCtrl.create);
router.get('/managers/:id', auth, rbac('admin', 'root'), mgrCtrl.getOne);
router.put('/managers/:id', auth, rbac('admin', 'root'), validate(updateManagerSchema), mgrCtrl.update);
router.delete('/managers/:id', auth, rbac('admin', 'root'), mgrCtrl.remove);
router.patch('/managers/:id/status', auth, rbac('admin', 'root'), mgrCtrl.toggleStatus);
router.post('/managers/:id/reset-password', auth, rbac('admin', 'root'), mgrCtrl.resetPassword);

// ───── Supply Chain Management ─────
const scCtrl = require('./admin.supplychain.controller');
const { createSupplyChainStaffSchema, updateSupplyChainStaffSchema } = require('../../validators/supplychainStaff.validator');

router.get('/supply-chain', auth, rbac('admin', 'root'), scCtrl.list);
router.post('/supply-chain', auth, rbac('admin', 'root'), validate(createSupplyChainStaffSchema), scCtrl.create);
router.get('/supply-chain/:id', auth, rbac('admin', 'root'), scCtrl.getOne);
router.put('/supply-chain/:id', auth, rbac('admin', 'root'), validate(updateSupplyChainStaffSchema), scCtrl.update);
router.delete('/supply-chain/:id', auth, rbac('admin', 'root'), scCtrl.remove);
router.patch('/supply-chain/:id/status', auth, rbac('admin', 'root'), scCtrl.toggleStatus);
router.post('/supply-chain/:id/reset-password', auth, rbac('admin', 'root'), scCtrl.resetPassword);

// ───── Notifications Management (Admin) ─────
const notifCtrl = require('../../controllers/notification.controller');
router.get('/notifications', auth, rbac('admin', 'root'), notifCtrl.list);
router.patch('/notifications/:id/read', auth, rbac('admin', 'root'), notifCtrl.markRead);
router.post('/notifications/read-all', auth, rbac('admin', 'root'), notifCtrl.markAllRead);

module.exports = { route: '/admin', router };
