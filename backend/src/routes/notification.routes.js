const router = require('express').Router();
const { Notification } = require('../models');
const { auth } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');

router.get('/', auth, catchAsync(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    limit: 50,
  });
  res.json({ notifications });
}));

router.get('/unread-count', auth, catchAsync(async (req, res) => {
  const count = await Notification.count({
    where: { user_id: req.user.id, is_read: false },
  });
  res.json({ count });
}));

router.post('/:id/read', auth, catchAsync(async (req, res) => {
  const notif = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  await notif.update({ is_read: true });
  res.json({ message: 'Marked as read' });
}));

router.post('/read-all', auth, catchAsync(async (req, res) => {
  await Notification.update(
    { is_read: true },
    { where: { user_id: req.user.id, is_read: false } }
  );
  res.json({ message: 'All marked as read' });
}));

module.exports = router;
