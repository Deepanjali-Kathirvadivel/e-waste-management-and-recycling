const ForecastRepository = require('../repositories/forecastRepository');
const ForecastInputRepository = require('../repositories/forecastInputRepository');
const RegionRepository = require('../repositories/regionRepository');
const SalesDataRepository = require('../repositories/salesDataRepository');
const PopulationDataRepository = require('../repositories/populationDataRepository');
const ImportDataRepository = require('../repositories/importDataRepository');
const AssessmentRepository = require('../repositories/assessmentRepository');
const pool = require('../config/db');

const forecastRepo = new ForecastRepository();
const forecastInputRepo = new ForecastInputRepository();
const regionRepo = new RegionRepository();
const salesRepo = new SalesDataRepository();
const populationRepo = new PopulationDataRepository();
const importRepo = new ImportDataRepository();
const assessmentRepo = new AssessmentRepository();

class ForecastService {
  async getDashboard() {
    const stats = await forecastRepo.getDashboard();
    const regionCount = await regionRepo.count();

    const actualData = await pool.query(`
      SELECT COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as total_assessments,
             COALESCE(AVG(suggested_value), 0) as avg_value
      FROM assessments WHERE status = 'completed'
    `);

    const accuracy = await this.calculateForecastAccuracy();

    return {
      ...stats,
      totalRegions: regionCount,
      avgAssessmentValue: actualData[0].avg_value,
      forecastAccuracy: accuracy,
      regionCount
    };
  }

  async calculateForecastAccuracy() {
    const [actual] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as actual_count
      FROM assessments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `);

    const [predicted] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as predicted_count
      FROM forecast_results WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `);

    if (!actual.length || !predicted.length) return 85;

