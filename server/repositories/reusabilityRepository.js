const BaseRepository = require('./baseRepository');

class ReusabilityRepository extends BaseRepository {
  constructor() {
    super('reusability_scores');
  }

  async getAnalytics(filters = {}) {
    let sql = `
      SELECT
        rs.classification,
        COUNT(*) as count,
        COALESCE(AVG(rs.score), 0) as avg_score,
        COALESCE(SUM(v.suggested_value), 0) as total_value
      FROM reusability_scores rs
      JOIN assessments a ON rs.assessment_id = a.id
      LEFT JOIN valuations v ON a.id = v.assessment_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.region_id) {
      sql += ' AND a.region_id = ?';
      params.push(filters.region_id);
    }
    if (filters.date_from) {
      sql += ' AND DATE(rs.created_at) >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      sql += ' AND DATE(rs.created_at) <= ?';
      params.push(filters.date_to);
    }

    sql += ' GROUP BY rs.classification';
    const [rows] = await this.query(sql, params);
    return rows;
  }

  async getReusabilityList(filters = {}) {
    let sql = `
      SELECT rs.*, a.assessment_code, p.name as product_name,
             p.type as product_type, p.condition,
             s.full_name as staff_name, r.name as region_name,
             v.suggested_value
      FROM reusability_scores rs
      JOIN assessments a ON rs.assessment_id = a.id
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN valuations v ON a.id = v.assessment_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.region_id) { sql += ' AND a.region_id = ?'; params.push(filters.region_id); }
    if (filters.product_type) { sql += ' AND p.type = ?'; params.push(filters.product_type); }
    if (filters.staff_id) { sql += ' AND a.staff_id = ?'; params.push(filters.staff_id); }
    if (filters.condition) { sql += ' AND p.condition = ?'; params.push(filters.condition); }
    if (filters.classification) { sql += ' AND rs.classification = ?'; params.push(filters.classification); }
    if (filters.date_from) { sql += ' AND DATE(rs.created_at) >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { sql += ' AND DATE(rs.created_at) <= ?'; params.push(filters.date_to); }

    sql += ' ORDER BY rs.created_at DESC';
    const [rows] = await this.query(sql, params);
    return rows;
  }

  async getBreakdownByProduct() {
    const [rows] = await this.query(`
      SELECT p.type, rs.classification, COUNT(*) as count
      FROM reusability_scores rs
      JOIN assessments a ON rs.assessment_id = a.id
      JOIN products p ON a.product_id = p.id
      GROUP BY p.type, rs.classification
      ORDER BY p.type, rs.classification
    `);
    return rows;
  }

  async getMonthlyTrend() {
    const [rows] = await this.query(`
      SELECT DATE_FORMAT(rs.created_at, '%Y-%m') as month,
             rs.classification, COUNT(*) as count
      FROM reusability_scores rs
      WHERE rs.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month, rs.classification
      ORDER BY month
    `);
    return rows;
  }
}

module.exports = ReusabilityRepository;
