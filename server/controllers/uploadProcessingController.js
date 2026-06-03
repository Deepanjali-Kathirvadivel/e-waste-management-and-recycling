const uploadProcessingService = require('../services/uploadProcessingService');

class UploadProcessingController {
  async preview(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      const dataType = req.body.data_type || 'collection';
      const result = await uploadProcessingService.previewData(req.file.path, dataType);

      res.json(result);
    } catch (err) { next(err); }
  }

  async process(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      const dataType = req.body.data_type || 'collection';
      const regionId = req.body.region_id ? parseInt(req.body.region_id) : null;
      const ext = require('path').extname(req.file.path).toLowerCase();
      let records;

      if (ext === '.csv') {
        records = uploadProcessingService.parseCSV(req.file.path);
      } else {
        const sheets = await uploadProcessingService.parseExcel(req.file.path);
        records = Object.values(sheets)[0] || [];
      }

      const result = await uploadProcessingService.processAndStore(dataType, records, regionId);
      res.json(result);
    } catch (err) { next(err); }
  }

  async validate(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      const dataType = req.body.data_type || 'collection';
      const ext = require('path').extname(req.file.path).toLowerCase();
      let records;

      if (ext === '.csv') {
        records = uploadProcessingService.parseCSV(req.file.path);
      } else {
        const sheets = await uploadProcessingService.parseExcel(req.file.path);
        records = Object.values(sheets)[0] || [];
      }

      let validation;
      switch (dataType) {
        case 'collection':
        case 'sales':
          validation = uploadProcessingService.validateCollectionData(records);
          break;
        case 'population':
          validation = uploadProcessingService.validatePopulationData(records);
          break;
        case 'import':
          validation = uploadProcessingService.validateImportData(records);
          break;
        default:
          validation = { valid: records, errors: [], total: records.length, validCount: records.length, errorCount: 0 };
      }

      res.json(validation);
    } catch (err) { next(err); }
  }
}

module.exports = new UploadProcessingController();
