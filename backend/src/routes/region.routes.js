const router = require('express').Router();
const ctrl = require('../controllers/region.controller');
const { auth, rbac } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { regionSchema } = require('../validators/forecast.validator');

router.get('/', auth, rbac('admin', 'root'), ctrl.list);
router.post('/', auth, rbac('admin', 'root'), validate(regionSchema), ctrl.create);
router.get('/:id', auth, rbac('admin', 'root'), ctrl.getOne);
router.put('/:id', auth, rbac('admin', 'root'), validate(regionSchema), ctrl.update);
router.delete('/:id', auth, rbac('admin', 'root'), ctrl.remove);

module.exports = router;
