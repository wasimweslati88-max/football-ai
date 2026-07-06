const moment = require('moment-timezone');
const Match = require('../models/Match');
const { getFixtures, getTeamStatistics, getHeadToHead, getStandings } = require('../services/apiFootball');

/**
 * Fetch daily matches from API-Football
 * Optimized to minimize API calls (100/day limit on free tier)
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get current season based on date
const getCurrentSeason = () => {
  const now = new Date();
  const month = now.getMonth();
  // European season: July - May
  if (month >= 6) {
    return now.getFullYear();
  }
  return now.getFullYear() - 1;
};

// Safely extract nested values
const safeGet = (obj, path, defaultVal = 0) => {
  try {
    return path.split('.').reduce((o, k) => (o || {})[k], obj) || defaultVal;
  } catch {
    return defaultVal;
  }
};

// Parse float safely
const safeFloat = (val) => {
  if (val === null || val === undefined) return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

// Fetch and store matches for a specific date
const fetchDailyMatches = async (date = null) => {
  const targetDate = date || moment().format('YYYY-MM-DD');
  console.log(`📅 Fetching matches for ${targetDate}`);

  try {
    // Get all fixtures for the day (1 API call)
    const fixtures = await getFixtures(targetDate);
    console.log(`📊 Found ${fixtures.length} fixtures`);

    if (fixtures.length === 0) {
      console.log('ℹ️ No fixtures found for this date');
      return [];
    }

    const season = getCurrentSeason();
    const matches = [];

    // Process fixtures in batches to respect rate limits
    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];

      try {
        const fixtureId = safeGet(fixture, 'fixture.id');
        const leagueId = safeGet(fixture, 'league.id');
        const homeTeamId = safeGet(fixture, 'teams.home.id');
        const awayTeamId = safeGet(fixture, 'teams.away.id');

        if (!fixtureId || !leagueId || !homeTeamId || !awayTeamId) {
          console.warn(`⚠️ Skipping fixture with missing IDs`);
          continue;
        }

        // Check if match already exists and analyzed
        const existing = await Match.findOne({ fixtureId });
        if (existing && existing.analyzedAt) {
          console.log(`⏭️ Match ${fixtureId} already analyzed, skipping`);
          matches.push(existing);
          continue;
        }

        // Fetch additional data with delays
        let homeStats = null;
        let awayStats = null;
        let h2hData = null;
        let standingsData = null;

        // Home team stats
        await delay(700);
        try {
          homeStats = await getTeamStatistics(leagueId, season, homeTeamId);
        } catch (e) { 
          console.log(`⚠️ Home stats unavailable for ${fixtureId}: ${e.message}`); 
        }

        // Away team stats
        await delay(700);
        try {
          awayStats = await getTeamStatistics(leagueId, season, awayTeamId);
        } catch (e) { 
          console.log(`⚠️ Away stats unavailable for ${fixtureId}: ${e.message}`); 
        }

        // H2H
        await delay(700);
        try {
          const h2h = await getHeadToHead(homeTeamId, awayTeamId);
          h2hData = {
            totalMatches: h2h.length,
            homeWins: h2h.filter(m => {
              const homeWinner = safeGet(m, 'teams.home.winner');
              const homeId = safeGet(m, 'teams.home.id');
              return homeWinner === true && homeId === homeTeamId;
            }).length,
            awayWins: h2h.filter(m => {
              const awayWinner = safeGet(m, 'teams.away.winner');
              const awayId = safeGet(m, 'teams.away.id');
              return awayWinner === true && awayId === awayTeamId;
            }).length,
            draws: h2h.filter(m => {
              const homeWinner = safeGet(m, 'teams.home.winner');
              const awayWinner = safeGet(m, 'teams.away.winner');
              return homeWinner === null && awayWinner === null;
            }).length,
            avgGoals: h2h.length > 0 
              ? h2h.reduce((sum, m) => sum + safeGet(m, 'goals.home', 0) + safeGet(m, 'goals.away', 0), 0) / h2h.length 
              : 0
          };
        } catch (e) { 
          console.log(`⚠️ H2H unavailable for ${fixtureId}: ${e.message}`); 
        }

        // Standings
        await delay(700);
        try {
          const standings = await getStandings(leagueId, season);
          const homeStanding = standings.find(s => safeGet(s, 'team.id') === homeTeamId);
          const awayStanding = standings.find(s => safeGet(s, 'team.id') === awayTeamId);

          standingsData = {
            homePosition: homeStanding?.rank || null,
            awayPosition: awayStanding?.rank || null,
            homePoints: homeStanding?.points || null,
            awayPoints: awayStanding?.points || null,
            pointsGap: homeStanding && awayStanding 
              ? Math.abs((homeStanding.points || 0) - (awayStanding.points || 0)) 
              : null
          };
        } catch (e) { 
          console.log(`⚠️ Standings unavailable for ${fixtureId}: ${e.message}`); 
        }

        // Parse team stats helper
        const parseTeamStats = (stats) => {
          if (!stats) return null;
          return {
            form: safeGet(stats, 'form', ''),
            wins: safeGet(stats, 'fixtures.wins.total', 0),
            draws: safeGet(stats, 'fixtures.draws.total', 0),
            losses: safeGet(stats, 'fixtures.loses.total', 0),
            goalsFor: safeGet(stats, 'goals.for.total.total', 0),
            goalsAgainst: safeGet(stats, 'goals.against.total.total', 0),
            cleanSheets: safeGet(stats, 'clean_sheet.total', 0),
            failedToScore: safeGet(stats, 'failed_to_score.total', 0),
            avgGoalsScored: safeFloat(safeGet(stats, 'goals.for.average.total')),
            avgGoalsConceded: safeFloat(safeGet(stats, 'goals.against.average.total')),
            homeWins: safeGet(stats, 'fixtures.wins.home', 0),
            homeDraws: safeGet(stats, 'fixtures.draws.home', 0),
            homeLosses: safeGet(stats, 'fixtures.loses.home', 0),
            homeGoalsFor: safeGet(stats, 'goals.for.total.home', 0),
            homeGoalsAgainst: safeGet(stats, 'goals.against.total.home', 0),
            awayWins: safeGet(stats, 'fixtures.wins.away', 0),
            awayDraws: safeGet(stats, 'fixtures.draws.away', 0),
            awayLosses: safeGet(stats, 'fixtures.loses.away', 0),
            awayGoalsFor: safeGet(stats, 'goals.for.total.away', 0),
            awayGoalsAgainst: safeGet(stats, 'goals.against.total.away', 0)
          };
        };

        // Build match object
        const matchData = {
          fixtureId,
          league: {
            id: leagueId,
            name: safeGet(fixture, 'league.name', ''),
            country: safeGet(fixture, 'league.country', ''),
            logo: safeGet(fixture, 'league.logo', ''),
            flag: safeGet(fixture, 'league.flag', '')
          },
          season,
          round: safeGet(fixture, 'league.round', ''),
          homeTeam: {
            id: homeTeamId,
            name: safeGet(fixture, 'teams.home.name', ''),
            logo: safeGet(fixture, 'teams.home.logo', '')
          },
          awayTeam: {
            id: awayTeamId,
            name: safeGet(fixture, 'teams.away.name', ''),
            logo: safeGet(fixture, 'teams.away.logo', '')
          },
          date: new Date(safeGet(fixture, 'fixture.date', new Date())),
          status: 'SCHEDULED',
          venue: safeGet(fixture, 'fixture.venue.name', ''),
          referee: safeGet(fixture, 'fixture.referee', ''),
          homeStats: parseTeamStats(homeStats),
          awayStats: parseTeamStats(awayStats),
          h2h: h2hData,
          standings: standingsData,
          fetchedAt: new Date()
        };

        // Upsert match
        const match = await Match.findOneAndUpdate(
          { fixtureId },
          matchData,
          { upsert: true, new: true }
        );

        matches.push(match);
        console.log(`✅ Stored: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

      } catch (err) {
        console.error(`❌ Error processing fixture: ${err.message}`);
      }
    }

    console.log(`✅ Total matches fetched and stored: ${matches.length}`);
    return matches;

  } catch (err) {
    console.error('❌ Error fetching daily matches:', err.message);
    throw err;
  }
};

module.exports = { fetchDailyMatches };
