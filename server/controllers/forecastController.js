const forecastService = require('../services/forecastService');

class ForecastController {
  async getDashboard(req, res, next) {
    try {
      const dashboard = await forecastService.getDashboard();
      const chartData = await forecastService.getChartData();
      res.json({ ...dashboard, charts: chartData });
    } catch (err) { next(err); }
  }

  async getModels(req, res, next) {
    try {
      const models = await forecastService.getModels();
      res.json(models);
    } catch (err) { next(err); }
  }

  async getAll(req, res, next) {
    try {
      const results = await forecastService.getAll(req.query);
      res.json(results);
    } catch (err) { next(err); }
  }

  async generate(req, res, next) {
    try {
      const data = { ...req.body, generated_by: req.user.id };
      const result = await forecastService.generate(data);
      res.status(201).json(result);
    } catch (err) {
      if (err.message === 'Region not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async getResults(req, res, next) {
    try {
      const result = await forecastService.getResults(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Forecast result not found') return res.status(404).json({ message: err.message });
      next(err);
    }
  }

  async getResultsByRegion(req, res, next) {
    try {
      const results = await forecastService.getResultsByRegion(req.params.regionId);
      res.json(results);
    } catch (err) { next(err); }
  }

  async upload(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      const result = await forecastService.uploadDataset({
        name: req.body.name || req.file.originalname,
        data_type: req.body.data_type || 'collection',
        file_path: req.file.path,
        original_name: req.file.originalname,
        file_size: req.file.size,
        uploaded_by: req.user.id,
        row_count: parseInt(req.body.rows) || 0,
        metadata: { original_extension: req.file.originalname.split('.').pop() }
      });

      res.json({ id: result, message: 'File uploaded successfully' });
    } catch (err) { next(err); }
  }

  async getInputs(req, res, next) {
    try {
      const inputs = await forecastService.getInputs(req.query);
      res.json(inputs);
    } catch (err) { next(err); }
  }

  async validateInput(req, res, next) {
    try {
      const result = await forecastService.validateInput(req.params.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Input not found') return res.status(404).json({ message: err.message });
      if (err.message === 'Uploaded file not found on disk') return res.status(400).json({ message: err.message });
      next(err);
    }
  }

  async getChartData(req, res, next) {
    try {
      const chartData = await forecastService.getChartData();
      res.json(chartData);
    } catch (err) { next(err); }
  }
}

module.exports = new ForecastController();
