const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config');
const AdminRepository = require('../repositories/adminRepository');
const StaffRepository = require('../repositories/staffRepository');

const adminRepo = new AdminRepository();
const staffRepo = new StaffRepository();

class AuthService {
  async adminLogin(username, password) {
    const admin = await adminRepo.findByUsername(username);
    if (!admin) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) throw new Error('Invalid credentials');

    if (admin.status !== 'active') throw new Error('Account is inactive');

    await adminRepo.updateLastLogin(admin.id);

    const token = this.generateToken(admin, 'admin');
    const refreshToken = this.generateRefreshToken(admin.id, 'admin');

    return {
      token,
      refreshToken,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role
      }
    };
  }

  async staffLogin(username, password) {
    const staff = await staffRepo.findByUsername(username);
    if (!staff) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(password, staff.password);
    if (!isValid) throw new Error('Invalid credentials');

    if (staff.status !== 'active') throw new Error('Account is inactive or suspended');

    await staffRepo.updateLastLogin(staff.id);

    const token = this.generateToken(staff, 'staff');
    const refreshToken = this.generateRefreshToken(staff.id, 'staff');

    return {
      token,
      refreshToken,
      staff: {
        id: staff.id,
        username: staff.username,
        full_name: staff.full_name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        region_id: staff.region_id
      }
    };
  }

  generateToken(user, userType) {
    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      userType: userType
    };
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  }

  generateRefreshToken(userId, userType) {
    return crypto.randomBytes(40).toString('hex');
  }

  async changePassword(userId, userType, currentPassword, newPassword) {
    const repo = userType === 'admin' ? adminRepo : staffRepo;
    const user = await repo.findById(userId);
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const table = userType === 'admin' ? 'admins' : 'staff';
    await repo.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashedPassword, userId]);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId, userType) {
    const repo = userType === 'admin' ? adminRepo : staffRepo;
    const user = await repo.findById(userId);
    if (!user) throw new Error('User not found');

    const { password, ...profile } = user;
    return profile;
  }

  async updateProfile(userId, userType, data) {
    const repo = userType === 'admin' ? adminRepo : staffRepo;
    const allowedFields = ['full_name', 'email', 'phone'];
    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    await repo.update(userId, updateData);
    return await this.getProfile(userId, userType);
  }

  async refreshAccessToken(userId, userType) {
    const repo = userType === 'admin' ? adminRepo : staffRepo;
    const user = await repo.findById(userId);
    if (!user) throw new Error('User not found');

    return this.generateToken(user, userType);
  }
}

module.exports = new AuthService();
