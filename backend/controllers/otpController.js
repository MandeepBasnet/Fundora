const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Send OTP to user's email
// @route   POST /api/otp/send
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save OTP to user
    user.otp = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp, user.name);

    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: expiryMinutes * 60 // seconds
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/otp/verify
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Check if OTP exists
    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    // Check if OTP expired
    if (new Date() > user.otp.expiresAt) {
      // Clear expired OTP
      user.otp = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;

    // Generate tokens for auto-login
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = [refreshToken];
    await user.save();

    // Return user data with tokens for auto-login
    res.json({ 
      message: 'Email verified successfully',
      isVerified: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/otp/resend
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save new OTP to user
    user.otp = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send new OTP email
    await sendOTPEmail(email, otp, user.name);

    res.json({ 
      message: 'New OTP sent successfully',
      expiresIn: expiryMinutes * 60 // seconds
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP
};
