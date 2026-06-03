const BaseRepository = require('./baseRepository');

class ProfitRepository extends BaseRepository {
  constructor() {
    super('profit_analysis');
  }

  async getLatestScenarios() {
    const [rows] = await this.query(`
      SELECT * FROM profit_analysis
      WHERE id IN (SELECT MAX(id) FROM profit_analysis GROUP BY scenario_type)
      ORDER BY scenario_type
    `);
    return rows;
  }

  async getComparison() {
    const [rows] = await this.query(`
      SELECT scenario_type, scenario_name, net_profit, total_cost, roi, payback_period
      FROM profit_analysis
      WHERE id IN (SELECT MAX(id) FROM profit_analysis GROUP BY scenario_type)
    `);
    return rows;
  }
}

module.exports = ProfitRepository;
