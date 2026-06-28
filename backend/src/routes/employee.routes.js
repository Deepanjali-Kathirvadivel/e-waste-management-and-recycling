const router = require('express').Router();
const ctrl = require('../controllers/hr.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/approved', auth, rbac('employee', 'admin'), ctrl.approvedQuotations);
router.get('/deal-group/:deal_group_id', auth, rbac('employee', 'admin'), ctrl.getDealGroup);
router.get('/facilities', auth, rbac('employee', 'admin'), ctrl.getFacilities);
router.post('/quotations/:id/generate-otp', auth, rbac('employee', 'admin'), ctrl.generateOTP);
router.post('/quotations/:id/verify-otp', auth, rbac('employee', 'admin'), ctrl.verifyOTP);
router.post('/quotations/:id/close-deal', auth, rbac('employee', 'admin'), ctrl.closeDeal);
router.get('/quotations/:id/receipt', auth, rbac('employee', 'admin'), ctrl.getReceipt);
router.post('/quotations/:id/destination', auth, rbac('employee', 'admin'), ctrl.assignDestination);
router.post('/batch-close-deal', auth, rbac('employee', 'admin'), ctrl.batchCloseDeal);
router.post('/batch-generate-otp', auth, rbac('employee', 'admin'), ctrl.batchGenerateOTP);

module.exports = router;
