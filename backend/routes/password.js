const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  verifyResetOTP,
  resetPassword
} = require('../controllers/passwordController');

// POST /api/password/forgot - Request password reset OTP
router.post('/forgot', forgotPassword);

// POST /api/password/verify-otp - Verify reset OTP
router.post('/verify-otp', verifyResetOTP);

// POST /api/password/reset - Reset password with token
router.post('/reset', resetPassword);

module.exports = router;
