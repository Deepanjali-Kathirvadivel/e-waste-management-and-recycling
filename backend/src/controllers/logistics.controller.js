const { LogisticsRoute, Facility } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.list = catchAsync(async (req, res) => {
  const routes = await LogisticsRoute.findAll({
    order: [['route_name', 'ASC']],
    include: [
      { model: Facility, as: 'origin', attributes: ['name'] },
      { model: Facility, as: 'destination', attributes: ['name'] },
    ],
  });
  res.json({ logistics: routes });
});

exports.create = catchAsync(async (req, res) => {
  const route = await LogisticsRoute.create(req.body);
  res.status(201).json({ logistics: route });
});

exports.getOne = catchAsync(async (req, res) => {
  const route = await LogisticsRoute.findByPk(req.params.id);
  if (!route) throw new AppError('Route not found', 404);
  res.json({ logistics: route });
});

exports.update = catchAsync(async (req, res) => {
  const route = await LogisticsRoute.findByPk(req.params.id);
  if (!route) throw new AppError('Route not found', 404);
  await route.update(req.body);
  res.json({ logistics: route });
});

exports.remove = catchAsync(async (req, res) => {
  const route = await LogisticsRoute.findByPk(req.params.id);
  if (!route) throw new AppError('Route not found', 404);
  await route.destroy();
  res.json({ message: 'Route deleted' });
});
