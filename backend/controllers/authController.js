const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Extended for development
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password,
      role,
      isVerified: false,
      otp: {
        code: otp,
        expiresAt: otpExpiry
      }
    });

    if (user) {
      // Send OTP email
      try {
        await sendOTPEmail(email, otp, name);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Don't fail registration, user can request resend
      }

      // Don't return tokens - user needs to verify OTP first
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: false,
        message: 'Registration successful. Please verify your email with the OTP sent.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Keep last 5 refresh tokens for rotation management
      let newRefreshTokenArray = !user.refreshToken
        ? [refreshToken]
        : [...user.refreshToken, refreshToken].slice(-5);

      user.refreshToken = newRefreshTokenArray;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile, // Send profile on login
        token: accessToken,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err || user._id.toString() !== decoded.id) {
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
      }

      const accessToken = generateAccessToken(user._id);
      res.json({ token: accessToken });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public (or Protected depending on strategy, here we just need the token body)
const logoutUser = async (req, res) => {
  const { refreshToken } = req.body;
  
  if(!refreshToken) {
     return res.sendStatus(204);
  }

  try {
    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.sendStatus(204);
    }

    user.refreshToken = user.refreshToken.filter(rt => rt !== refreshToken);
    await user.save();

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser
};
