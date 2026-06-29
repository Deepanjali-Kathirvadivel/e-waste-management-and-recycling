const router = require('express').Router();
const { auth, rbac } = require('../../middleware/auth');
const { uploadAssessment } = require('../../config/upload');
const ctrl = require('../../controllers/assessment.controller');

router.get('/', auth, rbac('employee', 'manager', 'admin'), ctrl.list);
router.post('/', auth, rbac('employee', 'manager', 'admin'), ctrl.create);
router.get('/export', auth, rbac('employee', 'manager', 'admin'), ctrl.exportData);
router.get('/catalog/:category', auth, rbac('employee', 'manager', 'admin'), ctrl.getCatalogByCategory);
router.post('/ai-analyze', auth, rbac('employee', 'manager', 'admin'), ctrl.aiAnalyze);
router.post('/upload-image', auth, rbac('employee', 'manager', 'admin'), uploadAssessment.single('image'), ctrl.uploadImage);
router.get('/:id', auth, rbac('employee', 'manager', 'admin'), ctrl.getOne);
router.put('/:id', auth, rbac('employee', 'manager', 'admin'), ctrl.update);
router.put('/:id/details', auth, rbac('employee', 'manager', 'admin'), ctrl.updateDetails);
router.delete('/:id', auth, rbac('employee', 'manager', 'admin'), ctrl.remove);
router.post('/:id/submit', auth, rbac('employee', 'manager', 'admin'), ctrl.submit);
router.post('/:id/resubmit', auth, rbac('employee', 'manager', 'admin'), ctrl.resubmit);
router.get('/:id/history', auth, rbac('employee', 'manager', 'admin'), ctrl.getHistory);

module.exports = { route: '/assessments', router };
