const BaseRepository = require('./baseRepository');

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  async getUserNotifications(userId, userType, limit = 20, offset = 0) {
    const [rows] = await this.query(
      'SELECT * FROM notifications WHERE user_id = ? AND user_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, userType, limit, offset]
    );
    return rows;
  }

  async markAsRead(id) {
    await this.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  }

  async markAllAsRead(userId, userType) {
    await this.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND user_type = ?', [userId, userType]);
  }

  async getUnreadCount(userId, userType) {
    const [result] = await this.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND user_type = ? AND is_read = 0',
      [userId, userType]
    );
    return result[0].count;
  }

  async createNotification(data) {
    const [result] = await this.query(
      `INSERT INTO notifications (user_id, user_type, title, message, type, module, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.user_id, data.user_type, data.title, data.message, data.type || 'info', data.module, data.reference_id]
    );
    return result.insertId;
  }
}

module.exports = NotificationRepository;
