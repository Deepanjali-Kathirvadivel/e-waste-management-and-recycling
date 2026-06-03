const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const reportService = require('../services/reportService');
const ReportRepository = require('../repositories/reportRepository');
const ReportGenerator = require('../utils/reportGenerator');

const reportRepo = new ReportRepository();
const generator = new ReportGenerator();

const reportHandlers = {
  collection: () => reportService.getCollectionReportData(),
  forecast: () => reportService.getForecastReportData(),
  reusability: () => reportService.getReusabilityReportData(),
  profitability: () => reportService.getProfitabilityReportData(),
  sustainability: () => reportService.getSustainabilityReportData(),
  staff_performance: () => reportService.getStaffPerformanceReportData()
};

router.get('/pdf/:type', authenticateToken, authorizeAdmin, async (req, res, next) => {
  try {
    const { type } = req.params;
    const handler = reportHandlers[type];
    if (!handler) return res.status(400).json({ message: 'Invalid report type' });

    const data = await handler();
    const result = await generator.generatePdf(data, type);

    await reportRepo.create({
      title: `${type.replace('_', ' ')} Report`,
      type,
      format: 'pdf',
      file_path: result.filePath,
      generated_by: req.user.id,
      parameters: JSON.stringify({ type })
    });

    res.download(result.filePath, result.fileName);
  } catch (err) { next(err); }
});

router.get('/excel/:type', authenticateToken, authorizeAdmin, async (req, res, next) => {
  try {
    const { type } = req.params;
    const handler = reportHandlers[type];
    if (!handler) return res.status(400).json({ message: 'Invalid report type' });

    const data = await handler();
    const result = await generator.generateExcel(data, type);

    await reportRepo.create({
      title: `${type.replace('_', ' ')} Report`,
      type,
      format: 'excel',
      file_path: result.filePath,
      generated_by: req.user.id,
      parameters: JSON.stringify({ type })
    });

    res.download(result.filePath, result.fileName);
  } catch (err) { next(err); }
});

module.exports = router;
