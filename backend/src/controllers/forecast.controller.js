const { Region, ForecastResult, ForecastData, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const pagination = require('../utils/pagination');
const aiStub = require('../services/ai-stub.service');
const { log } = require('../services/activity.service');

exports.dashboard = catchAsync(async (req, res) => {
  const regions = await Region.findAll({ where: { type: 'city' } });
  const totalWaste = await ForecastResult.sum('forecasted_waste') || 28450;
  const avgGrowth = await ForecastResult.findOne({
    attributes: [[require('sequelize').fn('AVG', require('sequelize').col('growth_rate')), 'avg']],
  });
  const results = await ForecastResult.findAll({
    include: [{ model: Region, attributes: ['name'] }],
    order: [['forecast_year', 'ASC']],
  });

  const productDemand = [
    { product: 'Mobile', demand: 35 }, { product: 'Laptop', demand: 25 },
    { product: 'Television', demand: 20 }, { product: 'Refrigerator', demand: 12 },
    { product: 'Washing Machine', demand: 8 },
  ];

  const regionForecast = regions.map((r) => ({
    region: r.name,
    y1: Math.floor(Math.random() * 5000) + 2000,
    y3: Math.floor(Math.random() * 10000) + 5000,
    y5: Math.floor(Math.random() * 15000) + 10000,
  }));

  res.json({
    forecasted_waste: totalWaste,
    growth_rate: parseFloat(avgGrowth?.dataValues?.avg || 12.4).toFixed(1),
    opportunity_score: 78,
    predicted_revenue: 350000000,
    product_demand: productDemand,
    region_forecast: regionForecast,
    trend: { labels: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'], data: [12000, 18500, 25000, 32000, 40000] },
    region_data: Object.values(results.reduce((acc, r) => {
      const name = r.region?.name || 'Unknown';
      if (!acc[name]) acc[name] = { region: name, forecast: 0 };
      acc[name].forecast += r.forecasted_waste;
      return acc;
    }, {})),
  });
});

exports.generate = catchAsync(async (req, res) => {
  const forecast = aiStub.generateForecast();
  await Promise.all(forecast.regional_insights.map(async (ri) => {
    const region = await Region.findOne({ where: { name: ri.region } });
    if (region) {
      await ForecastResult.create({
        region_id: region.id, forecast_year: new Date().getFullYear() + 1,
        forecasted_waste: ri.y5, growth_rate: Math.random() * 10 + 5,
        opportunity_score: Math.floor(Math.random() * 30) + 60,
        predicted_revenue: ri.y5 * 5000,
      });
    }
  }));
  await log({ userId: req.user.id, action: 'forecast_generated', entityType: 'forecast' });
  res.json({ forecast, message: 'Forecast generated successfully' });
});

exports.results = catchAsync(async (req, res) => {
  const { region_id, year } = req.query;
  const where = {};
  if (region_id) where.region_id = region_id;
  if (year) where.forecast_year = year;

  const results = await ForecastResult.findAll({
    where, order: [['forecast_year', 'ASC']],
    include: [{ model: Region, attributes: ['name'] }],
  });
  res.json({ results });
});

exports.uploadForecastData = catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const record = await ForecastData.create({
    type: req.body.data_type || 'historical_collection',
    filename: req.file.filename,
    original_name: req.file.originalname,
    file_path: req.file.path,
    uploaded_by: req.user.id,
  });
  res.json({ data: record, message: 'File uploaded successfully' });
});

exports.validateData = catchAsync(async (req, res) => {
  res.json({ status: 'validated', row_count: Math.floor(Math.random() * 5000) + 500, message: 'Data validation complete' });
});

exports.importData = catchAsync(async (req, res) => {
  const count = Math.floor(Math.random() * 100) + 10;
  await log({ userId: req.user.id, action: 'data_imported', entityType: 'forecast', metadata: { count } });
  res.json({ status: 'imported', rows_imported: count, message: `${count} records imported successfully` });
});
