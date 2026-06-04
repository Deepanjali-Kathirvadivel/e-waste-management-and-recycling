const { ForecastData, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const pagination = require('../utils/pagination');
const { log } = require('../services/activity.service');

exports.importData = catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const dataType = req.body.data_type || 'historical_collection';
  const record = await ForecastData.create({
    type: dataType, filename: req.file.filename,
    original_name: req.file.originalname, file_path: req.file.path,
    uploaded_by: req.user.id, status: 'uploaded', row_count: 0,
  });
  await log({ userId: req.user.id, action: 'data_imported', entityType: 'import', entityId: record.id, metadata: { type: dataType } });
  res.json({ data: record, message: 'Data imported successfully' });
});

exports.history = catchAsync(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const { rows, count } = await ForecastData.findAndCountAll({
    limit, offset, order: [['created_at', 'DESC']],
    include: [{ model: User, attributes: ['full_name'] }],
  });
  res.json({ imports: rows, total: count, page, total_pages: Math.ceil(count / limit) });
});
