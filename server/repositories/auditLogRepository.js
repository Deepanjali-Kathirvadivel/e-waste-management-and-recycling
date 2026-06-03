const BaseRepository = require('./baseRepository');

class AuditLogRepository extends BaseRepository {
  constructor() {
    super('audit_logs');
  }

  async getFiltered(filters = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (filters.module) { sql += ' AND module = ?'; params.push(filters.module); }
    if (filters.user_id) { sql += ' AND user_id = ?'; params.push(filters.user_id); }
    if (filters.action) { sql += ' AND action LIKE ?'; params.push(`%${filters.action}%`); }
    if (filters.date_from) { sql += ' AND DATE(created_at) >= ?'; params.push(filters.date_from); }
    if (filters.date_to) { sql += ' AND DATE(created_at) <= ?'; params.push(filters.date_to); }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await this.query(
      sql.replace('SELECT *', 'SELECT COUNT(*) as total'),
      params
    );

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [dataRows] = await this.query(sql, params);

    return {
      data: dataRows,
      pagination: { page, limit, total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / limit) }
    };
  }
}

module.exports = AuditLogRepository;
