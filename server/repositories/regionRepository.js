const BaseRepository = require('./baseRepository');

class RegionRepository extends BaseRepository {
  constructor() {
    super('regions');
  }

  async findByCode(code) {
    const [rows] = await this.query('SELECT * FROM regions WHERE code = ?', [code]);
    return rows[0] || null;
  }

  async getSummary() {
    const [rows] = await this.query(`
      SELECT
        COUNT(*) as total_regions,
        COALESCE(SUM(population), 0) as total_population,
        COALESCE(SUM(waste_volume), 0) as total_waste,
        COALESCE(SUM(collection_quantity), 0) as total_collection,
        COALESCE(SUM(revenue), 0) as total_revenue
      FROM regions
    `);
    return rows;
  }
}

module.exports = RegionRepository;
