const router = require('express').Router();
const ctrl = require('../controllers/logistics.controller');
const { auth, rbac } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { logisticsSchema } = require('../validators/forecast.validator');

router.get('/', auth, rbac('admin', 'root'), ctrl.list);
router.post('/', auth, rbac('admin', 'root'), validate(logisticsSchema), ctrl.create);
router.get('/:id', auth, rbac('admin', 'root'), ctrl.getOne);
router.put('/:id', auth, rbac('admin', 'root'), validate(logisticsSchema), ctrl.update);
router.delete('/:id', auth, rbac('admin', 'root'), ctrl.remove);

module.exports = router;
