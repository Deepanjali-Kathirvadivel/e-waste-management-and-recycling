const BaseRepository = require('./baseRepository');

class StaffRepository extends BaseRepository {
  constructor() {
    super('staff');
  }

  async findByUsername(username) {
    const [rows] = await this.query('SELECT * FROM staff WHERE username = ?', [username]);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await this.query('SELECT * FROM staff WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async updateLastLogin(id) {
    await this.query('UPDATE staff SET last_login = NOW() WHERE id = ?', [id]);
  }

  async getDashboardStats(staffId) {
    const [todayCollections] = await this.query(
      'SELECT COUNT(*) as count FROM assessments WHERE staff_id = ? AND DATE(created_at) = CURDATE()',
      [staffId]
    );
    const [totalAssessments] = await this.query(
      'SELECT COUNT(*) as count FROM assessments WHERE staff_id = ?',
      [staffId]
    );
    const [pendingAssessments] = await this.query(
      'SELECT COUNT(*) as count FROM assessments WHERE staff_id = ? AND status IN (?, ?)',
      [staffId, 'draft', 'pending']
    );
    const [completedAssessments] = await this.query(
      'SELECT COUNT(*) as count FROM assessments WHERE staff_id = ? AND status = ?',
      [staffId, 'completed']
    );
    const [collectionValue] = await this.query(
      'SELECT COALESCE(SUM(suggested_value), 0) as total FROM assessments WHERE staff_id = ? AND status = ?',
      [staffId, 'completed']
    );

    return {
      todayCollections: todayCollections[0].count,
      totalAssessments: totalAssessments[0].count,
      pendingAssessments: pendingAssessments[0].count,
      completedAssessments: completedAssessments[0].count,
      collectionValue: collectionValue[0].total
    };
  }

  async getRecentActivities(staffId, limit = 10) {
    const [rows] = await this.query(`
      SELECT aa.*, a.assessment_code
      FROM assessment_audit aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE a.staff_id = ?
      ORDER BY aa.created_at DESC LIMIT ?
    `, [staffId, limit]);
    return rows;
  }

  async getStaffWithRegion() {
    const [rows] = await this.query(`
      SELECT s.*, r.name as region_name
      FROM staff s
      LEFT JOIN regions r ON s.region_id = r.id
      ORDER BY s.created_at DESC
    `);
    return rows;
  }

  async getPerformanceMetrics(staffId) {
    const [metrics] = await this.query(`
      SELECT
        COUNT(*) as total_assessments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as pending,
        COALESCE(AVG(suggested_value), 0) as avg_value,
        COALESCE(SUM(suggested_value), 0) as total_value
      FROM assessments WHERE staff_id = ?
    `, [staffId]);
    return metrics[0];
  }
}

module.exports = StaffRepository;
