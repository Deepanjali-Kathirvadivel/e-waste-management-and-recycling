const BaseRepository = require('./baseRepository');

class ImportDataRepository extends BaseRepository {
  constructor() {
    super('import_data');
  }

  async getByRegion(regionId) {
    const [rows] = await this.query(
      'SELECT * FROM import_data WHERE region_id = ? ORDER BY year',
      [regionId]
    );
    return rows;
  }

  async getByRegionAndYear(regionId, year) {
    const [rows] = await this.query(
      'SELECT * FROM import_data WHERE region_id = ? AND year = ?',
      [regionId, year]
    );
    return rows[0] || null;
  }

  async getYearlyTrend(regionId) {
    const [rows] = await this.query(
      'SELECT year, COALESCE(SUM(import_quantity), 0) as total_quantity, COALESCE(SUM(import_value), 0) as total_value FROM import_data WHERE region_id = ? GROUP BY year ORDER BY year',
      [regionId]
    );
    return rows;
  }

  async getTotalImportsByRegion() {
    const [rows] = await this.query(
      'SELECT r.name as region, COALESCE(SUM(i.import_quantity), 0) as total_quantity, COALESCE(SUM(i.import_value), 0) as total_value FROM regions r LEFT JOIN import_data i ON r.id = i.region_id GROUP BY r.id, r.name'
    );
    return rows;
  }

  async bulkInsert(records) {
    if (!records.length) return 0;
    const placeholders = records.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const values = records.flatMap(r => [r.region_id, r.year, r.import_quantity, r.import_value, r.source_country]);
    const [result] = await this.query(
      `INSERT INTO import_data (region_id, year, import_quantity, import_value, source_country) VALUES ${placeholders}`,
      values
    );
    return result.affectedRows;
  }
}

module.exports = ImportDataRepository;
