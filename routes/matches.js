const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { authenticate } = require('../middleware/auth');
const { getTopRecommendations } = require('../services/aiAnalysis');

/**
 * GET /api/matches/today
 * Returns ONLY the top 10 LOW RISK matches for today
 * Excludes matches that have already started
 */
router.get('/today', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // STRICT: Only get LOW RISK, not started, max 10
    let matches = await Match.find({
      date: { $gt: now, $lt: tomorrow },  // Only future matches today
      'aiAnalysis.isRecommended': true,
      'aiAnalysis.riskLevel': 'Low',       // ONLY Low risk
      status: 'SCHEDULED'
    })
    .sort({ 'aiAnalysis.confidence': -1 })
    .limit(10);

    // If we have less than 10 Low risk, we still return what we have
    // (requirement: "if less than 10 suitable matches, show only those that passed")

    res.json({
      success: true,
      count: matches.length,
      date: today.toISOString().split('T')[0],
      matches: matches.map(m => ({
        id: m._id,
        fixtureId: m.fixtureId,
        league: m.league,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        date: m.date,
        venue: m.venue,
        predictedScore: m.aiAnalysis.predictedScore,
        bestBet: m.aiAnalysis.bestBet,
        confidence: m.aiAnalysis.confidence,
        riskLevel: m.aiAnalysis.riskLevel,
        recommendationReason: m.aiAnalysis.recommendationReason,
        keyStats: m.aiAnalysis.keyStats
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/matches/:id
 * Get full match details with AI analysis
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/matches/by-date/:date
 * Get all matches for a specific date (admin/history use)
 */
router.get('/by-date/:date', authenticate, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const matches = await Match.find({
      date: { $gte: date, $lt: nextDay }
    }).sort({ date: 1 });

    res.json({ success: true, count: matches.length, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/matches/live/all
 * Get currently live matches
 */
router.get('/live/all', authenticate, async (req, res) => {
  try {
    const matches = await Match.find({ status: 'LIVE' }).sort({ date: 1 });
    res.json({ success: true, count: matches.length, matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
