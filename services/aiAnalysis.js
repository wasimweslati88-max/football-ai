const Match = require('../models/Match');

/**
 * AI Football Match Analysis Engine v2.0
 * Strict filtering: Only LOW RISK matches, max 10 per day
 */

const calculateFormScore = (form) => {
  if (!form || typeof form !== 'string') return 0;
  let score = 0;
  const recent = form.slice(-5);
  for (const char of recent) {
    if (char === 'W') score += 3;
    else if (char === 'D') score += 1;
    else if (char === 'L') score -= 2;
  }
  return Math.max(0, score);
};

const calculateTeamStrength = (stats, isHome) => {
  if (!stats) return 40;

  let score = 45; // Base

  // Form (30%)
  const formScore = calculateFormScore(stats.form);
  score += (formScore / 15) * 30;

  // Goals (25%)
  const totalGoals = (stats.goalsFor || 0) + (stats.goalsAgainst || 0);
  if (totalGoals > 0) {
    const goalRatio = stats.goalsFor / totalGoals;
    score += (goalRatio - 0.5) * 50;
  }

  // Clean sheets (15%)
  const totalMatches = (stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0);
  if (totalMatches > 0) {
    score += ((stats.cleanSheets || 0) / totalMatches) * 15;
  }

  // Home/Away (10%)
  if (isHome) {
    const homeTotal = (stats.homeWins || 0) + (stats.homeDraws || 0) + (stats.homeLosses || 0);
    if (homeTotal > 0) {
      score += ((stats.homeWins || 0) / homeTotal - 0.33) * 25;
    }
  } else {
    const awayTotal = (stats.awayWins || 0) + (stats.awayDraws || 0) + (stats.awayLosses || 0);
    if (awayTotal > 0) {
      score += ((stats.awayWins || 0) / awayTotal - 0.33) * 25;
    }
  }

  // Consistency bonus
  if (stats.form && stats.form.length >= 5) {
    const recent = stats.form.slice(-5);
    const wins = (recent.match(/W/g) || []).length;
    if (wins >= 4) score += 5;
    if (wins >= 3) score += 3;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
};

const calculateExpectedGoals = (teamStats, opponentStats, isHome) => {
  if (!teamStats || !opponentStats) return 1.2;

  let xG = 1.2;

  if (teamStats.avgGoalsScored) {
    xG += (teamStats.avgGoalsScored - 1.2) * 0.8;
  }
  if (opponentStats.avgGoalsConceded) {
    xG += (opponentStats.avgGoalsConceded - 1.2) * 0.6;
  }
  if (isHome) xG += 0.35;
  else xG -= 0.15;

  return Math.max(0.3, Math.min(4.0, xG));
};

const calculateRiskScore = (homeStrength, awayStrength, homeXG, awayXG, h2h, standings, bestBet) => {
  let risk = 50;

  const strengthDiff = Math.abs(homeStrength - awayStrength);

  // Large strength difference = lower risk
  if (strengthDiff > 30) risk -= 25;
  else if (strengthDiff > 20) risk -= 15;
  else if (strengthDiff > 10) risk -= 5;
  else risk += 10;

  // Form consistency
  if (homeStrength > 70 && awayStrength < 40) risk -= 15;
  if (awayStrength > 70 && homeStrength < 40) risk -= 15;

  // H2H dominance
  if (h2h && h2h.totalMatches >= 3) {
    const h2hRatio = Math.max(h2h.homeWins, h2h.awayWins) / h2h.totalMatches;
    if (h2hRatio > 0.6) risk -= 10;
  }

  // Standings gap
  if (standings && standings.pointsGap > 15) risk -= 10;

  // Goals predictability
  const totalXG = homeXG + awayXG;
  if (totalXG > 3.5 || totalXG < 1.5) risk -= 5;
  else risk += 5;

  // Bet type risk adjustment
  const safeBets = ['1', '2', '1X', 'X2'];
  const riskyBets = ['X', 'Over 2.5', 'Under 2.5', 'BTTS', 'BTTS No'];
  if (safeBets.includes(bestBet)) risk -= 5;
  if (riskyBets.includes(bestBet)) risk += 10;

  return Math.max(0, Math.min(100, risk));
};

const determineBestBet = (homeStrength, awayStrength, homeXG, awayXG, h2h, standings) => {
  const strengthDiff = homeStrength - awayStrength;
  const totalXG = homeXG + awayXG;

  const candidates = [];

  // 1 - Home win
  if (strengthDiff > 20 && homeStrength > 60) {
    const conf = Math.min(95, 60 + strengthDiff * 0.4);
    candidates.push({ type: '1', confidence: conf, odds: 1.4 });
  }

  // 2 - Away win
  if (strengthDiff < -20 && awayStrength > 60) {
    const conf = Math.min(95, 60 + Math.abs(strengthDiff) * 0.4);
    candidates.push({ type: '2', confidence: conf, odds: 1.5 });
  }

  // 1X - Home no lose
  if (strengthDiff > 8) {
    const conf = Math.min(90, 55 + strengthDiff * 0.5);
    candidates.push({ type: '1X', confidence: conf, odds: 1.2 });
  }

  // X2 - Away no lose
  if (strengthDiff < -8) {
    const conf = Math.min(90, 55 + Math.abs(strengthDiff) * 0.5);
    candidates.push({ type: 'X2', confidence: conf, odds: 1.25 });
  }

  // 12 - No draw
  if (Math.abs(strengthDiff) > 15 && totalXG > 2) {
    candidates.push({ type: '12', confidence: 65, odds: 1.3 });
  }

  // Over 2.5
  if (totalXG > 2.8 && homeStrength > 50 && awayStrength > 50) {
    candidates.push({ type: 'Over 2.5', confidence: (totalXG / 3.5) * 70, odds: 1.7 });
  }

  // Under 2.5
  if (totalXG < 2.0 && (homeStrength < 50 || awayStrength < 50)) {
    candidates.push({ type: 'Under 2.5', confidence: (1 - totalXG / 2.5) * 80, odds: 1.6 });
  }

  // BTTS
  if (homeXG > 1.2 && awayXG > 1.0) {
    candidates.push({ type: 'BTTS', confidence: 55, odds: 1.8 });
  }

  // BTTS No
  if (homeXG < 1.0 || awayXG < 0.8) {
    candidates.push({ type: 'BTTS No', confidence: 60, odds: 1.7 });
  }

  // Sort by confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  if (candidates.length === 0) {
    return { type: '1X', confidence: 40, odds: 1.3, description: 'Conservative approach' };
  }

  const best = candidates[0];

  const descriptions = {
    '1': `Strong home advantage (${homeStrength}% strength vs ${awayStrength}%). Clear favorite with dominant form.`,
    '2': `Strong away advantage (${awayStrength}% strength vs ${homeStrength}%). Away team significantly stronger.`,
    'X': 'Very balanced matchup. Both teams evenly matched statistically.',
    '1X': `Home team has clear edge (${homeStrength}% vs ${awayStrength}%). Unlikely to lose at home.`,
    'X2': `Away team has clear edge (${awayStrength}% vs ${homeStrength}%). Unlikely to lose away.`,
    '12': 'Both teams attack-minded. High probability of a decisive result.',
    'Over 2.5': `High-scoring expected (${totalXG.toFixed(1)} xG total). Both teams create chances regularly.`,
    'Under 2.5': `Low-scoring expected (${totalXG.toFixed(1)} xG total). Defensive matchup likely.`,
    'BTTS': 'Both teams score consistently. Offensive quality on both sides.',
    'BTTS No': 'At least one team struggles to score. Clean sheet likely.'
  };

  return {
    type: best.type,
    confidence: Math.round(Math.min(95, best.confidence)),
    odds: best.odds,
    description: descriptions[best.type] || 'Statistical advantage detected'
  };
};

