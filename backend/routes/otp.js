const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  resendOTP
} = require('../controllers/otpController');

// POST /api/otp/send - Send OTP to email
router.post('/send', sendOTP);

// POST /api/otp/verify - Verify OTP
router.post('/verify', verifyOTP);

// POST /api/otp/resend - Resend OTP
router.post('/resend', resendOTP);

module.exports = router;
