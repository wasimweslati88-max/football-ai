const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  fixtureId: {
    type: Number,
    required: true,
    unique: true
  },
  league: {
    id: Number,
    name: String,
    country: String,
    logo: String,
    flag: String
  },
  season: Number,
  round: String,
  homeTeam: {
    id: Number,
    name: String,
    logo: String
  },
  awayTeam: {
    id: Number,
    name: String,
    logo: String
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  venue: String,
  referee: String,

  homeStats: {
    form: String,
    wins: Number,
    draws: Number,
    losses: Number,
    goalsFor: Number,
    goalsAgainst: Number,
    cleanSheets: Number,
    failedToScore: Number,
    avgGoalsScored: Number,
    avgGoalsConceded: Number,
    homeWins: Number,
    homeDraws: Number,
    homeLosses: Number,
    homeGoalsFor: Number,
    homeGoalsAgainst: Number,
    awayWins: Number,
    awayDraws: Number,
    awayLosses: Number,
    awayGoalsFor: Number,
    awayGoalsAgainst: Number
  },

  awayStats: {
    form: String,
    wins: Number,
    draws: Number,
    losses: Number,
    goalsFor: Number,
    goalsAgainst: Number,
    cleanSheets: Number,
    failedToScore: Number,
    avgGoalsScored: Number,
    avgGoalsConceded: Number,
    homeWins: Number,
    homeDraws: Number,
    homeLosses: Number,
    homeGoalsFor: Number,
    homeGoalsAgainst: Number,
    awayWins: Number,
    awayDraws: Number,
    awayLosses: Number,
    awayGoalsFor: Number,
    awayGoalsAgainst: Number
  },

  h2h: {
    totalMatches: Number,
    homeWins: Number,
    awayWins: Number,
    draws: Number,
    avgGoals: Number
  },

  standings: {
    homePosition: Number,
    awayPosition: Number,
    homePoints: Number,
    awayPoints: Number,
    pointsGap: Number
  },

  aiAnalysis: {
    predictedScore: {
      home: Number,
      away: Number
    },
    bestBet: {
      type: String,
      odds: Number,
      description: String
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    isRecommended: {
      type: Boolean,
      default: false
    },
    recommendationReason: String,
    keyStats: [String],
    analysisDetails: String
  },

  actualResult: {
    homeGoals: Number,
    awayGoals: Number,
    winner: String
  },

  predictionCorrect: {
    type: Boolean,
    default: null
  },

  fetchedAt: {
    type: Date,
    default: Date.now
  },
  analyzedAt: {
    type: Date,
    default: null
  }
});

matchSchema.index({ date: 1, 'aiAnalysis.isRecommended': 1 });
matchSchema.index({ fixtureId: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Match', matchSchema);
