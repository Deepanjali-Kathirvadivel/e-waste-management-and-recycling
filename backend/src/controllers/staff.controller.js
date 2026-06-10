const bcrypt = require('bcryptjs');
const { Op, fn, col } = require('sequelize');
const { User, Assessment, Region } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const pagination = require('../utils/pagination');
const { log } = require('../services/activity.service');

exports.list = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { search, role, region, status } = req.query;
  const where = { role: { [Op.ne]: 'root' } };
  if (role) where.role = role;
  if (region) where.region_id = region;
  if (status === 'active') where.is_active = true;
  if (status === 'inactive') where.is_active = false;
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { username: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where, limit, offset, order: [['created_at', 'DESC']],
    attributes: { exclude: ['password_hash'] },
    include: [{ model: Region, attributes: ['name'] }],
  });
  res.json({ staff: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.create = catchAsync(async (req, res) => {
  const { username, email, password, full_name, phone, role, region_id } = req.body;
  const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
  if (existing) throw new AppError('Username or email already exists', 400);
  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password_hash, full_name, phone, role, region_id });
  await log({ userId: req.user.id, action: 'staff_created', entityType: 'staff', entityId: user.id,
    metadata: { full_name, role } });
  res.status(201).json({ user: { ...user.toJSON(), password_hash: undefined } });
});

exports.getOne = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password_hash'] },
    include: [{ model: Region, attributes: ['name'] }],
  });
  if (!user) throw new AppError('Staff not found', 404);

  const [assessmentsCount, collectionsCount, totalValue, avgRating] = await Promise.all([
    Assessment.count({ where: { user_id: user.id } }),
    Assessment.count({ where: { user_id: user.id, created_at: { [Op.gte]: new Date(new Date().setDate(1)) } } }),
    Assessment.sum('value_estimate', { where: { user_id: user.id, status: 'completed' } }),
    Assessment.findOne({ where: { user_id: user.id }, attributes: [[fn('AVG', col('ai_score')), 'avg']] }),
  ]);

  res.json({ staff: user, stats: { assessments_count: assessmentsCount, collections_count: collectionsCount, total_value: totalValue || 0, avg_rating: avgRating?.dataValues?.avg || 85 } });
});

exports.update = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('Staff not found', 404);
  const updateData = { ...req.body };
  if (updateData.password) {
    updateData.password_hash = await bcrypt.hash(updateData.password, 10);
    delete updateData.password;
  }
  await user.update(updateData);
  await log({ userId: req.user.id, action: 'staff_updated', entityType: 'staff', entityId: user.id });
  res.json({ user: { ...user.toJSON(), password_hash: undefined } });
});

exports.remove = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('Staff not found', 404);
  if (user.role === 'root') throw new AppError('Cannot delete root user', 400);
  await user.destroy();
  await log({ userId: req.user.id, action: 'staff_deleted', entityType: 'staff', entityId: user.id });
  res.json({ message: 'Staff deleted' });
});

exports.toggleStatus = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('Staff not found', 404);
  if (user.role === 'root') throw new AppError('Cannot deactivate root user', 400);
  await user.update({ is_active: !user.is_active });
  res.json({ message: `Staff ${user.is_active ? 'activated' : 'deactivated'}`, is_active: user.is_active });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('Staff not found', 404);
  const newPassword = 'Reset@123';
  user.password_hash = await bcrypt.hash(newPassword, 10);
  await user.save();
  await log({ userId: req.user.id, action: 'staff_password_reset', entityType: 'staff', entityId: user.id });
  res.json({ message: 'Password reset successfully', new_password: newPassword });
});
