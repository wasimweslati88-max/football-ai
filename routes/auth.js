const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { authenticateCode } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Login with access code
 */
router.post('/login', authenticateCode, async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        accessCode: req.user.accessCode
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/admin-login
 * Admin login with password
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!password || password !== adminPassword) {
      return res.status(401).json({ success: false, message: 'Invalid admin password.' });
    }

    // Find or create admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        accessCode: 'ADMIN_' + Date.now(),
        role: 'admin',
        name: 'Administrator'
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        role: 'admin'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/auth/verify
 * Verify token validity
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.json({ valid: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    res.json({ 
      valid: !!user, 
      user: user ? { id: user._id, name: user.name, role: user.role } : null 
    });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;
