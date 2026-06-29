const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');
const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
};

// Staff login (employee, manager, supply_chain, center_manager)
exports.login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user || !user.is_active) throw new AppError('Invalid credentials', 401);
  if (['admin', 'root'].includes(user.role)) throw new AppError('Use Admin Login portal', 401);
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);
  await user.update({ last_login: new Date() });
  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id, username: user.username, email: user.email,
      full_name: user.full_name, phone: user.phone, role: user.role,
      region_id: user.region_id, facility_id: user.facility_id, is_active: user.is_active,
    },
  });
});

// Admin-only login (admin, root)
exports.adminLogin = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user || !user.is_active) throw new AppError('Invalid credentials', 401);
  if (!['admin', 'root'].includes(user.role)) throw new AppError('Admin access required', 403);
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);
  await user.update({ last_login: new Date() });
  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id, username: user.username, email: user.email,
      full_name: user.full_name, phone: user.phone, role: user.role,
      region_id: user.region_id, facility_id: user.facility_id, is_active: user.is_active,
    },
  });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (user) {
    console.log(`Password reset requested for ${email}`);
  }
  res.json({ message: 'If the email exists, a reset link has been sent.' });
});

exports.me = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password_hash'] },
    include: [
      { association: 'region', attributes: ['id', 'name'] },
      { association: 'facility', attributes: ['id', 'name'] },
    ],
  });
  if (!user) throw new AppError('User not found', 404);
  res.json({ user });
});

exports.logout = catchAsync(async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});