    let errors = 0;
    for (let i = 0; i < Math.min(actual.length, predicted.length); i++) {
      const diff = Math.abs(actual[i].actual_count - (predicted[i]?.predicted_count || 0));
      const max = Math.max(actual[i].actual_count, 1);
      errors += diff / max;
    }
    const mape = errors / Math.min(actual.length, predicted.length);
    return Math.round(Math.max(0, Math.min(100, (1 - mape) * 100)));
  }

  async getModels() {
    return await forecastRepo.getModels();
  }

  async generate(data) {
    const { region_id, target_year, model_type } = data;
    const currentYear = new Date().getFullYear();

    let baseValue = 0;
    let growthRate = 0;
    let confidence = 85;
    let dataPoints = { sources: [], calculations: [] };

    if (region_id) {
      const region = await regionRepo.findById(region_id);
      if (!region) throw new Error('Region not found');

      const salesTrend = await salesRepo.getYearlyTrend(region_id);
      const population = await populationRepo.getLatestByRegion(region_id);
      const importTrend = await importRepo.getYearlyTrend(region_id);
      const assessments = await assessmentRepo.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(suggested_value), 0) as value FROM assessments WHERE region_id = ? AND status = 'completed'`,
        [region_id]
      );

      dataPoints.sources = {
        region: region.name,
        sales_records: salesTrend.length,
        population_data: !!population,
        import_records: importTrend.length,
        assessments_completed: assessments[0].count
      };

      const avgSales = salesTrend.length > 0
        ? salesTrend.reduce((s, r) => s + parseFloat(r.total_quantity), 0) / salesTrend.length
        : 0;

      const popFactor = population
        ? Math.round(population.population * (population.e_waste_per_capita || 0.005))
        : Math.round(region.population * 0.005);

      const importAvg = importTrend.length > 0
        ? importTrend.reduce((s, r) => s + parseFloat(r.total_quantity), 0) / importTrend.length
        : 0;

      const assessmentAvg = assessments[0].count > 0
        ? Math.round(assessments[0].value / assessments[0].count)
        : 0;

      baseValue = Math.round((avgSales * 0.3) + (popFactor * 0.3) + (importAvg * 0.2) + (assessmentAvg * 0.2));
      if (baseValue < 500) baseValue = 5000;

      if (salesTrend.length >= 2) {
        const first = parseFloat(salesTrend[0].total_quantity);
        const last = parseFloat(salesTrend[salesTrend.length - 1].total_quantity);
        if (first > 0) growthRate = ((last - first) / first) * 100;
      }

      if (population) growthRate = (growthRate + parseFloat(population.growth_rate)) / 2;

      dataPoints.calculations = {
        avg_sales_quantity: Math.round(avgSales),
        population_factor: popFactor,
        avg_import_quantity: Math.round(importAvg),
        avg_assessment_value: assessmentAvg,
        base_value: baseValue,
        growth_rate_used: Math.round(growthRate * 100) / 100
      };
    } else {
      const allSales = await pool.query('SELECT COALESCE(AVG(quantity), 0) as avg_qty, COALESCE(AVG(revenue), 0) as avg_rev FROM sales_data');
      const totalAssessments = await assessmentRepo.count();
      baseValue = Math.round(Math.max(5000, (parseFloat(allSales[0].avg_qty) * 100) + (totalAssessments * 1000)));
      growthRate = 4.5;

      dataPoints.sources = { region: 'all', sales_avg: allSales[0].avg_qty };
      dataPoints.calculations = { base_value: baseValue, growth_rate_used: growthRate };
    }

    const modelFactors = {
      'linear': { mult: 1, confidenceBase: 85 },
      'exponential': { mult: 1.5, confidenceBase: 75 },
      'moving_average': { mult: 0.9, confidenceBase: 88 },
      'arima': { mult: 1.1, confidenceBase: 82 }
    };
    const factor = modelFactors[model_type] || modelFactors['linear'];
    const effectiveGrowth = growthRate || 3.0;
    const adjustedGrowth = effectiveGrowth * factor.mult;
    confidence = Math.min(98, Math.round(factor.confidenceBase + (adjustedGrowth / 10)));

    const years1 = target_year - currentYear;
    const years3 = Math.max(years1 + 2, 3);
    const years5 = Math.max(years1 + 4, 5);

    const prediction_1yr = Math.round(baseValue * Math.pow(1 + adjustedGrowth / 100, years1));
    const prediction_3yr = Math.round(baseValue * Math.pow(1 + adjustedGrowth / 100, years3));
    const prediction_5yr = Math.round(baseValue * Math.pow(1 + adjustedGrowth / 100, years5));
    const opportunityScore = Math.min(99, Math.round((Math.abs(adjustedGrowth) / 15) * 100));

    const result = await forecastRepo.create({
      region_id: region_id || null,
      target_year,
      model_type: model_type || 'linear',
      prediction_1yr,
      prediction_3yr,
      prediction_5yr,
      growth_rate: Math.round(adjustedGrowth * 100) / 100,
      opportunity_score: opportunityScore,
      confidence_interval: confidence,
      data_points: JSON.stringify(dataPoints),
      generated_by: data.generated_by || null,
      status: 'published'
    });

    return {
      id: result.id,
      region_id,
      target_year,
      predictions: { 1: prediction_1yr, 3: prediction_3yr, 5: prediction_5yr },
      growth_rate: Math.round(adjustedGrowth * 100) / 100,
      opportunity_score: opportunityScore,
      confidence,
      data_points: dataPoints
    };
  }

  async getAll(filters = {}) {
    let sql = `
      SELECT fr.*, r.name as region_name
      FROM forecast_results fr
      LEFT JOIN regions r ON fr.region_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.region_id) { sql += ' AND fr.region_id = ?'; params.push(filters.region_id); }
    if (filters.model_type) { sql += ' AND fr.model_type = ?'; params.push(filters.model_type); }
    if (filters.status) { sql += ' AND fr.status = ?'; params.push(filters.status); }
    if (filters.date_from) { sql += ' AND DATE(fr.created_at) >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { sql += ' AND DATE(fr.created_at) <= ?'; params.push(filters.date_to); }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query(sql.replace('SELECT fr.*, r.name', 'SELECT COUNT(*) as total'), params);

    sql += ' ORDER BY fr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await pool.query(sql, params);

    return {
      data: rows,
      pagination: { page, limit, total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / limit) }
    };
  }

  async getResults(id) {
    const [rows] = await pool.query(`
      SELECT fr.*, r.name as region_name
      FROM forecast_results fr
      LEFT JOIN regions r ON fr.region_id = r.id
      WHERE fr.id = ?
    `, [id]);
    if (!rows[0]) throw new Error('Forecast result not found');
    return rows[0];
  }

  async getResultsByRegion(regionId) {
    return await forecastRepo.query(
      'SELECT * FROM forecast_results WHERE region_id = ? ORDER BY target_year DESC',
      [regionId]
    );
  }

  async uploadDataset(data) {
    const inputId = await forecastRepo.saveInput(data);

    if (data.row_count) {
      await forecastInputRepo.updateRowCount(inputId, data.row_count);
    }

    return inputId;
  }

  async getInputs(filters = {}) {
    let sql = 'SELECT * FROM forecast_inputs WHERE 1=1';
    const params = [];
    if (filters.data_type) { sql += ' AND data_type = ?'; params.push(filters.data_type); }
    if (filters.status) { sql += ' AND status = ?'; params.push(filters.status); }
    sql += ' ORDER BY created_at DESC';
    return await pool.query(sql, params);
  }

  async validateInput(inputId) {
    const input = await forecastInputRepo.findById(inputId);
    if (!input) throw new Error('Input not found');

    if (input.file_path) {
      const fs = require('fs');
      if (!fs.existsSync(input.file_path)) {
        await forecastInputRepo.updateStatus(inputId, 'failed');
        throw new Error('Uploaded file not found on disk');
      }
    }

    await forecastInputRepo.updateStatus(inputId, 'validated');

    return { id: inputId, status: 'validated', message: 'Input validated successfully' };
  }

  async getChartData() {
    const [trend] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
        COALESCE(AVG(prediction_1yr), 0) as predicted,
        COALESCE((SELECT COUNT(*) FROM assessments WHERE DATE_FORMAT(created_at, '%Y-%m') = month), 0) as actual
      FROM forecast_results
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month ORDER BY month
    `);

    const [productForecast] = await pool.query(`
      SELECT p.type as product_type, COALESCE(SUM(fr.prediction_1yr), 0) as predicted_value
      FROM forecast_results fr
      CROSS JOIN (SELECT DISTINCT type FROM products) p
      GROUP BY p.type ORDER BY predicted_value DESC LIMIT 5
    `);

    const [regionForecast] = await pool.query(`
      SELECT r.name as region,
        COALESCE(SUM(fr.prediction_1yr), 0) as prediction_2026,
        COALESCE(SUM(fr.prediction_3yr), 0) as prediction_2028
      FROM regions r
      LEFT JOIN forecast_results fr ON r.id = fr.region_id
      GROUP BY r.id, r.name
    `);

    return { trend, productForecast, regionForecast };
  }
}

module.exports = new ForecastService();
