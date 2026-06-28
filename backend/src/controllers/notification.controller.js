const { Notification, User, Assessment } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

exports.list = catchAsync(async (req, res) => {
  const { type, limit } = req.query;
  const where = { user_id: req.user.id };
  if (type) where.type = type;

  const notifications = await Notification.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit) || 50,
  });
  res.json({ notifications });
});

exports.unreadCount = catchAsync(async (req, res) => {
  const count = await Notification.count({
    where: { user_id: req.user.id, is_read: false },
  });
  res.json({ count });
});

exports.markRead = catchAsync(async (req, res) => {
  const notif = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  await notif.update({ is_read: true });
  res.json({ message: 'Marked as read' });
});

exports.markAllRead = catchAsync(async (req, res) => {
  await Notification.update(
    { is_read: true },
    { where: { user_id: req.user.id, is_read: false } },
  );
  res.json({ message: 'All marked as read' });
});

exports.types = catchAsync(async (req, res) => {
  res.json({
    types: [
      'approved',
      'rejected',
      'modified',
      'hub_assigned',
      'forecast_ready',
      'simulation_complete',
      'low_stock',
      'inventory_alert',
      'audit_alert',
    ],
  });
});

exports.deleteNotification = catchAsync(async (req, res) => {
  const notif = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  await notif.destroy();
  res.json({ message: 'Notification deleted' });
});

exports.clearAll = catchAsync(async (req, res) => {
  await Notification.destroy({
    where: { user_id: req.user.id, is_read: true },
  });
  res.json({ message: 'Read notifications cleared' });
});
