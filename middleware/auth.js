const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate users via JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

/**
 * Middleware to authenticate via access code (for login endpoint)
 */
const authenticateCode = async (req, res, next) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({ success: false, message: 'Access code required.' });
    }

    // Find user by access code
    const user = await User.findOne({ accessCode: accessCode.trim(), isActive: true });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid access code.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { authenticate, requireAdmin, authenticateCode };
