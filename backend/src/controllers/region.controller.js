const { Region } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.list = catchAsync(async (req, res) => {
  const regions = await Region.findAll({ order: [['name', 'ASC']] });
  res.json({ regions });
});

exports.create = catchAsync(async (req, res) => {
  const region = await Region.create(req.body);
  res.status(201).json({ region });
});

exports.getOne = catchAsync(async (req, res) => {
  const region = await Region.findByPk(req.params.id, { include: [{ association: 'children' }] });
  if (!region) throw new AppError('Region not found', 404);
  res.json({ region });
});

exports.update = catchAsync(async (req, res) => {
  const region = await Region.findByPk(req.params.id);
  if (!region) throw new AppError('Region not found', 404);
  await region.update(req.body);
  res.json({ region });
});

exports.remove = catchAsync(async (req, res) => {
  const region = await Region.findByPk(req.params.id);
  if (!region) throw new AppError('Region not found', 404);
  await region.destroy();
  res.json({ message: 'Region deleted' });
});
