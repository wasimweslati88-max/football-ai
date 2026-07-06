const Match = require('../models/Match');
const { analyzeMatch } = require('../services/aiAnalysis');

/**
 * Analyze all unanalyzed matches for today
 */

const analyzeMatches = async (matches = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get matches to analyze
  const matchesToAnalyze = matches || await Match.find({
    date: { $gte: today, $lt: tomorrow },
    $or: [
      { analyzedAt: null },
      { 'aiAnalysis': null }
    ]
  });

  console.log(`🔍 Analyzing ${matchesToAnalyze.length} matches...`);

  const analyzed = [];

  for (const match of matchesToAnalyze) {
    try {
      const analysis = analyzeMatch(match);

      // Update match with analysis
      await Match.findByIdAndUpdate(match._id, {
        aiAnalysis: analysis,
        analyzedAt: new Date()
      });

      analyzed.push({
        match: match.toObject(),
        analysis
      });

      console.log(`✅ Analyzed: ${match.homeTeam.name} vs ${match.awayTeam.name} -> ${analysis.bestBet.type} (${analysis.confidence}%)`);

    } catch (err) {
      console.error(`❌ Error analyzing match ${match.fixtureId}:`, err.message);
    }
  }

  console.log(`✅ Analysis complete. ${analyzed.length} matches analyzed.`);
  return analyzed;
};

module.exports = { analyzeMatches };
