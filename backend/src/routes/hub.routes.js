const router = require('express').Router();
const ctrl = require('../controllers/hub.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/dashboard', auth, rbac('admin', 'center_manager'), ctrl.dashboard);
router.get('/pending', auth, rbac('admin', 'center_manager'), ctrl.pendingReceiving);
router.post('/:id/receive', auth, rbac('admin', 'center_manager'), ctrl.receiveProduct);
router.post('/:id/forward-analysis', auth, rbac('admin', 'center_manager'), ctrl.forwardForAnalysis);
router.get('/inventory', auth, rbac('admin', 'center_manager'), ctrl.inventory);
router.post('/:id/complete-analysis', auth, rbac('admin', 'center_manager'), ctrl.completeAnalysis);

module.exports = router;
