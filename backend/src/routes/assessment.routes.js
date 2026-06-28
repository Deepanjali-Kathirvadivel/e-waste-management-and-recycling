const router = require('express').Router();
const ctrl = require('../controllers/assessment.controller');
const { auth, rbac } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAssessmentSchema, updateAssessmentSchema, renegotiateSchema } = require('../validators/assessment.validator');
const { uploadAssessment } = require('../config/upload');

router.post('/', auth, rbac('employee', 'admin', 'manager'), validate(createAssessmentSchema), ctrl.create);
router.get('/', auth, ctrl.list);
router.get('/export', auth, ctrl.exportData);
router.get('/:id', auth, ctrl.getOne);
router.put('/:id', auth, validate(updateAssessmentSchema), ctrl.update);
router.delete('/:id', auth, ctrl.remove);
router.post('/:id/submit', auth, ctrl.submit);
router.post('/:id/resubmit', auth, rbac('employee', 'admin'), validate(renegotiateSchema), ctrl.resubmit);
router.get('/:id/estimate', auth, ctrl.estimate);
router.post('/upload-image', auth, uploadAssessment.single('image'), ctrl.uploadImage);
router.delete('/:id/images/:imageId', auth, ctrl.deleteImage);
router.post('/ai-analyze', auth, ctrl.aiAnalyze);
router.get('/catalog/:category', auth, ctrl.getCatalogByCategory);
router.put('/:id/details', auth, ctrl.updateDetails);
router.get('/:id/history', auth, ctrl.getHistory);

module.exports = router;
