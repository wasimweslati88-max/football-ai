/**
 * Utility Helper Functions
 */

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getRiskColor = (riskLevel) => {
  const colors = {
    'Low': '#22c55e',
    'Medium': '#eab308',
    'High': '#ef4444'
  };
  return colors[riskLevel] || '#94a3b8';
};

const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return '#22c55e';
  if (confidence >= 70) return '#3b82f6';
  if (confidence >= 60) return '#eab308';
  return '#ef4444';
};

const generateShareText = (match) => {
  return `🏆 ${match.homeTeam.name} vs ${match.awayTeam.name}
📅 ${formatDate(match.date)} ${formatTime(match.date)}
🎯 Prediction: ${match.aiAnalysis.bestBet.type}
📊 Confidence: ${match.aiAnalysis.confidence}%
⚡ Risk: ${match.aiAnalysis.riskLevel}
💡 ${match.aiAnalysis.recommendationReason}`;
};

module.exports = {
  formatDate,
  formatTime,
  getRiskColor,
  getConfidenceColor,
  generateShareText
};
