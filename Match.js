const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true
  },
  homeTeam: {
    type: String,
    required: true
  },
  awayTeam: {
    type: String,
    required: true
  },
  league: {
    type: String,
    required: true
  },
  matchDate: {
    type: Date,
    required: true
  },
  odds: {
    homeWin: Number,
    draw: Number,
    awayWin: Number,
    over25: Number,
    under25: Number,
    bttsYes: Number,
    bttsNo: Number
  },
  analysis: {
    homeForm: Number,
    awayForm: Number,
    h2h: Number,
    goalsScored: Number,
    goalsConceded: Number,
    cleanSheets: Number,
    injuries: Number,
    motivation: Number,
    overallScore: Number
  },
  criteria: [{
    name: String,
    score: Number,
    weight: Number,
    passed: Boolean
  }],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  recommendation: {
    type: String,
    enum: ['safe', 'moderate', 'avoid'],
    default: 'moderate'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'finished'],
    default: 'upcoming'
  },
  result: {
    homeScore: Number,
    awayScore: Number,
    winner: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

matchSchema.index({ matchDate: 1 });
matchSchema.index({ isSelected: 1 });
matchSchema.index({ riskLevel: 1 });

module.exports = mongoose.model('Match', matchSchema);
