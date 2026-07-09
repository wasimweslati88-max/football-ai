const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  prediction: {
    type: String,
    required: true
  },
  confidence: Number,
  odds: Number,
  stake: Number,
  result: {
    type: String,
    enum: ['pending', 'win', 'loss', 'void'],
    default: 'pending'
  },
  profit: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prediction', predictionSchema);
