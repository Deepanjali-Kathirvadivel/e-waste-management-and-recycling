const BaseRepository = require('./baseRepository');

class ReportRepository extends BaseRepository {
  constructor() {
    super('reports');
  }

  async findByType(type, format) {
    const [rows] = await this.query(
      'SELECT * FROM reports WHERE type = ? AND format = ? ORDER BY created_at DESC LIMIT 1',
      [type, format]
    );
    return rows;
  }
}

module.exports = ReportRepository;
