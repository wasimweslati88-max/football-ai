// Football AI - Matches Page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Matches JS loaded');

  // Require auth
  if (!isLoggedIn()) {
    redirect('/login');
    return;
  }

  // Load matches
  loadAllMatches();

  // Filter button
  const filterBtn = document.getElementById('filterBtn');
  if (filterBtn) {
    filterBtn.addEventListener('click', function() {
      const league = document.getElementById('leagueFilter').value;
      const risk = document.getElementById('riskFilter').value;
      loadAllMatches({ league, riskLevel: risk });
    });
  }
});

async function loadAllMatches(filters = {}) {
  const container = document.getElementById('matchesList');
  if (!container) return;

  try {
    showLoading();
    const response = await MatchesAPI.getAll(filters);
    hideLoading();

    if (response.success && response.matches.length > 0) {
      container.innerHTML = response.matches.map(match => `
        <div class="match-row ${match.riskLevel}">
          <div class="match-info">
            <div class="teams">${match.homeTeam} <span class="vs">VS</span> ${match.awayTeam}</div>
            <div class="league"><i class="fas fa-trophy"></i> ${match.league}</div>
          </div>
          <div class="match-meta">
            <span class="risk-badge ${match.riskLevel}">${match.riskLevel === 'low' ? 'آمن' : match.riskLevel === 'medium' ? 'متوسط' : 'عالي'}</span>
            <span class="confidence">${match.confidence}%</span>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div class="empty-state"><p>لا توجد مباريات</p></div>';
    }
  } catch (error) {
    hideLoading();
    container.innerHTML = '<div class="error-state"><p>خطأ في التحميل</p></div>';
  }
}

window.loadAllMatches = loadAllMatches;
