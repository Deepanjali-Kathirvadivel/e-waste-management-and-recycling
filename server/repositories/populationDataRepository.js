const BaseRepository = require('./baseRepository');

class PopulationDataRepository extends BaseRepository {
  constructor() {
    super('population_data');
  }

  async getByRegion(regionId) {
    const [rows] = await this.query(
      'SELECT * FROM population_data WHERE region_id = ? ORDER BY year',
      [regionId]
    );
    return rows;
  }

  async getByRegionAndYear(regionId, year) {
    const [rows] = await this.query(
      'SELECT * FROM population_data WHERE region_id = ? AND year = ?',
      [regionId, year]
    );
    return rows[0] || null;
  }

  async getLatestByRegion(regionId) {
    const [rows] = await this.query(
      'SELECT * FROM population_data WHERE region_id = ? ORDER BY year DESC LIMIT 1',
      [regionId]
    );
    return rows[0] || null;
  }

  async getGrowthTrend(regionId) {
    const [rows] = await this.query(
      'SELECT year, population, growth_rate, e_waste_per_capita FROM population_data WHERE region_id = ? ORDER BY year',
      [regionId]
    );
    return rows;
  }

  async getEwasteProjection(regionId, targetYear) {
    const latest = await this.getLatestByRegion(regionId);
    if (!latest) return null;
    const yearsDiff = targetYear - latest.year;
    const projectedPopulation = Math.round(latest.population * Math.pow(1 + (latest.growth_rate / 100), yearsDiff));
    const projectedEwaste = Math.round(projectedPopulation * (latest.e_waste_per_capita || 0.005));
    return {
      base_year: latest.year,
      base_population: latest.population,
      growth_rate: latest.growth_rate,
      e_waste_per_capita: latest.e_waste_per_capita,
      projected_population: projectedPopulation,
      projected_ewaste: projectedEwaste
    };
  }

  async bulkInsert(records) {
    if (!records.length) return 0;
    const placeholders = records.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const values = records.flatMap(r => [r.region_id, r.year, r.population, r.growth_rate, r.e_waste_per_capita]);
    const [result] = await this.query(
      `INSERT INTO population_data (region_id, year, population, growth_rate, e_waste_per_capita) VALUES ${placeholders}`,
      values
    );
    return result.affectedRows;
  }
}

module.exports = PopulationDataRepository;
