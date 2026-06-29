const router = require('express').Router();
const { auth, rbac } = require('../../middleware/auth');
const ctrl = require('../../controllers/forecast.controller');
const { uploadForecast } = require('../../config/upload');

router.get('/dashboard', auth, rbac('admin', 'root'), ctrl.dashboard);
router.post('/generate', auth, rbac('admin', 'root'), ctrl.generate);
router.get('/results', auth, rbac('admin', 'root'), ctrl.results);
router.get('/opportunity', auth, rbac('admin', 'root'), ctrl.opportunity);
router.get('/demand-forecast', auth, rbac('admin', 'root'), ctrl.demandForecast);
router.post('/upload', auth, rbac('admin', 'root'), uploadForecast.single('file'), ctrl.uploadForecastData);
router.post('/data/validate', auth, rbac('admin', 'root'), ctrl.validateData);
router.post('/data/import', auth, rbac('admin', 'root'), ctrl.importData);

module.exports = { route: '/forecast', router };
