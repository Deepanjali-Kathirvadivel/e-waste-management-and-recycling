const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { auth } = require('../middleware/auth');

router.get('/', auth, ctrl.list);
router.get('/types', auth, ctrl.types);
router.get('/unread-count', auth, ctrl.unreadCount);
router.post('/:id/read', auth, ctrl.markRead);
router.post('/read-all', auth, ctrl.markAllRead);
router.delete('/:id', auth, ctrl.deleteNotification);
router.delete('/clear/read', auth, ctrl.clearAll);

module.exports = router;
