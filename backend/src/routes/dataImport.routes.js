const router = require('express').Router();
const ctrl = require('../controllers/dataImport.controller');
const { auth, rbac } = require('../middleware/auth');
const { uploadForecast } = require('../config/upload');

router.post('/', auth, rbac('admin', 'root'), uploadForecast.single('file'), ctrl.importData);
router.get('/history', auth, rbac('admin', 'root'), ctrl.history);

module.exports = router;