const getRiskLevel = (riskScore) => {
  if (riskScore <= 30) return 'Low';
  if (riskScore <= 50) return 'Medium';
  return 'High';
};

const generateKeyStats = (match) => {
  const stats = [];
  const { homeStats, awayStats, standings, h2h } = match;

  if (homeStats) {
    const total = (homeStats.wins || 0) + (homeStats.draws || 0) + (homeStats.losses || 0);
    if (total > 0) {
      stats.push(`🏠 ${match.homeTeam.name}: ${homeStats.wins}W ${homeStats.draws}D ${homeStats.losses}L`);
    }
    if (homeStats.avgGoalsScored) {
      stats.push(`⚽ Home avg scored: ${homeStats.avgGoalsScored.toFixed(1)}`);
    }
    if (homeStats.avgGoalsConceded) {
      stats.push(`🛡️ Home avg conceded: ${homeStats.avgGoalsConceded.toFixed(1)}`);
    }
    if (homeStats.cleanSheets) {
      stats.push(`🧤 Home clean sheets: ${homeStats.cleanSheets}`);
    }
    if (homeStats.form) {
      stats.push(`📈 Home form: ${homeStats.form.slice(-5)}`);
    }
  }

  if (awayStats) {
    const total = (awayStats.wins || 0) + (awayStats.draws || 0) + (awayStats.losses || 0);
    if (total > 0) {
      stats.push(`✈️ ${match.awayTeam.name}: ${awayStats.wins}W ${awayStats.draws}D ${awayStats.losses}L`);
    }
    if (awayStats.avgGoalsScored) {
      stats.push(`⚽ Away avg scored: ${awayStats.avgGoalsScored.toFixed(1)}`);
    }
    if (awayStats.avgGoalsConceded) {
      stats.push(`🛡️ Away avg conceded: ${awayStats.avgGoalsConceded.toFixed(1)}`);
    }
    if (awayStats.cleanSheets) {
      stats.push(`🧤 Away clean sheets: ${awayStats.cleanSheets}`);
    }
    if (awayStats.form) {
      stats.push(`📈 Away form: ${awayStats.form.slice(-5)}`);
    }
  }

  if (standings) {
    if (standings.homePosition && standings.awayPosition) {
      stats.push(`📊 League position: #${standings.homePosition} vs #${standings.awayPosition}`);
    }
    if (standings.pointsGap) {
      stats.push(`📊 Points gap: ${standings.pointsGap}`);
    }
  }

  if (h2h && h2h.totalMatches > 0) {
    stats.push(`🔄 H2H: ${h2h.homeWins}W-${h2h.draws || 0}D-${h2h.awayWins}L (${h2h.totalMatches} matches)`);
    if (h2h.avgGoals > 0) {
      stats.push(`🔄 H2H avg goals: ${h2h.avgGoals.toFixed(1)}`);
    }
  }

  return stats;
};

