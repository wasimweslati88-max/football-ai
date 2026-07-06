const Match = require('../models/Match');
const PredictionLog = require('../models/PredictionLog');
const { getFixtureById } = require('../services/apiFootball');

/**
 * Result Tracker:
 * - Check finished matches
 * - Update match status and actual result
 * - Log prediction accuracy
 * - Calculate points earned
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const trackResults = async () => {
  const now = new Date();

  // Find matches from last 3 days that are LIVE or SCHEDULED
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const pendingMatches = await Match.find({
    date: { $gte: threeDaysAgo, $lte: now },
    status: { $in: ['SCHEDULED', 'LIVE'] },
    'aiAnalysis.isRecommended': true
  });

  if (pendingMatches.length === 0) {
    console.log('✅ No pending matches to track');
    return;
  }

  console.log(`🔍 Tracking results for ${pendingMatches.length} pending matches...`);

  for (const match of pendingMatches) {
    try {
      // Check if match should have finished (started 2+ hours ago)
      const matchStart = new Date(match.date);
      const hoursSinceStart = (now - matchStart) / (1000 * 60 * 60);

      if (hoursSinceStart < 2) {
        console.log(`⏳ Match ${match.fixtureId} still in progress (${hoursSinceStart.toFixed(1)}h)`);
        continue;
      }

      // Fetch latest fixture data
      await delay(600);
      const fixture = await getFixtureById(match.fixtureId);

      if (!fixture) {
        console.log(`⚠️ No data for match ${match.fixtureId}`);
        continue;
      }

      const status = fixture.fixture?.status?.short || 'NS';

      // Check if match is finished
      if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status)) {
        const homeGoals = fixture.goals?.home ?? 0;
        const awayGoals = fixture.goals?.away ?? 0;

        let winner = 'draw';
        if (homeGoals > awayGoals) winner = 'home';
        else if (awayGoals > homeGoals) winner = 'away';

        // Check if prediction was correct
        let predictionCorrect = false;
        const betType = match.aiAnalysis?.bestBet?.type;

        if (betType) {
          switch (betType) {
            case '1': predictionCorrect = winner === 'home'; break;
            case '2': predictionCorrect = winner === 'away'; break;
            case 'X': predictionCorrect = winner === 'draw'; break;
            case '1X': predictionCorrect = winner === 'home' || winner === 'draw'; break;
            case 'X2': predictionCorrect = winner === 'away' || winner === 'draw'; break;
            case '12': predictionCorrect = winner !== 'draw'; break;
            case 'Over 2.5': predictionCorrect = (homeGoals + awayGoals) > 2.5; break;
            case 'Under 2.5': predictionCorrect = (homeGoals + awayGoals) < 2.5; break;
            case 'BTTS': predictionCorrect = homeGoals > 0 && awayGoals > 0; break;
            case 'BTTS No': predictionCorrect = homeGoals === 0 || awayGoals === 0; break;
          }
        }

        const pointsEarned = predictionCorrect ? (match.aiAnalysis?.confidence || 0) : 0;

        // Update match
        await Match.findByIdAndUpdate(match._id, {
          status: 'FINISHED',
          actualResult: { homeGoals, awayGoals, winner },
          predictionCorrect
        });

        // Check if already logged
        const existingLog = await PredictionLog.findOne({ matchId: match._id });
        if (!existingLog) {
          await PredictionLog.create({
            matchId: match._id,
            fixtureId: match.fixtureId,
            date: match.date,
            homeTeam: match.homeTeam?.name || '',
            awayTeam: match.awayTeam?.name || '',
            league: match.league?.name || '',
            predictedScore: match.aiAnalysis?.predictedScore || { home: 0, away: 0 },
            bestBet: betType || 'Unknown',
            confidence: match.aiAnalysis?.confidence || 0,
            riskLevel: match.aiAnalysis?.riskLevel || 'Medium',
            actualResult: { homeGoals, awayGoals },
            predictionCorrect,
            pointsEarned
          });
        }

        console.log(`✅ ${match.homeTeam?.name || '?'} ${homeGoals}-${awayGoals} ${match.awayTeam?.name || '?'} | Bet: ${betType} | ${predictionCorrect ? '✅ CORRECT' : '❌ WRONG'}`);

      } else if (['CANC', 'PST', 'ABD', 'SUSP'].includes(status)) {
        // Match cancelled/postponed
        const newStatus = status === 'CANC' ? 'CANCELLED' : status === 'PST' ? 'POSTPONED' : 'CANCELLED';
        await Match.findByIdAndUpdate(match._id, { status: newStatus });
        console.log(`⚠️ Match ${match.fixtureId} ${newStatus.toLowerCase()}`);
      } else {
        // Still in progress
        if (status !== 'NS') {
          await Match.findByIdAndUpdate(match._id, { status: 'LIVE' });
        }
        console.log(`⏳ Match ${match.fixtureId} status: ${status}`);
      }

    } catch (err) {
      console.error(`❌ Error tracking match ${match.fixtureId}:`, err.message);
    }
  }

  console.log('✅ Result tracking complete');
};

module.exports = { trackResults };
