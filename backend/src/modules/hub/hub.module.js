const router = require('express').Router();
const { auth, rbac } = require('../../middleware/auth');
const ctrl = require('../../controllers/hub.controller');

router.get('/dashboard', auth, rbac('center_manager', 'admin', 'supply_chain'), ctrl.dashboard);
router.get('/inventory', auth, rbac('center_manager', 'admin', 'supply_chain'), ctrl.inventory);
router.get('/pending-receiving', auth, rbac('center_manager', 'admin', 'supply_chain'), ctrl.pendingReceiving);
router.post('/receive/:assessmentId', auth, rbac('center_manager', 'admin', 'supply_chain'), ctrl.receiveProduct);
router.post('/forward/:assessmentId', auth, rbac('center_manager', 'admin'), ctrl.forwardForAnalysis);
router.get('/analysis/pending', auth, rbac('center_manager', 'admin'), ctrl.completeAnalysis);
router.post('/inventory/assign-location', auth, rbac('center_manager', 'admin'), ctrl.assignStorageLocation);

module.exports = { route: '/hub', router };
