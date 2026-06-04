const router = require('express').Router();
const ctrl = require('../controllers/staff.controller');
const { auth, rbac } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createStaffSchema, updateStaffSchema } = require('../validators/staff.validator');

router.get('/', auth, rbac('admin', 'root'), ctrl.list);
router.post('/', auth, rbac('admin', 'root'), validate(createStaffSchema), ctrl.create);
router.get('/:id', auth, rbac('admin', 'root'), ctrl.getOne);
router.put('/:id', auth, rbac('admin', 'root'), validate(updateStaffSchema), ctrl.update);
router.delete('/:id', auth, rbac('admin', 'root'), ctrl.remove);
router.patch('/:id/status', auth, rbac('admin', 'root'), ctrl.toggleStatus);
router.post('/:id/reset-password', auth, rbac('admin', 'root'), ctrl.resetPassword);

module.exports = router;
