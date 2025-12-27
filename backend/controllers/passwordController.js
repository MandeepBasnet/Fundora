const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateOTP, sendPasswordResetEmail } = require('../utils/emailService');

// Generate reset token (valid for 15 minutes after OTP verified)
const generateResetToken = (id) => {
  return jwt.sign({ id, purpose: 'password_reset' }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

// @desc    Send password reset OTP
// @route   POST /api/password/forgot
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If this email exists, a reset OTP has been sent.' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save password reset OTP to user
    user.passwordReset = {
      otp: otp,
      otpExpiry: otpExpiry,
      token: null
    };
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(email, otp, user.name);

    res.json({ 
      message: 'Password reset OTP sent to your email',
      expiresIn: expiryMinutes * 60
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset OTP', error: error.message });
  }
};

// @desc    Verify password reset OTP
// @route   POST /api/password/verify-otp
// @access  Public
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Check if password reset OTP exists
    if (!user.passwordReset || !user.passwordReset.otp) {
      return res.status(400).json({ message: 'No reset request found. Please request again.' });
    }

    // Check if OTP expired
    if (new Date() > user.passwordReset.otpExpiry) {
      user.passwordReset = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (user.passwordReset.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Generate reset token for password change
    const resetToken = generateResetToken(user._id);
    
    // Save reset token and clear OTP
    user.passwordReset = {
      otp: null,
      otpExpiry: null,
      token: resetToken
    };
    await user.save();

    res.json({ 
      message: 'OTP verified successfully',
      resetToken,
      email: user.email
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/password/reset
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Email, reset token, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Verify reset token
    if (!user.passwordReset || user.passwordReset.token !== resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Verify token is valid
    try {
      jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      user.passwordReset = undefined;
      await user.save();
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    // Update password
    user.password = newPassword;
    user.passwordReset = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

module.exports = {
  forgotPassword,
  verifyResetOTP,
  resetPassword
};
