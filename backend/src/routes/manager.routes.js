const router = require('express').Router();
const ctrl = require('../controllers/manager.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/dashboard', auth, rbac('manager', 'admin'), ctrl.dashboard);
router.get('/pending', auth, rbac('manager', 'admin'), ctrl.pendingReviews);
router.get('/approved', auth, rbac('manager', 'admin'), ctrl.approvedQuotations);
router.get('/rejected', auth, rbac('manager', 'admin'), ctrl.rejectedQuotations);
router.get('/receipts', auth, rbac('manager', 'admin'), ctrl.receiptHistory);
router.get('/receipts/:id', auth, rbac('manager', 'admin'), ctrl.getReceipt);
router.get('/quotations/:id', auth, rbac('manager', 'admin'), ctrl.getQuotation);
router.post('/quotations/:id/approve', auth, rbac('manager', 'admin'), ctrl.approveQuotation);
router.post('/quotations/:id/reject', auth, rbac('manager', 'admin'), ctrl.rejectQuotation);
router.post('/quotations/:id/modify', auth, rbac('manager', 'admin'), ctrl.modifyQuotation);
router.post('/quotations/:id/assign-hub', auth, rbac('manager', 'admin'), ctrl.assignHub);
router.get('/facilities', auth, rbac('manager', 'admin'), ctrl.getFacilities);
router.get('/employee-kpi', auth, rbac('manager', 'admin'), ctrl.employeeKPIs);

module.exports = router;
