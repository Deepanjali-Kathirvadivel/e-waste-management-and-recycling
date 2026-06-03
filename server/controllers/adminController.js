const AdminRepository = require('../repositories/adminRepository');
const ForecastRepository = require('../repositories/forecastRepository');
const pool = require('../config/db');

const adminRepo = new AdminRepository();
const forecastRepo = new ForecastRepository();

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const stats = await adminRepo.getDashboardStats();
      const collectionTrend = await adminRepo.getChartData_collectionTrend();
      const revenueByRegion = await adminRepo.getChartData_revenueByRegion();
      const productDistribution = await adminRepo.getChartData_productDistribution();
      const reusabilityBreakdown = await adminRepo.getChartData_reusabilityBreakdown();

      const forecastData = await forecastRepo.getDashboard();

      const [forecastAccuracy] = await pool.query(`
        SELECT COALESCE(AVG(confidence_interval), 80) as accuracy FROM forecast_results WHERE status = 'published'
      `);

      const [sustainabilityScore] = await pool.query(`
        SELECT COALESCE(AVG(score), 0) as score FROM reusability_scores
      `);

      const [revenueTrend] = await pool.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(suggested_value), 0) as revenue
        FROM assessments WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month ORDER BY month
      `);

      const [regionPerformance] = await pool.query(`
        SELECT r.name as region,
          COUNT(a.id) as collections,
          COALESCE(SUM(a.suggested_value), 0) as revenue,
          COALESCE(AVG(rs.score), 0) as reusability_score
        FROM regions r
        LEFT JOIN assessments a ON r.id = a.region_id AND a.status = 'completed'
        LEFT JOIN reusability_scores rs ON a.id = rs.assessment_id
        GROUP BY r.id, r.name
        ORDER BY revenue DESC
      `);

      res.json({
        totalStaff: stats.totalStaff,
        totalCollections: stats.totalCollections,
        totalProducts: stats.totalProducts,
        totalRevenue: stats.totalRevenue,
        totalProfit: stats.totalProfit,
        forecastAccuracy: Math.round(forecastAccuracy[0].accuracy),
        sustainabilityScore: Math.round(sustainabilityScore[0].score),
        charts: {
          collectionTrend,
          revenueTrend,
          productDistribution,
          regionPerformance,
          reusabilityBreakdown
        }
      });
    } catch (err) { next(err); }
  }
}

module.exports = new AdminController();
