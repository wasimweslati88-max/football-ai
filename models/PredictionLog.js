const mongoose = require('mongoose');

const predictionLogSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  fixtureId: Number,
  date: Date,
  homeTeam: String,
  awayTeam: String,
  league: String,
  predictedScore: {
    home: Number,
    away: Number
  },
  bestBet: String,
  confidence: Number,
  riskLevel: String,
  actualResult: {
    homeGoals: Number,
    awayGoals: Number
  },
  predictionCorrect: Boolean,
  pointsEarned: {
    type: Number,
    default: 0
  },
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

predictionLogSchema.index({ date: -1 });
predictionLogSchema.index({ predictionCorrect: 1 });
predictionLogSchema.index({ matchId: 1 });

module.exports = mongoose.model('PredictionLog', predictionLogSchema);
