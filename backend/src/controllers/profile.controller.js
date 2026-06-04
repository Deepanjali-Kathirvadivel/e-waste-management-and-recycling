const bcrypt = require('bcryptjs');
const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getProfile = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
  res.json({ user });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { full_name, email, phone } = req.body;
  await req.user.update({ full_name, email, phone });
  res.json({ message: 'Profile updated', user: req.user });
});

exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Current password is incorrect', 400);
  user.password_hash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'Password changed successfully' });
});
