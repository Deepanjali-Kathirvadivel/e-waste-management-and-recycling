const NotificationRepository = require('../repositories/notificationRepository');

const notifRepo = new NotificationRepository();

class NotificationController {
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const notifications = await notifRepo.getUserNotifications(
        req.user.id, req.user.userType, limit, offset
      );
      const unreadCount = await notifRepo.getUnreadCount(req.user.id, req.user.userType);

      const [countResult] = await notifRepo.query(
        'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND user_type = ?',
        [req.user.id, req.user.userType]
      );

      res.json({
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (err) { next(err); }
  }

  async markAsRead(req, res, next) {
    try {
      await notifRepo.markAsRead(req.params.id);
      res.json({ message: 'Notification marked as read' });
    } catch (err) { next(err); }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notifRepo.markAllAsRead(req.user.id, req.user.userType);
      res.json({ message: 'All notifications marked as read' });
    } catch (err) { next(err); }
  }

  async remove(req, res, next) {
    try {
      await notifRepo.delete(req.params.id);
      res.json({ message: 'Notification deleted' });
    } catch (err) { next(err); }
  }
}

module.exports = new NotificationController();
