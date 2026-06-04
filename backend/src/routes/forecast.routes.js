const router = require('express').Router();
const ctrl = require('../controllers/forecast.controller');
const { auth, rbac } = require('../middleware/auth');
const { uploadForecast } = require('../config/upload');

router.get('/dashboard', auth, rbac('admin', 'root'), ctrl.dashboard);
router.post('/generate', auth, rbac('admin', 'root'), ctrl.generate);
router.get('/results', auth, rbac('admin', 'root'), ctrl.results);
router.post('/upload', auth, rbac('admin', 'root'), uploadForecast.single('file'), ctrl.uploadForecastData);
router.post('/data/validate', auth, rbac('admin', 'root'), ctrl.validateData);
router.post('/data/import', auth, rbac('admin', 'root'), ctrl.importData);

module.exports = router;
