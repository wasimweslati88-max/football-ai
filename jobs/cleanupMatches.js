const Match = require('../models/Match');

/**
 * Cleanup Job:
 * - Remove matches that have already started from upcoming list
 * - Remove finished matches older than 7 days
 * - Update status for matches that just started
 */

const cleanupOldMatches = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let deletedCount = 0;
  let updatedCount = 0;

  try {
    // 1. Update matches that just started to LIVE status
    const startedMatches = await Match.find({
      date: { $lte: now },
      status: 'SCHEDULED'
    });

    for (const match of startedMatches) {
      await Match.findByIdAndUpdate(match._id, { status: 'LIVE' });
      updatedCount++;
    }

    // 2. Delete finished matches older than 7 days
    const oldFinished = await Match.deleteMany({
      status: 'FINISHED',
      date: { $lt: sevenDaysAgo }
    });
    deletedCount += oldFinished.deletedCount;

    // 3. Delete cancelled/postponed matches older than 2 days
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const oldCancelled = await Match.deleteMany({
      status: { $in: ['CANCELLED', 'POSTPONED'] },
      date: { $lt: twoDaysAgo }
    });
    deletedCount += oldCancelled.deletedCount;

    // 4. Delete matches from yesterday that are still SCHEDULED (likely not played)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const todayStart = new Date(yesterday);
    todayStart.setDate(todayStart.getDate() + 1);

    const staleMatches = await Match.deleteMany({
      date: { $gte: yesterday, $lt: todayStart },
      status: 'SCHEDULED'
    });
    deletedCount += staleMatches.deletedCount;

    console.log(`🧹 Cleanup: ${updatedCount} marked LIVE, ${deletedCount} deleted`);
    return deletedCount;

  } catch (err) {
    console.error('❌ Cleanup error:', err.message);
    return 0;
  }
};

module.exports = { cleanupOldMatches };
