const ReportRepository = require('../repositories/reportRepository');
const pool = require('../config/db');
const path = require('path');
const config = require('../config');

const reportRepo = new ReportRepository();

class ReportService {
  async getCollectionReportData() {
    const [total] = await pool.query('SELECT COUNT(*) as total FROM assessments');
    const [completed] = await pool.query("SELECT COUNT(*) as total FROM assessments WHERE status = 'completed'");
    const [byRegion] = await pool.query(`
      SELECT r.name, COUNT(*) as count FROM assessments a
      JOIN regions r ON a.region_id = r.id GROUP BY r.name
    `);
    const [byType] = await pool.query(`
      SELECT p.type, COUNT(*) as count FROM assessments a
      JOIN products p ON a.product_id = p.id GROUP BY p.type
    `);
    const [recent] = await pool.query(`
      SELECT a.assessment_code, c.name as customer, p.name as product, a.status, a.created_at
      FROM assessments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN products p ON a.product_id = p.id
      ORDER BY a.created_at DESC LIMIT 20
    `);

    return { total: total[0].total, completed: completed[0].total, byRegion, byType, recent };
  }

  async getForecastReportData() {
    const [results] = await pool.query(`
      SELECT fr.*, r.name as region_name
      FROM forecast_results fr LEFT JOIN regions r ON fr.region_id = r.id
      ORDER BY fr.created_at DESC LIMIT 10
    `);
    const [inputs] = await pool.query('SELECT * FROM forecast_inputs ORDER BY created_at DESC LIMIT 10');
    return { results, inputs };
  }

  async getReusabilityReportData() {
    const [summary] = await pool.query(`
      SELECT classification, COUNT(*) as count,
             COALESCE(AVG(score), 0) as avg_score,
             COALESCE(SUM(v.suggested_value), 0) as total_value
      FROM reusability_scores rs
      LEFT JOIN valuations v ON rs.assessment_id = v.assessment_id
      GROUP BY classification
    `);
    const [byProduct] = await pool.query(`
      SELECT p.type, rs.classification, COUNT(*) as count
      FROM reusability_scores rs JOIN assessments a ON rs.assessment_id = a.id
      JOIN products p ON a.product_id = p.id GROUP BY p.type, rs.classification
    `);
    return { summary, byProduct };
  }

  async getProfitabilityReportData() {
    const [summary] = await pool.query('SELECT * FROM profit_analysis ORDER BY created_at DESC');
    const [logistics] = await pool.query('SELECT * FROM logistics_data WHERE status = ?', ['active']);
    return { scenarios: summary, logistics };
  }

  async getSustainabilityReportData() {
    const [scores] = await pool.query('SELECT * FROM reusability_scores ORDER BY created_at DESC LIMIT 100');
    const [regions] = await pool.query(`
      SELECT r.name,
             COUNT(a.id) as collections,
             COALESCE(SUM(a.suggested_value), 0) as value
      FROM regions r LEFT JOIN assessments a ON r.id = a.region_id
      GROUP BY r.id, r.name
    `);
    return { scores, regions };
  }

  async getStaffPerformanceReportData() {
    const [staff] = await pool.query(`
      SELECT s.full_name, s.role, r.name as region,
             COUNT(a.id) as total_assessments,
             COALESCE(SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
             COALESCE(SUM(a.suggested_value), 0) as total_value
      FROM staff s
      LEFT JOIN assessments a ON s.id = a.staff_id
      LEFT JOIN regions r ON s.region_id = r.id
      GROUP BY s.id, s.full_name, s.role, r.name
      ORDER BY total_assessments DESC
    `);
    return { staff };
  }
}

module.exports = new ReportService();
