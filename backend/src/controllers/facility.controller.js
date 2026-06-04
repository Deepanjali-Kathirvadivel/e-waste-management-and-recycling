const { Facility, Region } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.list = catchAsync(async (req, res) => {
  const where = {};
  if (req.query.type) where.type = req.query.type;
  const facilities = await Facility.findAll({ where, order: [['name', 'ASC']], include: [{ model: Region, attributes: ['name'] }] });
  res.json({ facilities });
});

exports.create = catchAsync(async (req, res) => {
  const facility = await Facility.create(req.body);
  res.status(201).json({ facility });
});

exports.getOne = catchAsync(async (req, res) => {
  const facility = await Facility.findByPk(req.params.id, { include: [{ model: Region, attributes: ['name'] }] });
  if (!facility) throw new AppError('Facility not found', 404);
  res.json({ facility });
});

exports.update = catchAsync(async (req, res) => {
  const facility = await Facility.findByPk(req.params.id);
  if (!facility) throw new AppError('Facility not found', 404);
  await facility.update(req.body);
  res.json({ facility });
});

exports.remove = catchAsync(async (req, res) => {
  const facility = await Facility.findByPk(req.params.id);
  if (!facility) throw new AppError('Facility not found', 404);
  await facility.destroy();
  res.json({ message: 'Facility deleted' });
});
