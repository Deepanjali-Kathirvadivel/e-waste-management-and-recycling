const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const ctrl = require('../../controllers/notification.controller');

router.get('/', auth, ctrl.list);
router.get('/unread-count', auth, ctrl.unreadCount);
router.patch('/:id/read', auth, ctrl.markRead);
router.post('/read-all', auth, ctrl.markAllRead);
router.post('/clear-all', auth, ctrl.clearAll);

module.exports = { route: '/notifications', router };
