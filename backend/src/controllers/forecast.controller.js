const fs = require('fs');
const { Op, fn, col } = require('sequelize');
const { Region, ForecastResult, ForecastData, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const pagination = require('../utils/pagination');
const aiStub = require('../services/ai-stub.service');
const { log } = require('../services/activity.service');

// Helper to parse uploaded CSV files
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }
  return rows;
}

exports.dashboard = catchAsync(async (req, res) => {
  const regions = await Region.findAll({ where: { type: 'city' } });
  const totalWaste = await ForecastResult.sum('forecasted_waste') || 0;
  const avgGrowth = await ForecastResult.findOne({
    attributes: [[fn('AVG', col('growth_rate')), 'avg']],
  });
  const predictedRevenue = await ForecastResult.sum('predicted_revenue') || 0;

  const results = await ForecastResult.findAll({
    include: [{ model: Region, attributes: ['name'] }],
    order: [['forecast_year', 'ASC']],
  });

  const yearGroups = results.reduce((acc, r) => {
    if (!acc[r.forecast_year]) acc[r.forecast_year] = 0;
    acc[r.forecast_year] += r.forecasted_waste;
    return acc;
  }, {});

  const trendLabels = Object.keys(yearGroups).sort();
  const trendData = trendLabels.map(y => yearGroups[y]);

  const productDemand = [
    { product: 'Mobile', demand: 35 }, { product: 'Laptop', demand: 25 },
    { product: 'Television', demand: 20 }, { product: 'Refrigerator', demand: 12 },
    { product: 'Washing Machine', demand: 8 },
  ];

  const regionForecast = regions.map((r) => {
    const regionResults = results.filter(res => res.region_id === r.id);
    return {
      region: r.name,
      y1: regionResults.find(res => res.forecast_year === 2025)?.forecasted_waste || 0,
      y3: regionResults.find(res => res.forecast_year === 2027)?.forecasted_waste || 0,
      y5: regionResults.find(res => res.forecast_year === 2029)?.forecasted_waste || 0,
    };
  });

  res.json({
    forecasted_waste: totalWaste,
    growth_rate: parseFloat(avgGrowth?.dataValues?.avg || 12.4).toFixed(1),
    opportunity_score: 82,
    predicted_revenue: predictedRevenue,
    product_demand: productDemand,
    region_forecast: regionForecast,
    trend: { 
      labels: trendLabels.length > 0 ? trendLabels : ['2025', '2026', '2027', '2028', '2029'], 
      data: trendData.length > 0 ? trendData : [12000, 18500, 25000, 32000, 40000] 
    },
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
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const dataType = req.body.data_type || 'historical_collection';
  const expectedHeaders = {
    historical_collection: ['Region', 'Year', 'Month', 'ProductCategory', 'VolumeCollected_kg', 'ValueCollected_INR'],
    sales_data: ['Region', 'Year', 'ProductCategory', 'UnitsSold', 'SalesValue_INR'],
    import_data: ['Region', 'Year', 'ProductCategory', 'UnitsImported', 'ImportValue_INR'],
    population_data: ['Region', 'Year', 'Population', 'GrowthRate'],
  };

  const fileContent = fs.readFileSync(req.file.path, 'utf8');
  const firstLine = fileContent.split(/\r?\n/)[0]?.trim();
  if (!firstLine) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Uploaded file is empty' });
  }

  const cleanFirstLine = firstLine.replace(/^\uFEFF/, '').replace(/\s+/g, '');
  const expected = expectedHeaders[dataType];
  
  if (expected) {
    const actualCols = cleanFirstLine.split(',');
    const isMatch = expected.every(col => actualCols.some(actualCol => actualCol.toLowerCase() === col.toLowerCase()));
    if (!isMatch) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: `Data type mismatch: The uploaded file's columns do not match the expected columns for '${dataType}'. Expected columns: ${expected.join(', ')}` 
      });
    }
  }

  const lines = fileContent.split(/\r?\n/).filter(l => l.trim() !== '');
  const rowCount = Math.max(0, lines.length - 1);

  const record = await ForecastData.create({
    type: dataType,
    filename: req.file.filename,
    original_name: req.file.originalname,
    file_path: req.file.path,
    uploaded_by: req.user.id,
    row_count: rowCount,
    status: 'uploaded'
  });

  res.json({ data: record, message: 'File uploaded successfully' });
});

