const router = require('express').Router();
const ctrl = require('../controllers/supplychain.controller');
const { auth, rbac } = require('../middleware/auth');

// ───── Regions ─────
router.get('/regions', auth, rbac('supply_chain', 'admin'), ctrl.listRegions);

// ───── Dashboard ─────
router.get('/dashboard', auth, rbac('supply_chain', 'admin'), ctrl.dashboard);

// ───── Pickup Workflow ─────
router.get('/pickups', auth, rbac('supply_chain', 'admin'), ctrl.pickupList);
router.get('/pickups/:id', auth, rbac('supply_chain', 'admin'), ctrl.pickupDetail);
router.post('/pickups/:id/assign', auth, rbac('supply_chain', 'admin'), ctrl.assignSelf);
router.post('/pickups/:id/generate-otp', auth, rbac('supply_chain', 'admin'), ctrl.generateOTP);
router.post('/pickups/:id/verify-otp', auth, rbac('supply_chain', 'admin'), ctrl.verifyOTP);
router.post('/pickups/:id/confirm-deal', auth, rbac('supply_chain', 'admin'), ctrl.confirmDeal);
router.post('/pickups/:id/collect', auth, rbac('supply_chain', 'admin'), ctrl.collectProduct);
router.get('/pickups/:id/receipt', auth, rbac('supply_chain', 'admin'), ctrl.downloadReceipt);

// ───── Hub Delivery ─────
router.post('/pickups/:id/deliver', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.deliverToHub);
router.post('/pickups/:id/receive', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.receiveAtHub);

// ───── Exceptions ─────
router.post('/pickups/:id/exception', auth, rbac('supply_chain', 'admin'), ctrl.reportException);

// ───── History ─────
router.get('/history', auth, rbac('supply_chain', 'admin'), ctrl.pickupHistory);

// ───── QR ─────
router.post('/scan-qr', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.scanQR);

// ───── Movements ─────
router.get('/pickups/:id/movements', auth, rbac('supply_chain', 'admin'), ctrl.movementHistory);

// ═══════════════════════════════════════════════════
// LEGACY ROUTES (backward compatible aliases)
// ═══════════════════════════════════════════════════
router.get('/deals', auth, rbac('supply_chain', 'admin'), ctrl.availableDeals);
router.get('/deals/:id', auth, rbac('supply_chain', 'admin'), ctrl.getDeal);
router.post('/deals/:id/assign', auth, rbac('supply_chain', 'admin'), ctrl.assignSelf);
router.post('/deals/:id/generate-otp', auth, rbac('supply_chain', 'admin'), ctrl.generateOTP);
router.post('/deals/:id/verify-otp', auth, rbac('supply_chain', 'admin'), ctrl.verifyOTP);
router.post('/deals/:id/collect', auth, rbac('supply_chain', 'admin'), ctrl.collectProduct);
router.patch('/deals/:id/transport-status', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.updateTransportStatus);
router.get('/deals/:id/receipt', auth, rbac('supply_chain', 'admin'), ctrl.downloadReceipt);
router.get('/deals/:id/movements', auth, rbac('supply_chain', 'admin'), ctrl.movementHistory);
router.get('/deliveries', auth, rbac('supply_chain', 'admin'), ctrl.completedDeliveries);
router.post('/deals/:id/receive', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.receiveProduct);
router.post('/deals/:id/forward-analysis', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.forwardForAnalysis);
router.post('/deals/:id/complete-analysis', auth, rbac('supply_chain', 'admin', 'center_manager'), ctrl.completeAnalysis);

module.exports = router;
