const BaseRepository = require('./baseRepository');

class AssessmentRepository extends BaseRepository {
  constructor() {
    super('assessments');
  }

  async findByCode(code) {
    const [rows] = await this.query('SELECT * FROM assessments WHERE assessment_code = ?', [code]);
    return rows[0] || null;
  }

  async generateCode() {
    const prefix = 'GRN';
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const [result] = await this.query(
      "SELECT COUNT(*) as count FROM assessments WHERE DATE(created_at) = CURDATE()"
    );
    const seq = String(result[0].count + 1).padStart(4, '0');
    return `${prefix}${dateStr}${seq}`;
  }

  async getHistory(filters = {}) {
    let sql = `
      SELECT a.*, c.name as customer_name, p.name as product_name,
             p.type as product_type, s.full_name as staff_name,
             r.name as region_name, rs.classification, rs.score as reusability_score
      FROM assessments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN reusability_scores rs ON a.id = rs.assessment_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (a.assessment_code LIKE ? OR c.name LIKE ? OR p.name LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.status) {
      sql += ` AND a.status = ?`;
      params.push(filters.status);
    }

    if (filters.product_type) {
      sql += ` AND p.type = ?`;
      params.push(filters.product_type);
    }

    if (filters.region_id) {
      sql += ` AND a.region_id = ?`;
      params.push(filters.region_id);
    }

    if (filters.staff_id) {
      sql += ` AND a.staff_id = ?`;
      params.push(filters.staff_id);
    }

    if (filters.condition) {
      sql += ` AND p.condition = ?`;
      params.push(filters.condition);
    }

    if (filters.date_from) {
      sql += ` AND DATE(a.created_at) >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ` AND DATE(a.created_at) <= ?`;
      params.push(filters.date_to);
    }

    const countSql = sql.replace('SELECT a.*, c.name', 'SELECT COUNT(*) as total');
    const [countResult] = await this.query(countSql, params);
    const total = countResult[0].total;

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const orderBy = filters.orderBy || 'a.created_at';
    const orderDir = filters.orderDir || 'DESC';

    sql += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [dataRows] = await this.query(sql, params);

    return {
      data: dataRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async submitAssessment(id, staffId) {
    await this.query(
      `UPDATE assessments SET status = 'completed', submitted_at = NOW(), completed_at = NOW() WHERE id = ? AND staff_id = ?`,
      [id, staffId]
    );
  }
}

module.exports = AssessmentRepository;
