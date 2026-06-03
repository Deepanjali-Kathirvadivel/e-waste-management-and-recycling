const BaseRepository = require('./baseRepository');

class EnvironmentalImpactRepository extends BaseRepository {
  constructor() {
    super('environmental_impact');
  }

  async getLatest(regionId = null) {
    let sql = 'SELECT * FROM environmental_impact';
    const params = [];
    if (regionId) {
      sql += ' WHERE region_id = ?';
      params.push(regionId);
    }
    sql += ' ORDER BY recorded_at DESC LIMIT 1';
    const [rows] = await this.query(sql, params);
    return rows[0] || null;
  }

  async getTrend(regionId = null) {
    let sql = `
      SELECT DATE_FORMAT(recorded_at, '%Y-%m') as month,
             COALESCE(SUM(co2_saved), 0) as co2_saved,
             COALESCE(SUM(energy_saved), 0) as energy_saved,
             COALESCE(SUM(water_saved), 0) as water_saved,
             COALESCE(SUM(landfill_diverted), 0) as landfill_diverted
      FROM environmental_impact
    `;
    const params = [];
    if (regionId) {
      sql += ' WHERE region_id = ?';
      params.push(regionId);
    }
    sql += ' GROUP BY month ORDER BY month LIMIT 12';
    const [rows] = await this.query(sql, params);
    return rows;
  }

  async getSummary() {
    const [row] = await this.query(`
      SELECT
        COALESCE(SUM(co2_saved), 0) as total_co2_saved,
        COALESCE(SUM(energy_saved), 0) as total_energy_saved,
        COALESCE(SUM(water_saved), 0) as total_water_saved,
        COALESCE(SUM(landfill_diverted), 0) as total_landfill_diverted,
        COALESCE(SUM(material_recovered), 0) as total_material_recovered,
        COALESCE(SUM(trees_equivalent), 0) as total_trees_equivalent
      FROM environmental_impact
    `);
    return row[0];
  }
}

module.exports = EnvironmentalImpactRepository;
