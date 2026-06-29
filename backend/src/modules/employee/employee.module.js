const router = require('express').Router();
const { auth, rbac } = require('../../middleware/auth');
const ctrl = require('../../controllers/hr.controller');

router.get('/dashboard', auth, rbac('employee', 'admin'), ctrl.dashboard);
router.get('/approved', auth, rbac('employee', 'admin'), ctrl.approvedQuotations);
router.get('/deal-group/:deal_group_id', auth, rbac('employee', 'admin'), ctrl.getDealGroup);
router.get('/facilities', auth, rbac('employee', 'admin'), ctrl.getFacilities);
router.get('/quotations/:id/receipt', auth, rbac('employee', 'admin'), ctrl.getReceipt);
router.post('/quotations/:id/destination', auth, rbac('employee', 'admin'), ctrl.assignDestination);
router.post('/batch-close-deal', auth, rbac('employee', 'admin'), ctrl.batchCloseDeal);

module.exports = { route: '/employee', router };
