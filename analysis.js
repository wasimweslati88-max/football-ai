class AnalysisService {
  // 32 Criteria Analysis
  analyzeMatch(matchData) {
    const criteria = [
      { name: 'Home Team Form (Last 5)', weight: 8, check: (d) => d.homeForm > 60 },
      { name: 'Away Team Form (Last 5)', weight: 8, check: (d) => d.awayForm > 50 },
      { name: 'Head to Head Record', weight: 7, check: (d) => d.h2h > 50 },
      { name: 'Home Goals Scored', weight: 6, check: (d) => d.homeGoals > 1.2 },
      { name: 'Away Goals Scored', weight: 6, check: (d) => d.awayGoals > 0.8 },
      { name: 'Home Goals Conceded', weight: 6, check: (d) => d.homeConceded < 1.5 },
      { name: 'Away Goals Conceded', weight: 6, check: (d) => d.awayConceded < 1.5 },
      { name: 'Clean Sheets (Home)', weight: 5, check: (d) => d.homeCleanSheets > 30 },
      { name: 'Clean Sheets (Away)', weight: 5, check: (d) => d.awayCleanSheets > 20 },
      { name: 'Injuries (Home)', weight: 5, check: (d) => d.homeInjuries < 3 },
      { name: 'Injuries (Away)', weight: 5, check: (d) => d.awayInjuries < 3 },
      { name: 'Motivation (Home)', weight: 5, check: (d) => d.homeMotivation > 60 },
      { name: 'Motivation (Away)', weight: 5, check: (d) => d.awayMotivation > 50 },
      { name: 'Rest Days (Home)', weight: 4, check: (d) => d.homeRest >= 3 },
      { name: 'Rest Days (Away)', weight: 4, check: (d) => d.awayRest >= 3 },
      { name: 'Home Advantage', weight: 5, check: (d) => d.homeAdvantage > 50 },
      { name: 'Weather Conditions', weight: 3, check: (d) => d.weatherOK },
      { name: 'Referee Stats', weight: 3, check: (d) => d.refereeOK },
      { name: 'Home Possession', weight: 4, check: (d) => d.homePossession > 50 },
      { name: 'Away Possession', weight: 4, check: (d) => d.awayPossession < 50 },
      { name: 'Home Shots on Target', weight: 4, check: (d) => d.homeShots > 4 },
      { name: 'Away Shots on Target', weight: 4, check: (d) => d.awayShots < 5 },
      { name: 'Home Corners', weight: 3, check: (d) => d.homeCorners > 4 },
      { name: 'Away Corners', weight: 3, check: (d) => d.awayCorners < 5 },
      { name: 'Home Yellow Cards', weight: 3, check: (d) => d.homeYellows < 2.5 },
      { name: 'Away Yellow Cards', weight: 3, check: (d) => d.awayYellows < 2.5 },
      { name: 'Home Win Streak', weight: 4, check: (d) => d.homeWinStreak >= 2 },
      { name: 'Away Lose Streak', weight: 4, check: (d) => d.awayLoseStreak >= 1 },
      { name: 'League Position (Home)', weight: 5, check: (d) => d.homePosition < d.awayPosition },
      { name: 'Goals per Match (Home)', weight: 4, check: (d) => d.homeGPM > 2.2 },
      { name: 'Goals per Match (Away)', weight: 4, check: (d) => d.awayGPM < 2.5 },
      { name: 'BTTS (Home)', weight: 3, check: (d) => d.homeBTTS > 50 },
      { name: 'BTTS (Away)', weight: 3, check: (d) => d.awayBTTS > 40 }
    ];

    let totalScore = 0;
    let maxScore = 0;
    let passedCriteria = 0;

    const results = criteria.map(c => {
      const passed = c.check(matchData);
      const score = passed ? c.weight : 0;
      totalScore += score;
      maxScore += c.weight;
      if (passed) passedCriteria++;
      return { name: c.name, weight: c.weight, passed, score };
    });

    const overallScore = (totalScore / maxScore) * 100;
    const confidence = Math.min(overallScore + 10, 98);

    let riskLevel = 'high';
    let recommendation = 'avoid';

    if (overallScore >= 75 && passedCriteria >= 24) {
      riskLevel = 'low';
      recommendation = 'safe';
    } else if (overallScore >= 60 && passedCriteria >= 20) {
      riskLevel = 'medium';
      recommendation = 'moderate';
    }

    return {
      criteria: results,
      overallScore: Math.round(overallScore),
      confidence: Math.round(confidence),
      riskLevel,
      recommendation,
      passedCriteria,
      totalCriteria: criteria.length
    };
  }

  // Select top 10 safest matches
  selectTop10(matches) {
    const analyzed = matches.map(m => ({
      ...m,
      analysis: this.analyzeMatch(m)
    }));

    return analyzed
      .filter(m => m.analysis.riskLevel === 'low')
      .sort((a, b) => b.analysis.confidence - a.analysis.confidence)
      .slice(0, 10);
  }
}

module.exports = new AnalysisService();
