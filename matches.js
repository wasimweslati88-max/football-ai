const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { authenticateToken } = require('../middleware/auth');

// Get all matches (with filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date, league, riskLevel, status, limit = 50 } = req.query;

    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.matchDate = { $gte: startDate, $lt: endDate };
    }

    if (league) query.league = league;
    if (riskLevel) query.riskLevel = riskLevel;
    if (status) query.status = status;

    const matches = await Match.find(query)
      .sort({ matchDate: 1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch matches' });
  }
});

// Get top 10 safest matches
router.get('/top10', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const matches = await Match.find({
      matchDate: { $gte: today, $lt: tomorrow },
      riskLevel: 'low',
      recommendation: 'safe'
    })
    .sort({ confidence: -1, 'analysis.overallScore': -1 })
    .limit(10);

    // If no matches in DB, generate demo data
    if (matches.length === 0) {
      const demoMatches = generateDemoMatches();
      return res.json({ 
        success: true, 
        count: demoMatches.length, 
        matches: demoMatches,
        note: 'Showing demo data - connect MongoDB for real matches'
      });
    }

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    console.error('Get top 10 error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top matches' });
  }
});

// Get match by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const match = await Match.findOne({ matchId: req.params.id });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.json({ success: true, match });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Demo data generator
function generateDemoMatches() {
  const teams = [
    ['Manchester City', 'Arsenal'],
    ['Real Madrid', 'Barcelona'],
    ['Bayern Munich', 'Dortmund'],
    ['Liverpool', 'Chelsea'],
    ['PSG', 'Marseille'],
    ['Juventus', 'AC Milan'],
    ['Ajax', 'PSV'],
    ['Porto', 'Benfica'],
    ['Celtic', 'Rangers'],
    ['Galatasaray', 'Fenerbahce']
  ];

  const leagues = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];

  return teams.map((teamPair, index) => ({
    matchId: `demo_${index + 1}`,
    homeTeam: teamPair[0],
    awayTeam: teamPair[1],
    league: leagues[index % leagues.length],
    matchDate: new Date(),
    odds: {
      homeWin: (1.5 + Math.random()).toFixed(2),
      draw: (3.0 + Math.random() * 2).toFixed(2),
      awayWin: (2.0 + Math.random() * 3).toFixed(2),
      over25: (1.6 + Math.random()).toFixed(2),
      under25: (2.0 + Math.random()).toFixed(2)
    },
    analysis: {
      homeForm: Math.floor(60 + Math.random() * 40),
      awayForm: Math.floor(50 + Math.random() * 40),
      h2h: Math.floor(50 + Math.random() * 30),
      goalsScored: Math.floor(1.5 + Math.random() * 2),
      goalsConceded: Math.floor(0.5 + Math.random() * 1.5),
      cleanSheets: Math.floor(20 + Math.random() * 40),
      injuries: Math.floor(0 + Math.random() * 20),
      motivation: Math.floor(60 + Math.random() * 40),
      overallScore: Math.floor(70 + Math.random() * 25)
    },
    criteria: [
      { name: 'Home Form', score: 85, weight: 15, passed: true },
      { name: 'Away Form', score: 75, weight: 15, passed: true },
      { name: 'Head to Head', score: 80, weight: 10, passed: true },
      { name: 'Goals Scored', score: 78, weight: 10, passed: true },
      { name: 'Clean Sheets', score: 72, weight: 8, passed: true },
      { name: 'Injury Status', score: 90, weight: 7, passed: true },
      { name: 'Motivation', score: 88, weight: 10, passed: true },
      { name: 'Weather', score: 95, weight: 5, passed: true },
      { name: 'Referee Stats', score: 80, weight: 5, passed: true },
      { name: 'Rest Days', score: 85, weight: 5, passed: true }
    ],
    riskLevel: 'low',
    recommendation: 'safe',
    confidence: Math.floor(75 + Math.random() * 20),
    isSelected: true,
    status: 'upcoming'
  }));
}

module.exports = router;
