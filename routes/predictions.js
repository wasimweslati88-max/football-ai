const express = require('express');
const router = express.Router();
const PredictionLog = require('../models/PredictionLog');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/predictions/history
 * Get prediction history with pagination
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await PredictionLog.find()
      .sort({ loggedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await PredictionLog.countDocuments();

    res.json({
      success: true,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/predictions/accuracy
 * Get accuracy statistics
 */
router.get('/accuracy', authenticate, async (req, res) => {
  try {
    const total = await PredictionLog.countDocuments();
    const correct = await PredictionLog.countDocuments({ predictionCorrect: true });

    const byRisk = await PredictionLog.aggregate([
      { $match: { predictionCorrect: { $ne: null } } },
      { $group: {
        _id: '$riskLevel',
        total: { $sum: 1 },
        correct: { $sum: { $cond: ['$predictionCorrect', 1, 0] } }
      }}
    ]);

    const byBetType = await PredictionLog.aggregate([
      { $match: { predictionCorrect: { $ne: null } } },
      { $group: {
        _id: '$bestBet',
        total: { $sum: 1 },
        correct: { $sum: { $cond: ['$predictionCorrect', 1, 0] } }
      }}
    ]);

    const monthly = await PredictionLog.aggregate([
      { $match: { predictionCorrect: { $ne: null } } },
      { $group: {
        _id: { 
          year: { $year: '$date' }, 
          month: { $month: '$date' } 
        },
        total: { $sum: 1 },
        correct: { $sum: { $cond: ['$predictionCorrect', 1, 0] } }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      overall: {
        total,
        correct,
        accuracy: total > 0 ? ((correct / total) * 100).toFixed(1) : 0
      },
      byRisk,
      byBetType,
      monthly
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
