const BaseRepository = require('./baseRepository');

class ForecastRepository extends BaseRepository {
  constructor() {
    super('forecast_results');
  }

  async getDashboard() {
    const [forecastedWaste] = await this.query(
      'SELECT COALESCE(AVG(prediction_1yr), 0) as value FROM forecast_results WHERE status = ?',
      ['published']
    );
    const [growthRate] = await this.query(
      'SELECT COALESCE(AVG(growth_rate), 0) as value FROM forecast_results WHERE status = ?',
      ['published']
    );
    const [opportunityScore] = await this.query(
      'SELECT COALESCE(AVG(opportunity_score), 0) as value FROM forecast_results WHERE status = ?',
      ['published']
    );
    const [predictedRevenue] = await this.query(
      'SELECT COALESCE(AVG(prediction_1yr), 0) * 150 as value FROM forecast_results WHERE status = ?',
      ['published']
    );

    return {
      forecastedWaste: forecastedWaste[0].value,
      growthRate: growthRate[0].value,
      opportunityScore: opportunityScore[0].value,
      predictedRevenue: predictedRevenue[0].value
    };
  }

  async getModels() {
    return [
      { id: 'linear', name: 'Linear Regression', description: 'Simple linear trend projection' },
      { id: 'exponential', name: 'Exponential Growth', description: 'Exponential growth model for rapid expansion' },
      { id: 'moving_average', name: 'Moving Average', description: '3-year moving average smoothing' },
      { id: 'arima', name: 'ARIMA', description: 'Advanced time series forecasting' }
    ];
  }

  async saveInput(data) {
    const [result] = await this.query(
      `INSERT INTO forecast_inputs (name, data_type, file_path, original_name, file_size, uploaded_by, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.data_type, data.file_path, data.original_name, data.file_size, data.uploaded_by, JSON.stringify(data.metadata || {})]
    );
    return result.insertId;
  }
}

module.exports = ForecastRepository;
