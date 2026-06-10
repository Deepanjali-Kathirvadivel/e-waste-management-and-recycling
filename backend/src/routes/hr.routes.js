const router = require('express').Router();
const ctrl = require('../controllers/hr.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/dashboard', auth, rbac('hr', 'admin'), ctrl.dashboard);
router.get('/pending', auth, rbac('hr', 'admin'), ctrl.pendingQuotations);
router.get('/approved', auth, rbac('hr', 'admin'), ctrl.approvedQuotations);
router.get('/rejected', auth, rbac('hr', 'admin'), ctrl.rejectedQuotations);
router.get('/receipts', auth, rbac('hr', 'admin'), ctrl.receiptHistory);
router.get('/quotations/:id', auth, rbac('hr', 'admin'), ctrl.getQuotation);
router.post('/quotations/:id/approve', auth, rbac('hr', 'admin'), ctrl.approveQuotation);
router.post('/quotations/:id/reject', auth, rbac('hr', 'admin'), ctrl.rejectQuotation);
router.post('/quotations/:id/generate-otp', auth, rbac('hr', 'admin', 'employee'), ctrl.generateOTP);
router.post('/quotations/:id/verify-otp', auth, rbac('hr', 'admin', 'employee'), ctrl.verifyOTP);
router.post('/quotations/:id/close-deal', auth, rbac('hr', 'admin', 'employee'), ctrl.closeDeal);
router.get('/quotations/:id/receipt', auth, rbac('hr', 'admin', 'employee'), ctrl.getReceipt);
router.get('/deal-group/:deal_group_id', auth, rbac('hr', 'admin'), ctrl.getDealGroup);
router.post('/quotations/:id/destination', auth, rbac('hr', 'admin', 'employee'), ctrl.assignDestination);
router.post('/quotations/:id/customer-expected-value', auth, rbac('employee', 'hr', 'admin'), ctrl.setCustomerExpectedValue);

module.exports = router;
