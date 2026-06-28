const router = require('express').Router();
const ctrl = require('../controllers/supplychain.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/dashboard', auth, rbac('supply_chain', 'admin'), ctrl.dashboard);
router.get('/deals', auth, rbac('supply_chain', 'admin'), ctrl.availableDeals);
router.get('/deals/:id', auth, rbac('supply_chain', 'admin'), ctrl.getDeal);
router.post('/deals/:id/assign', auth, rbac('supply_chain', 'admin'), ctrl.assignSelf);
router.post('/deals/:id/generate-otp', auth, rbac('supply_chain', 'admin'), ctrl.generateOTP);
router.post('/deals/:id/verify-otp', auth, rbac('supply_chain', 'admin'), ctrl.verifyOTP);
router.post('/deals/:id/collect', auth, rbac('supply_chain', 'admin'), ctrl.collectProduct);
router.patch('/deals/:id/transport-status', auth, rbac('supply_chain', 'admin'), ctrl.updateTransportStatus);
router.get('/deliveries', auth, rbac('supply_chain', 'admin'), ctrl.completedDeliveries);
router.get('/deals/:id/receipt', auth, rbac('supply_chain', 'admin'), ctrl.downloadReceipt);

module.exports = router;
