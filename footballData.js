const axios = require('axios');

// Free football data sources
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || '';
const ODDS_API_KEY = process.env.ODDS_API_KEY || '';

class FootballDataService {
  // Fetch today's matches from free sources
  async fetchTodayMatches() {
    try {
      // Using free API-FOOTBALL (limited requests)
      const today = new Date().toISOString().split('T')[0];

      // Demo data if no API key
      if (!API_FOOTBALL_KEY) {
        return this.generateDemoMatches();
      }

      const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
        headers: { 'x-rapidapi-key': API_FOOTBALL_KEY },
        params: { date: today }
      });

      return response.data.response || [];
    } catch (error) {
      console.log('Using demo data - API error:', error.message);
      return this.generateDemoMatches();
    }
  }

  // Fetch odds from free sources
  async fetchOdds(matchId) {
    try {
      if (!ODDS_API_KEY) return null;

      const response = await axios.get(`https://api.the-odds-api.com/v4/sports/soccer/odds`, {
        params: { apiKey: ODDS_API_KEY, regions: 'eu' }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  generateDemoMatches() {
    const teams = [
      ['Manchester City', 'Arsenal', 'Premier League'],
      ['Real Madrid', 'Barcelona', 'La Liga'],
      ['Bayern Munich', 'Dortmund', 'Bundesliga'],
      ['Liverpool', 'Chelsea', 'Premier League'],
      ['PSG', 'Marseille', 'Ligue 1'],
      ['Juventus', 'AC Milan', 'Serie A'],
      ['Ajax', 'PSV', 'Eredivisie'],
      ['Porto', 'Benfica', 'Primeira Liga'],
      ['Celtic', 'Rangers', 'Scottish Premiership'],
      ['Galatasaray', 'Fenerbahce', 'Super Lig']
    ];

    return teams.map((m, i) => ({
      fixture: { id: `demo_${i}`, date: new Date().toISOString() },
      teams: { home: { name: m[0] }, away: { name: m[1] } },
      league: { name: m[2] }
    }));
  }
}

module.exports = new FootballDataService();
