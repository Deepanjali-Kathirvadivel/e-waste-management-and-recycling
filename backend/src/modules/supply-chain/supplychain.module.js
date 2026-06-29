const router = require('express').Router();
const { auth, rbac } = require('../../middleware/auth');
const ctrl = require('../../controllers/supplychain.controller');

router.get('/regions', auth, rbac('supply_chain', 'admin'), ctrl.listRegions);
router.get('/dashboard', auth, rbac('supply_chain', 'admin'), ctrl.dashboard);
router.get('/pickups', auth, rbac('supply_chain', 'admin'), ctrl.pickupList);
router.get('/pickups/:id', auth, rbac('supply_chain', 'admin'), ctrl.pickupDetail);
router.post('/pickups/:id/assign', auth, rbac('supply_chain', 'admin'), ctrl.assignSelf);
router.post('/pickups/:id/schedule', auth, rbac('supply_chain', 'admin'), ctrl.schedulePickup);
router.post('/pickups/:id/start-journey', auth, rbac('supply_chain', 'admin'), ctrl.startJourney);
router.post('/pickups/:id/arrive', auth, rbac('supply_chain', 'admin'), ctrl.arriveAtCustomer);
router.post('/pickups/:id/generate-otp', auth, rbac('supply_chain', 'admin'), ctrl.generateOTP);
router.post('/pickups/:id/verify-otp', auth, rbac('supply_chain', 'admin'), ctrl.verifyOTP);
router.post('/pickups/:id/verify-product', auth, rbac('supply_chain', 'admin'), ctrl.verifyProduct);
router.post('/pickups/:id/confirm-deal', auth, rbac('supply_chain', 'admin'), ctrl.confirmDeal);
router.post('/pickups/:id/collect', auth, rbac('supply_chain', 'admin'), ctrl.collectProduct);
router.get('/pickups/:id/receipt', auth, rbac('supply_chain', 'admin'), ctrl.downloadReceipt);
router.post('/pickups/:id/start-transport', auth, rbac('supply_chain', 'admin'), ctrl.startTransport);
router.post('/pickups/:id/milestone', auth, rbac('supply_chain', 'admin'), ctrl.updateTransitMilestone);
router.post('/pickups/:id/deliver', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.deliverToHub);
router.post('/pickups/:id/receive', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.receiveAtHub);
router.post('/pickups/:id/forward', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.forwardForProcessing);
router.post('/pickups/:id/exception', auth, rbac('supply_chain', 'admin'), ctrl.reportException);
router.get('/history', auth, rbac('supply_chain', 'admin'), ctrl.pickupHistory);

module.exports = { route: '/supply-chain', router };
