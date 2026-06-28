const router = require('express').Router();
const ctrl = require('../controllers/hub.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/dashboard', auth, rbac('admin', 'center_manager', 'supply_chain'), ctrl.dashboard);
router.get('/pending', auth, rbac('admin', 'center_manager', 'supply_chain'), ctrl.pendingReceiving);
router.post('/:id/receive', auth, rbac('admin', 'center_manager', 'supply_chain'), ctrl.receiveProduct);
router.post('/:id/forward-analysis', auth, rbac('admin', 'center_manager'), ctrl.forwardForAnalysis);
router.get('/inventory', auth, rbac('admin', 'center_manager', 'supply_chain'), ctrl.inventory);
router.post('/:id/complete-analysis', auth, rbac('admin', 'center_manager'), ctrl.completeAnalysis);
router.post('/inventory/:id/assign-location', auth, rbac('admin', 'center_manager'), ctrl.assignStorageLocation);

module.exports = router;
