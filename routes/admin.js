const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const User = require('../models/User');
const AccessCode = require('../models/AccessCode');
const Match = require('../models/Match');
const PredictionLog = require('../models/PredictionLog');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/dashboard
 * Admin dashboard statistics
 */
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      totalUsers: await User.countDocuments({ role: 'user' }),
      activeCodes: await AccessCode.countDocuments({ isActive: true }),
      todayMatches: await Match.countDocuments({ 
        date: { $gte: today, $lt: tomorrow } 
      }),
      recommendedMatches: await Match.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        'aiAnalysis.isRecommended': true
      }),
      totalPredictions: await PredictionLog.countDocuments(),
      correctPredictions: await PredictionLog.countDocuments({ predictionCorrect: true }),
      recentLogs: await PredictionLog.find()
        .sort({ loggedAt: -1 })
        .limit(20)
        .select('-__v')
    };

    stats.accuracy = stats.totalPredictions > 0 
      ? ((stats.correctPredictions / stats.totalPredictions) * 100).toFixed(1) 
      : 0;

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/codes
 * Generate new access code
 */
router.post('/codes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { maxUses = 1, expiresInDays = null } = req.body;

    const code = 'FAI-' + uuidv4().substring(0, 8).toUpperCase();
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) 
      : null;

    const accessCode = await AccessCode.create({
      code,
      createdBy: req.user._id,
      maxUses,
      expiresAt
    });

    res.json({ success: true, accessCode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/codes
 * List all access codes
 */
router.get('/codes', authenticate, requireAdmin, async (req, res) => {
  try {
    const codes = await AccessCode.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, codes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/admin/codes/:id
 * Revoke access code
 */
router.delete('/codes/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await AccessCode.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Code revoked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/users
 * List all users
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Toggle user active status
 */
router.patch('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/fetch-matches
 * Trigger manual match fetch (admin only)
 */
router.post('/fetch-matches', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fetchDailyMatches } = require('../jobs/fetchMatches');
    const { analyzeMatches } = require('../jobs/analyzeMatches');

    const date = req.body.date || null;
    const matches = await fetchDailyMatches(date);
    const analyzed = await analyzeMatches(matches);

    res.json({ 
      success: true, 
      fetched: matches.length, 
      analyzed: analyzed.length 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
