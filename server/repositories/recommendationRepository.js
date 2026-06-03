const BaseRepository = require('./baseRepository');

class RecommendationRepository extends BaseRepository {
  constructor() {
    super('recommendations');
  }

  async getWithRegion() {
    const [rows] = await this.query(`
      SELECT r.*, reg.name as region_name
      FROM recommendations r
      LEFT JOIN regions reg ON r.region_id = reg.id
      ORDER BY r.created_at DESC
    `);
    return rows;
  }

  async updateStatus(id, status) {
    await this.query('UPDATE recommendations SET status = ? WHERE id = ?', [status, id]);
  }
}

module.exports = RecommendationRepository;