exports.validateData = catchAsync(async (req, res) => {
  const lastUpload = await ForecastData.findOne({
    where: { uploaded_by: req.user.id },
    order: [['created_at', 'DESC']]
  });

  if (!lastUpload) {
    return res.status(404).json({ error: 'No uploaded file found to validate.' });
  }

  const rows = parseCSV(lastUpload.file_path);
  if (rows.length === 0) {
    return res.status(400).json({ error: 'The uploaded file contains no data rows.' });
  }

  const dbRegions = await Region.findAll();
  const regionNames = dbRegions.map(r => r.name.toLowerCase());
  const invalidRegions = [];

  rows.forEach(row => {
    const rName = row.Region || row.region;
    if (rName && !regionNames.includes(rName.toLowerCase())) {
      if (!invalidRegions.includes(rName)) {
        invalidRegions.push(rName);
      }
    }
  });

  if (invalidRegions.length > 0) {
    return res.status(400).json({ 
      error: `Validation error: The following regions in the CSV do not exist in the database: ${invalidRegions.join(', ')}. Please add them or check spelling.` 
    });
  }

  await lastUpload.update({ status: 'validated' });

  res.json({ 
    status: 'validated', 
    row_count: rows.length, 
    message: 'Data validation complete. All regions are valid.' 
  });
});

exports.importData = catchAsync(async (req, res) => {
  const lastUpload = await ForecastData.findOne({
    where: { uploaded_by: req.user.id, status: 'validated' },
    order: [['created_at', 'DESC']]
  });

  if (!lastUpload) {
    return res.status(400).json({ error: 'Please validate the uploaded data before importing.' });
  }

  const rows = parseCSV(lastUpload.file_path);
  const dbRegions = await Region.findAll();
  let importedCount = 0;

  for (const row of rows) {
    const rName = row.Region || row.region;
    const region = dbRegions.find(r => r.name.toLowerCase() === rName.toLowerCase());
    if (!region) continue;

    const year = parseInt(row.Year || row.year) || new Date().getFullYear();
    
    let waste = 0;
    let revenue = 0;

    if (lastUpload.type === 'historical_collection') {
      waste = parseFloat(row.VolumeCollected_kg) || 0;
      revenue = parseFloat(row.ValueCollected_INR) || 0;
    } else if (lastUpload.type === 'sales_data') {
      waste = (parseFloat(row.UnitsSold) || 0) * 15;
      revenue = parseFloat(row.SalesValue_INR) || 0;
    } else if (lastUpload.type === 'import_data') {
      waste = (parseFloat(row.UnitsImported) || 0) * 12;
      revenue = parseFloat(row.ImportValue_INR) || 0;
    } else if (lastUpload.type === 'population_data') {
      const pop = parseFloat(row.Population) || 100000;
      waste = Math.round(pop * 0.05);
      revenue = waste * 5000;
    }

    const [result, created] = await ForecastResult.findOrCreate({
      where: { region_id: region.id, forecast_year: year },
      defaults: {
        forecasted_waste: waste,
        growth_rate: 12.5,
        opportunity_score: 80,
        predicted_revenue: revenue
      }
    });

    if (!created) {
      await result.update({
        forecasted_waste: result.forecasted_waste + waste,
        predicted_revenue: result.predicted_revenue + revenue
      });
    }

    importedCount++;
  }

  await lastUpload.update({ status: 'imported' });
  await log({ userId: req.user.id, action: 'data_imported', entityType: 'forecast', metadata: { count: importedCount } });

  res.json({ 
    status: 'imported', 
    rows_imported: importedCount, 
    message: `${importedCount} records imported successfully. The graphs have been updated with the live data.` 
  });
});
