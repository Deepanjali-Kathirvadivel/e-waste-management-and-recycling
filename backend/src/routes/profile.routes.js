const router = require('express').Router();
const ctrl = require('../controllers/profile.controller');
const { auth } = require('../middleware/auth');

router.get('/', auth, ctrl.getProfile);
router.put('/', auth, ctrl.updateProfile);
router.put('/change-password', auth, ctrl.changePassword);

module.exports = router;
