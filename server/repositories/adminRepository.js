const BaseRepository = require('./baseRepository');

class AdminRepository extends BaseRepository {
  constructor() {
    super('admins');
  }

  async findByUsername(username) {
    const [rows] = await this.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await this.query('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async updateLastLogin(id) {
    await this.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [id]);
  }

  async getDashboardStats() {
    const [staffCount] = await this.query('SELECT COUNT(*) as total FROM staff WHERE status = ?', ['active']);
    const [assessments] = await this.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed FROM assessments', ['completed']);
    const [products] = await this.query('SELECT COUNT(*) as total FROM products');
    const [revenue] = await this.query('SELECT COALESCE(SUM(suggested_value), 0) as total FROM assessments WHERE status = ?', ['completed']);
    const [profit] = await this.query('SELECT COALESCE(SUM(net_profit), 0) as total FROM profit_analysis WHERE scenario_type = ?', ['current']);
    const [sustainability] = await this.query('SELECT COALESCE(AVG(score), 0) as avg_score FROM reusability_scores');

    return {
      totalStaff: staffCount[0].total,
      totalCollections: assessments[0].total,
      totalProducts: products[0].total,
      totalRevenue: revenue[0].total,
      totalProfit: profit[0].total,
      sustainabilityScore: Math.round(sustainability[0].avg_score)
    };
  }

  async getChartData_collectionTrend() {
    const [rows] = await this.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM assessments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `);
    return rows;
  }

  async getChartData_revenueByRegion() {
    const [rows] = await this.query(`
      SELECT r.name as region, COALESCE(SUM(a.suggested_value), 0) as revenue
      FROM regions r LEFT JOIN assessments a ON r.id = a.region_id AND a.status = 'completed'
      GROUP BY r.id, r.name
    `);
    return rows;
  }

  async getChartData_productDistribution() {
    const [rows] = await this.query(`
      SELECT p.type, COUNT(*) as count
      FROM assessments a JOIN products p ON a.product_id = p.id
      GROUP BY p.type ORDER BY count DESC
    `);
    return rows;
  }

  async getChartData_reusabilityBreakdown() {
    const [rows] = await this.query(`
      SELECT classification, COUNT(*) as count
      FROM reusability_scores
      GROUP BY classification
    `);
    return rows;
  }
}

module.exports = AdminRepository;
