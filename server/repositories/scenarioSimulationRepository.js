const BaseRepository = require('./baseRepository');

class ScenarioSimulationRepository extends BaseRepository {
  constructor() {
    super('scenario_simulations');
  }

  async getWithRegion() {
    const [rows] = await this.query(`
      SELECT ss.*, r.name as region_name
      FROM scenario_simulations ss
      LEFT JOIN regions r ON ss.region_id = r.id
      ORDER BY ss.created_at DESC
    `);
    return rows;
  }

  async getByType(type) {
    const [rows] = await this.query(
      'SELECT ss.*, r.name as region_name FROM scenario_simulations ss LEFT JOIN regions r ON ss.region_id = r.id WHERE ss.type = ? ORDER BY ss.created_at DESC',
      [type]
    );
    return rows;
  }

  async getStats() {
    const [row] = await this.query(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(AVG(delta_percentage), 0) as avg_delta_percentage,
        COALESCE(SUM(CASE WHEN delta > 0 THEN 1 ELSE 0 END), 0) as profitable_simulations
      FROM scenario_simulations
    `);
    return row[0];
  }
}

module.exports = ScenarioSimulationRepository;
