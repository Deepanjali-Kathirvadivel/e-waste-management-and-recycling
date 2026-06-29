const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Region, Facility } = require('../../models');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const pagination = require('../../utils/pagination');
const { log } = require('../../services/activity.service');

exports.list = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { search, region, status } = req.query;
  const where = { role: 'supply_chain' };
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
    include: [
      { model: Region, attributes: ['name'] },
      { model: Facility, attributes: ['name'] },
    ],
  });
  res.json({ supply_chain_staff: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});

exports.create = catchAsync(async (req, res) => {
  const { username, email, password, full_name, phone, region_id, facility_id } = req.body;
  const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
  if (existing) throw new AppError('Username or email already exists', 400);
  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password_hash, full_name, phone, role: 'supply_chain', region_id, facility_id });
  await log({ userId: req.user.id, action: 'supply_chain_created', entityType: 'staff', entityId: user.id, metadata: { full_name } });
  res.status(201).json({ supply_chain_staff: { ...user.toJSON(), password_hash: undefined } });
});

exports.getOne = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password_hash'] },
    include: [
      { model: Region, attributes: ['name'] },
      { model: Facility, attributes: ['name'] },
    ],
  });
  if (!user || user.role !== 'supply_chain') throw new AppError('Supply chain staff not found', 404);
  res.json({ supply_chain_staff: user });
});

exports.update = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user || user.role !== 'supply_chain') throw new AppError('Supply chain staff not found', 404);
  const updateData = { ...req.body };
  if (updateData.password) {
    updateData.password_hash = await bcrypt.hash(updateData.password, 10);
    delete updateData.password;
  }
  if (updateData.role) delete updateData.role;
  await user.update(updateData);
  await log({ userId: req.user.id, action: 'supply_chain_updated', entityType: 'staff', entityId: user.id });
  res.json({ supply_chain_staff: { ...user.toJSON(), password_hash: undefined } });
});

exports.remove = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user || user.role !== 'supply_chain') throw new AppError('Supply chain staff not found', 404);
  await user.destroy();
  await log({ userId: req.user.id, action: 'supply_chain_deleted', entityType: 'staff', entityId: user.id });
  res.json({ message: 'Supply chain staff deleted' });
});

exports.toggleStatus = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user || user.role !== 'supply_chain') throw new AppError('Supply chain staff not found', 404);
  await user.update({ is_active: !user.is_active });
  res.json({ message: `Supply chain staff ${user.is_active ? 'activated' : 'deactivated'}`, is_active: user.is_active });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user || user.role !== 'supply_chain') throw new AppError('Supply chain staff not found', 404);
  const newPassword = 'Reset@123';
  user.password_hash = await bcrypt.hash(newPassword, 10);
  await user.save();
  await log({ userId: req.user.id, action: 'supply_chain_password_reset', entityType: 'staff', entityId: user.id });
  res.json({ message: 'Password reset successfully', new_password: newPassword });
});