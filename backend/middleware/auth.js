const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user is permanently banned
      if (req.user.isBanned) {
        return res.status(403).json({ message: 'Account permanently banned' });
      }

      // Check if user is temporarily suspended
      if (req.user.suspendedUntil && new Date(req.user.suspendedUntil) > new Date()) {
        return res.status(403).json({ message: 'Account temporarily suspended' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional auth - tries to authenticate but doesn't require it
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (req.user) {
        if (req.user.isBanned || (req.user.suspendedUntil && new Date(req.user.suspendedUntil) > new Date())) {
          // If banned or suspended, treat as unauthenticated for optional routes
          req.user = null;
        }
      }
    } catch (error) {
      // Token invalid, but we allow the request to continue
      req.user = null;
    }
  }

  next();
};

module.exports = { protect, authorize, optionalAuth };
