const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const assessmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads/assessments'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `assessment_${uuidv4()}${ext}`);
  },
});

const forecastStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads/forecast'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `forecast_${uuidv4()}${ext}`);
  },
});

const uploadAssessment = multer({
  storage: assessmentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.split('/')[1]);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Only JPG, PNG, WebP images allowed (max 5MB)'));
  },
});

const uploadForecast = multer({
  storage: forecastStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /xlsx|xls|csv/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    if (extOk) return cb(null, true);
    cb(new Error('Only .xlsx, .xls, .csv files allowed (max 10MB)'));
  },
});

module.exports = { uploadAssessment, uploadForecast };
