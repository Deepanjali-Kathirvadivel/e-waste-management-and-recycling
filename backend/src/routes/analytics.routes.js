const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const { auth, rbac } = require('../middleware/auth');

router.get('/reusability', auth, rbac('admin', 'root'), ctrl.reusability);

module.exports = router;
