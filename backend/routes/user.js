const express = require('express');
const router = express.Router();
const {
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
