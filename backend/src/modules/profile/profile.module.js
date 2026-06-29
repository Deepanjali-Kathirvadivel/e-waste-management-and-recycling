const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const ctrl = require('../../controllers/profile.controller');

router.get('/', auth, ctrl.getProfile);
router.put('/', auth, ctrl.updateProfile);
router.put('/password', auth, ctrl.changePassword);
router.put('/change-password', auth, ctrl.changePassword);

module.exports = { route: '/profile', router };
