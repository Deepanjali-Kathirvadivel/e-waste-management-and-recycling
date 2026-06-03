const bcrypt = require('bcryptjs');
const StaffRepository = require('../repositories/staffRepository');
const NotificationRepository = require('../repositories/notificationRepository');

const staffRepo = new StaffRepository();
const notifRepo = new NotificationRepository();

class StaffService {
  async getAll(filters = {}) {
    return await staffRepo.getStaffWithRegion();
  }

  async getById(id) {
    const staff = await staffRepo.findById(id);
    if (!staff) throw new Error('Staff not found');

    const metrics = await staffRepo.getPerformanceMetrics(id);
    return { ...staff, metrics };
  }

  async create(data) {
    const existingUser = await staffRepo.findByUsername(data.username);
    if (existingUser) throw new Error('Username already exists');

    const existingEmail = await staffRepo.findByEmail(data.email);
    if (existingEmail) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const staffData = {
      full_name: data.full_name,
      username: data.username,
      email: data.email,
      phone: data.phone || null,
      password: hashedPassword,
      role: data.role || 'assessor',
      region_id: data.region_id || null,
      status: 'active'
    };

    const result = await staffRepo.create(staffData);

    if (data.adminId) {
      await notifRepo.createNotification({
        user_id: result.id,
        user_type: 'staff',
        title: 'Account Created',
        message: `Welcome ${data.full_name}! Your staff account has been created.`,
        type: 'success',
        module: 'staff'
      });
    }

    const { password, ...staff } = result;
    return staff;
  }

  async update(id, data) {
    const staff = await staffRepo.findById(id);
    if (!staff) throw new Error('Staff not found');

    if (data.email && data.email !== staff.email) {
      const existingEmail = await staffRepo.findByEmail(data.email);
      if (existingEmail) throw new Error('Email already exists');
    }

    const updateData = {};
    const allowedFields = ['full_name', 'email', 'phone', 'role', 'region_id', 'status'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }

    await staffRepo.update(id, updateData);
    return await staffRepo.findById(id);
  }

  async delete(id) {
    const staff = await staffRepo.findById(id);
    if (!staff) throw new Error('Staff not found');
    await staffRepo.delete(id);
    return { message: 'Staff deleted successfully' };
  }

  async updateStatus(id, status) {
    const staff = await staffRepo.findById(id);
    if (!staff) throw new Error('Staff not found');
    await staffRepo.update(id, { status });
    return { message: `Staff status updated to ${status}` };
  }

  async resetPassword(id, newPassword) {
    const staff = await staffRepo.findById(id);
    if (!staff) throw new Error('Staff not found');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await staffRepo.update(id, { password: hashedPassword });
    return { message: 'Password reset successfully' };
  }

  async getDashboard(staffId) {
    const stats = await staffRepo.getDashboardStats(staffId);
    const activities = await staffRepo.getRecentActivities(staffId);
    const trendData = await staffRepo.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM assessments WHERE staff_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `, [staffId]);
    const productDist = await staffRepo.query(`
      SELECT p.type, COUNT(*) as count
      FROM assessments a JOIN products p ON a.product_id = p.id
      WHERE a.staff_id = ? GROUP BY p.type ORDER BY count DESC
    `, [staffId]);

    return { stats, activities, trendData, productDist };
  }
}

module.exports = new StaffService();
