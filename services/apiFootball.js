const axios = require('axios');

const BASE_URL = process.env.API_FOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

if (!API_KEY) {
  console.warn('⚠️ API_FOOTBALL_KEY not set. API calls will fail.');
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-apisports-key': API_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 20000
});

// Rate limit tracking
let requestsRemaining = 100;
let lastReset = Date.now();

const checkRateLimit = () => {
  const now = Date.now();
  const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
  if (hoursSinceReset >= 24) {
    requestsRemaining = 100;
    lastReset = now;
  }
};

const makeRequest = async (endpoint, params = {}) => {
  checkRateLimit();

  if (requestsRemaining <= 5) {
    console.warn(`⚠️ API rate limit nearly exhausted: ${requestsRemaining} remaining`);
  }

  if (requestsRemaining <= 0) {
    throw new Error('API daily quota exhausted');
  }

  try {
    const response = await apiClient.get(endpoint, { params });

    // Update rate limit from headers
    const remaining = response.headers['x-ratelimit-requests-remaining'];
    if (remaining) {
      requestsRemaining = parseInt(remaining);
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      throw new Error(`API Error ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`);
    }
    if (error.request) {
      throw new Error('Network error: No response from API');
    }
    throw error;
  }
};

// Get fixtures for a specific date
const getFixtures = async (date = null, extraParams = {}) => {
  const params = { ...extraParams };
  if (date) params.date = date;
  params.timezone = 'UTC';

  const data = await makeRequest('/fixtures', params);
  return data.response || [];
};

// Get fixtures by league and season
const getFixturesByLeague = async (leagueId, season, date = null) => {
  const params = { league: leagueId, season, timezone: 'UTC' };
  if (date) params.date = date;
  const data = await makeRequest('/fixtures', params);
  return data.response || [];
};

// Get team statistics
const getTeamStatistics = async (leagueId, season, teamId) => {
  try {
    const data = await makeRequest('/teams/statistics', {
      league: leagueId,
      season,
      team: teamId
    });
    return data.response;
  } catch (err) {
    console.warn(`⚠️ Team stats unavailable for team ${teamId}: ${err.message}`);
    return null;
  }
};

// Get head to head
const getHeadToHead = async (team1Id, team2Id) => {
  try {
    const data = await makeRequest('/fixtures/headtohead', {
      h2h: `${team1Id}-${team2Id}`,
      last: 10
    });
    return data.response || [];
  } catch (err) {
    console.warn(`⚠️ H2H unavailable: ${err.message}`);
    return [];
  }
};

// Get standings
const getStandings = async (leagueId, season) => {
  try {
    const data = await makeRequest('/standings', {
      league: leagueId,
      season
    });
    return data.response?.[0]?.league?.standings?.[0] || [];
  } catch (err) {
    console.warn(`⚠️ Standings unavailable: ${err.message}`);
    return [];
  }
};

// Get leagues
const getLeagues = async () => {
  try {
    const data = await makeRequest('/leagues', { current: true });
    return data.response || [];
  } catch (err) {
    console.warn(`⚠️ Leagues unavailable: ${err.message}`);
    return [];
  }
};

// Get live fixtures
const getLiveFixtures = async () => {
  try {
    const data = await makeRequest('/fixtures', { live: 'all', timezone: 'UTC' });
    return data.response || [];
  } catch (err) {
    console.warn(`⚠️ Live fixtures unavailable: ${err.message}`);
    return [];
  }
};

// Get fixture by ID
const getFixtureById = async (fixtureId) => {
  try {
    const data = await makeRequest('/fixtures', { id: fixtureId, timezone: 'UTC' });
    return data.response?.[0] || null;
  } catch (err) {
    console.warn(`⚠️ Fixture ${fixtureId} unavailable: ${err.message}`);
    return null;
  }
};

// Get predictions for a fixture
const getPredictions = async (fixtureId) => {
  try {
    const data = await makeRequest('/predictions', { fixture: fixtureId });
    return data.response?.[0] || null;
  } catch (err) {
    console.warn(`⚠️ Predictions unavailable: ${err.message}`);
    return null;
  }
};

module.exports = {
  makeRequest,
  getFixtures,
  getFixturesByLeague,
  getTeamStatistics,
  getHeadToHead,
  getStandings,
  getLeagues,
  getLiveFixtures,
  getFixtureById,
  getPredictions,
  getRemainingRequests: () => requestsRemaining
};
