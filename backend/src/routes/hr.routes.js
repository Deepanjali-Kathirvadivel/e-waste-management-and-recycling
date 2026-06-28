const router = require('express').Router();
const ctrl = require('../controllers/hr.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/dashboard', auth, rbac('manager', 'admin'), ctrl.dashboard);
router.get('/pending', auth, rbac('manager', 'admin'), ctrl.pendingQuotations);
router.get('/approved', auth, rbac('manager', 'admin'), ctrl.approvedQuotations);
router.get('/rejected', auth, rbac('manager', 'admin'), ctrl.rejectedQuotations);
router.get('/receipts', auth, rbac('manager', 'admin'), ctrl.receiptHistory);
router.get('/quotations/:id', auth, rbac('manager', 'admin'), ctrl.getQuotation);
router.post('/quotations/:id/approve', auth, rbac('manager', 'admin'), ctrl.approveQuotation);
router.post('/quotations/:id/reject', auth, rbac('manager', 'admin'), ctrl.rejectQuotation);
router.get('/facilities', auth, rbac('manager', 'admin'), ctrl.getFacilities);
router.post('/quotations/:id/customer-expected-value', auth, rbac('employee', 'manager', 'admin'), ctrl.setCustomerExpectedValue);

module.exports = router;