const analyzeMatch = (match) => {
  const { homeStats, awayStats, h2h, standings } = match;

  const homeStrength = calculateTeamStrength(homeStats, true);
  const awayStrength = calculateTeamStrength(awayStats, false);

  const homeXG = calculateExpectedGoals(homeStats, awayStats, true);
  const awayXG = calculateExpectedGoals(awayStats, homeStats, false);

  const predictedHome = Math.round(homeXG);
  const predictedAway = Math.round(awayXG);

  const bestBet = determineBestBet(homeStrength, awayStrength, homeXG, awayXG, h2h, standings);

  const riskScore = calculateRiskScore(homeStrength, awayStrength, homeXG, awayXG, h2h, standings, bestBet.type);
  const riskLevel = getRiskLevel(riskScore);

  const keyStats = generateKeyStats(match);

  // STRICT: Only recommend if LOW risk and confidence >= 70%
  const isRecommended = riskLevel === 'Low' && bestBet.confidence >= 70;

  let recommendationReason = '';
  if (isRecommended) {
    const reasons = [];

    if (Math.abs(homeStrength - awayStrength) > 20) {
      reasons.push('significant strength gap');
    }
    if (homeStrength > 70 || awayStrength > 70) {
      reasons.push('dominant team form');
    }
    if (h2h && h2h.totalMatches >= 3) {
      const dominant = Math.max(h2h.homeWins, h2h.awayWins);
      if (dominant / h2h.totalMatches > 0.6) {
        reasons.push('strong H2H record');
      }
    }
    if (standings && standings.pointsGap > 10) {
      reasons.push('large table gap');
    }

    recommendationReason = `AI selects this as a safe bet: ${bestBet.description}`;
    if (reasons.length > 0) {
      recommendationReason += ` Key factors: ${reasons.join(', ')}.`;
    }
    recommendationReason += ` Confidence: ${bestBet.confidence}% (Low Risk).`;
  }

  const analysisDetails = `
╔══════════════════════════════════════════╗
║      AI ANALYSIS REPORT                  ║
╠══════════════════════════════════════════╣
║ Match: ${match.homeTeam.name} vs ${match.awayTeam.name}
║
║ TEAM STRENGTH:
║ • Home: ${homeStrength}/100
║ • Away: ${awayStrength}/100
║ • Gap: ${Math.abs(homeStrength - awayStrength)}
║
║ EXPECTED GOALS (xG):
║ • Home xG: ${homeXG.toFixed(2)}
║ • Away xG: ${awayXG.toFixed(2)}
║ • Total: ${(homeXG + awayXG).toFixed(2)}
║
║ FORM ANALYSIS:
║ • Home form score: ${calculateFormScore(homeStats?.form)}/15
║ • Away form score: ${calculateFormScore(awayStats?.form)}/15
║
║ RISK ASSESSMENT: ${riskLevel} (Score: ${Math.round(riskScore)}/100)
║ RECOMMENDED: ${isRecommended ? 'YES ✓' : 'NO ✗'}
║ BEST BET: ${bestBet.type} @ ${bestBet.odds}
║ CONFIDENCE: ${bestBet.confidence}%
╚══════════════════════════════════════════╝
  `.trim();

  return {
    predictedScore: { home: predictedHome, away: predictedAway },
    bestBet,
    confidence: bestBet.confidence,
    riskLevel,
    isRecommended,
    recommendationReason,
    keyStats,
    analysisDetails
  };
};

const analyzeAllMatches = async (matches) => {
  const analyzed = [];

  for (const match of matches) {
    try {
      const analysis = analyzeMatch(match);

      await Match.findByIdAndUpdate(match._id, {
        aiAnalysis: analysis,
        analyzedAt: new Date()
      });

      analyzed.push({ ...match.toObject(), aiAnalysis: analysis });
    } catch (err) {
      console.error(`Error analyzing match ${match.fixtureId}:`, err.message);
    }
  }

  return analyzed;
};

// Get top 10 LOW RISK recommendations only
const getTopRecommendations = async (limit = 10) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Only get matches that haven't started yet
  const matches = await Match.find({
    date: { $gte: now, $lt: tomorrow },
    'aiAnalysis.isRecommended': true,
    'aiAnalysis.riskLevel': 'Low',
    status: 'SCHEDULED'
  })
  .sort({ 'aiAnalysis.confidence': -1 })
  .limit(limit);

  return matches;
};

module.exports = {
  analyzeMatch,
  analyzeAllMatches,
  getTopRecommendations,
  calculateTeamStrength,
  calculateExpectedGoals
};
