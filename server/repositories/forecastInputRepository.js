const BaseRepository = require('./baseRepository');

class ForecastInputRepository extends BaseRepository {
  constructor() {
    super('forecast_inputs');
  }

  async getByDataType(dataType) {
    const [rows] = await this.query(
      'SELECT * FROM forecast_inputs WHERE data_type = ? ORDER BY created_at DESC',
      [dataType]
    );
    return rows;
  }

  async getValidated() {
    const [rows] = await this.query(
      "SELECT * FROM forecast_inputs WHERE status = 'validated' ORDER BY created_at DESC"
    );
    return rows;
  }

  async updateStatus(id, status) {
    await this.query('UPDATE forecast_inputs SET status = ? WHERE id = ?', [status, id]);
  }

  async updateRowCount(id, count) {
    await this.query('UPDATE forecast_inputs SET row_count = ? WHERE id = ?', [count, id]);
  }
}

module.exports = ForecastInputRepository;
