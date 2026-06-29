const fs = require('fs');
const { Op, fn, col } = require('sequelize');
const { Region, ForecastResult, ForecastData, User, Assessment, AnalysisResult, InventoryItem, ProductCatalog, Facility } = require('../models');
const catchAsync = require('../utils/catchAsync');
const pagination = require('../utils/pagination');
const { log } = require('../services/activity.service');

const PER_CAPITA_WASTE_KG = 3.2;

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
    headers.forEach((header, index) => { row[header] = values[index]; });
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
  const avgOpp = await ForecastResult.findOne({
    attributes: [[fn('AVG', col('opportunity_score')), 'avg']],
  });

  const results = await ForecastResult.findAll({
    include: [{ model: Region, attributes: ['name'] }],
    order: [['forecast_year', 'ASC']],
  });

  const yearGroups = results.reduce((acc, r) => {
    if (!acc[r.forecast_year]) acc[r.forecast_year] = 0;
    acc[r.forecast_year] += parseFloat(r.forecasted_waste) || 0;
    return acc;
  }, {});

  const trendLabels = Object.keys(yearGroups).sort();
  const trendData = trendLabels.map(y => yearGroups[y]);

  const productTypes = await ProductCatalog.findAll({ attributes: ['id', 'name'] });
  const productCounts = await Promise.all(productTypes.map(async (p) => {
    const count = await Assessment.count({ where: { product_type_id: p.id } });
    return { product: p.name, count };
  }));
  const totalAssessments = productCounts.reduce((s, p) => s + p.count, 0);
  const productDemand = productCounts
    .filter(p => p.count > 0)
    .map(p => ({
      product: p.product,
      demand: p.count / totalAssessments > 0.2 ? 'high' : p.count / totalAssessments > 0.08 ? 'medium' : 'low',
      share: parseFloat(((p.count / totalAssessments) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.share - a.share);

  const regionForecast = regions.map((r) => {
    const regionResults = results.filter(res => res.region_id === r.id);
    return {
      region: r.name,
      y1: regionResults.find(res => res.forecast_year === new Date().getFullYear() + 1)?.forecasted_waste || 0,
      y3: regionResults.find(res => res.forecast_year === new Date().getFullYear() + 3)?.forecasted_waste || 0,
      y5: regionResults.find(res => res.forecast_year === new Date().getFullYear() + 5)?.forecasted_waste || 0,
    };
  });

  res.json({
    forecasted_waste: totalWaste,
    growth_rate: avgGrowth?.dataValues?.avg ? parseFloat(avgGrowth.dataValues.avg).toFixed(1) : '0.0',
    opportunity_score: avgOpp?.dataValues?.avg ? parseFloat(avgOpp.dataValues.avg).toFixed(1) : '0.0',
    predicted_revenue: predictedRevenue,
    product_demand: productDemand,
    region_forecast: regionForecast,
    trend: {
      labels: trendLabels,
      data: trendData,
    },
    region_data: Object.values(results.reduce((acc, r) => {
      const name = r.region?.name || 'Unknown';
      if (!acc[name]) acc[name] = { region: name, forecast: 0 };
      acc[name].forecast += parseFloat(r.forecasted_waste) || 0;
      return acc;
    }, {})),
  });
});

exports.generate = catchAsync(async (req, res) => {
  const regions = await Region.findAll({ where: { type: 'city' } });
  const now = new Date();
  const currentYear = now.getFullYear();
  const months = [];
  for (let i = 24; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 1), label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
  }

  const regionData = {};
  for (const region of regions) {
    const monthlyCounts = [];
    for (const m of months) {
      const count = await Assessment.count({
        where: {
          created_at: { [Op.gte]: m.start, [Op.lt]: m.end },
          region_id: region.id,
        },
      });
      if (count > 0) {
        monthlyCounts.push({ label: m.label, count });
      }
    }

    const totalHistoricalWeight = await Assessment.sum('weight_kg', { where: { region_id: region.id } }) || 0;
    const historicalCount = monthlyCounts.reduce((s, m) => s + m.count, 0);
    const avgMonthly = monthlyCounts.length > 0 ? monthlyCounts.reduce((s, m) => s + m.count, 0) / monthlyCounts.length : 10;
    const growthTrend = monthlyCounts.length >= 6
      ? (monthlyCounts[monthlyCounts.length - 1].count - monthlyCounts[0].count) / Math.max(monthlyCounts[0].count, 1) * 100 / (monthlyCounts.length / 12)
      : 12.5;
    const annualRate = Math.max(growthTrend, 5);

    const avgWeight = totalHistoricalWeight > 0 && historicalCount > 0 ? totalHistoricalWeight / historicalCount : 5;

    const estimatedPotential = (region.population || 100000) * PER_CAPITA_WASTE_KG * 12;
    const actualAnnual = avgMonthly * 12;
    const oppScore = Math.min(100, Math.max(10, ((estimatedPotential - actualAnnual) / estimatedPotential) * 100));

    const classificationCounts = { reusable: 0, repairable: 0, recyclable: 0, scrap: 0 };
    const analysisResults = await AnalysisResult.findAll({
      include: [{
        model: Assessment,
        where: { region_id: region.id },
        attributes: [],
      }],
    });
    for (const ar of analysisResults) {
      if (ar.classification && classificationCounts[ar.classification] !== undefined) {
        classificationCounts[ar.classification]++;
      }
    }
    const totalClassified = Object.values(classificationCounts).reduce((s, v) => s + v, 0);

    const y1 = avgMonthly * 12 * (1 + annualRate / 100);
    const y3 = avgMonthly * 12 * Math.pow(1 + annualRate / 100, 3);
    const y5 = avgMonthly * 12 * Math.pow(1 + annualRate / 100, 5);
    const avgValue = await Assessment.sum('value_estimate', { where: { region_id: region.id, status: 'completed' } }) || 0;
    const revPerKg = avgValue > 0 && totalHistoricalWeight > 0 ? avgValue / totalHistoricalWeight : 50;

    const wastePerAssessment = avgWeight;
    const productTypes = await ProductCatalog.findAll({ attributes: ['id', 'name'] });
    const productDist = {};
    for (const pt of productTypes) {
      const c = await Assessment.count({ where: { region_id: region.id, product_type_id: pt.id } });
      if (c > 0) productDist[pt.name] = c;
    }

    regionData[region.id] = {
      region,
      monthlyCounts,
      annualRate: parseFloat(annualRate.toFixed(1)),
      opportunity_score: parseFloat(oppScore.toFixed(1)),
      y1_waste: parseFloat(y1.toFixed(2)),
      y3_waste: parseFloat(y3.toFixed(2)),
      y5_waste: parseFloat(y5.toFixed(2)),
      y1_revenue: parseFloat(y1 * revPerKg),
      y3_revenue: parseFloat(y3 * revPerKg),
      y5_revenue: parseFloat(y5 * revPerKg),
      classificationCounts,
      totalClassified,
      productDist,
      wastePerAssessment,
    };
  }

  const opportunityScores = {};
  for (const rid in regionData) {
    opportunityScores[regionData[rid].region.name] = regionData[rid].opportunity_score;
  }

  for (const rid in regionData) {
    const rd = regionData[rid];
    const forecastYears = [
      { year: currentYear + 1, waste: rd.y1_waste, revenue: rd.y1_revenue, label: '1-year' },
      { year: currentYear + 3, waste: rd.y3_waste, revenue: rd.y3_revenue, label: '3-year' },
      { year: currentYear + 5, waste: rd.y5_waste, revenue: rd.y5_revenue, label: '5-year' },
    ];

    for (const fy of forecastYears) {
      const [result] = await ForecastResult.findOrCreate({
        where: { region_id: parseInt(rid), forecast_year: fy.year },
        defaults: {
          forecasted_waste: fy.waste,
          growth_rate: rd.annualRate,
          opportunity_score: rd.opportunity_score,
          predicted_revenue: fy.revenue,
        },
      });

      if (result) {
        const collectionPrediction = rd.monthlyCounts.map(m => ({ month: m.label, count: m.count }));
        const demandForecast = Object.entries(rd.productDist).map(([product, count]) => ({
          product,
          count,
          share: parseFloat(((count / Math.max(Object.values(rd.productDist).reduce((a, b) => a + b, 0), 1)) * 100).toFixed(1)),
        }));

        await result.update({
          forecasted_waste: fy.waste,
          growth_rate: rd.annualRate,
          opportunity_score: rd.opportunity_score,
          predicted_revenue: fy.revenue,
          collection_prediction: collectionPrediction,
          demand_forecast: demandForecast,
          data_source_weights: {
            historical_collection: rd.monthlyCounts.length > 0 ? 60 : 0,
            population_data: rd.region.population ? 15 : 0,
            facility_capacity: 10,
            revenue_data: 15,
          },
        });
      }
    }
  }

  const allResults = await ForecastResult.findAll({
    include: [{ model: Region, attributes: ['name'] }],
    order: [['forecast_year', 'ASC']],
  });

  await log({ userId: req.user.id, action: 'forecast_generated', entityType: 'forecast', metadata: { regions: Object.keys(regionData).length } });

  res.json({
    forecast: {
      regions: Object.keys(opportunityScores).length,
      total_waste: Object.values(regionData).reduce((s, rd) => s + rd.y1_waste, 0),
      growth_rate: Object.values(regionData).reduce((s, rd) => s + rd.annualRate, 0) / Math.max(Object.keys(regionData).length, 1),
      opportunity_scores: opportunityScores,
      regional_insights: Object.entries(regionData).map(([rid, rd]) => ({
        region: rd.region.name,
        y1: rd.y1_waste,
        y3: rd.y3_waste,
        y5: rd.y5_waste,
        growth_rate: rd.annualRate,
        opportunity_score: rd.opportunity_score,
      })),
      product_demand: await buildProductDemand(),
    },
    results: allResults,
    message: 'Forecast generated from live data successfully',
  });
});

async function buildProductDemand() {
  const productTypes = await ProductCatalog.findAll({ attributes: ['id', 'name'] });
  const counts = await Promise.all(productTypes.map(async (p) => {
    const count = await Assessment.count({ where: { product_type_id: p.id } });
    return { product: p.name, count };
  }));
  const total = counts.reduce((s, c) => s + c.count, 0);
  return counts
    .filter(c => c.count > 0)
    .map(c => ({
      product: c.product,
      demand: c.count / total > 0.2 ? 'high' : c.count / total > 0.08 ? 'medium' : 'low',
      share: parseFloat(((c.count / Math.max(total, 1)) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.share - a.share);
}

exports.opportunity = catchAsync(async (req, res) => {
  const regions = await Region.findAll({ where: { type: 'city' } });
  const data = await Promise.all(regions.map(async (r) => {
    const actualCount = await Assessment.count({ where: { region_id: r.id } });
    const estimatedPotential = (r.population || 100000) * PER_CAPITA_WASTE_KG * 12;
    const actualAnnual = actualCount * 5;
    const gap = Math.max(0, estimatedPotential - actualAnnual);
    const score = Math.min(100, Math.max(10, (gap / estimatedPotential) * 100));
    return {
      region: r.name,
      population: r.population || 100000,
      estimated_potential_kg: estimatedPotential,
      actual_collected_kg: actualAnnual,
      gap_kg: gap,
      opportunity_score: parseFloat(score.toFixed(1)),
    };
  }));
  res.json({ opportunities: data });
});

exports.demandForecast = catchAsync(async (req, res) => {
  const productDemand = await buildProductDemand();
  res.json({ product_demand: productDemand });
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
    const isMatch = expected.every(col => actualCols.some(actualCol => col.toLowerCase() === actualCol.toLowerCase()));
    if (!isMatch) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: `Data type mismatch: The uploaded file's columns do not match the expected columns for '${dataType}'. Expected columns: ${expected.join(', ')}`,
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
    status: 'uploaded',
  });

  res.json({ data: record, message: 'File uploaded successfully' });
});

exports.validateData = catchAsync(async (req, res) => {
  const lastUpload = await ForecastData.findOne({
    where: { uploaded_by: req.user.id },
    order: [['created_at', 'DESC']],
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
      error: `Validation error: The following regions in the CSV do not exist in the database: ${invalidRegions.join(', ')}. Please add them or check spelling.`,
    });
  }

  await lastUpload.update({ status: 'validated' });

  res.json({
    status: 'validated',
    row_count: rows.length,
    message: 'Data validation complete. All regions are valid.',
  });
});

exports.importData = catchAsync(async (req, res) => {
  const lastUpload = await ForecastData.findOne({
    where: { uploaded_by: req.user.id, status: 'validated' },
    order: [['created_at', 'DESC']],
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
        predicted_revenue: revenue,
      },
    });

    if (!created) {
      await result.update({
        forecasted_waste: parseFloat(result.forecasted_waste) + waste,
        predicted_revenue: parseFloat(result.predicted_revenue) + revenue,
      });
    }

    importedCount++;
  }

  await lastUpload.update({ status: 'imported' });
  await log({ userId: req.user.id, action: 'data_imported', entityType: 'forecast', metadata: { count: importedCount } });

  res.json({
    status: 'imported',
    rows_imported: importedCount,
    message: `${importedCount} records imported successfully. The graphs have been updated with the live data.`,
  });
});
