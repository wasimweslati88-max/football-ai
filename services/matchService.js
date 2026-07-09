const axios = require('axios');

/**
 * جلب المباريات اليومية من API
 */
const fetchDailyMatches = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get('https://api.football-data.org/v4/matches', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY || '' },
            params: { dateFrom: today, dateTo: today }
        });
        return response.data.matches || [];
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        return [];
    }
};

/**
 * حفظ المباريات في قاعدة البيانات
 */
const saveMatches = async (matches) => {
    const Match = require('../models/Match');
    try {
        for (const match of matches) {
            await Match.findOneAndUpdate(
                { matchId: match.id },
                {
                    matchId: match.id,
                    homeTeam: match.homeTeam?.name || 'Unknown',
                    awayTeam: match.awayTeam?.name || 'Unknown',
                    competition: match.competition?.name || 'Unknown',
                    date: match.utcDate,
                    status: match.status
                },
                { upsert: true, new: true }
            );
        }
        console.log(`Saved ${matches.length} matches`);
    } catch (error) {
        console.error('Error saving matches:', error.message);
    }
};

/**
 * جلب وحفظ المباريات
 */
const fetchAndSaveMatches = async () => {
    const matches = await fetchDailyMatches();
    await saveMatches(matches);
    return matches;
};

module.exports = {
    fetchDailyMatches,
    saveMatches,
    fetchAndSaveMatches
};

