// Football AI - Main JavaScript (FIXED)

document.addEventListener('DOMContentLoaded', function() {
  console.log('Main JS loaded - Football AI');

  // ===== START BUTTON =====
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Start button clicked');

      if (isLoggedIn()) {
        redirect('/dashboard');
      } else {
        const modal = document.getElementById('loginModal');
        if (modal) {
          modal.style.display = 'block';
        } else {
          redirect('/login');
        }
      }
    });
  }

  // ===== VIEW MATCHES BUTTON =====
  const viewMatchesBtn = document.getElementById('viewMatchesBtn');
  if (viewMatchesBtn) {
    viewMatchesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('View matches clicked');

      if (isLoggedIn()) {
        redirect('/matches');
      } else {
        redirect('/login');
      }
    });
  }

  // ===== LOAD TOP MATCHES (Dashboard) =====
  const topMatchesContainer = document.getElementById('topMatches');
  if (topMatchesContainer) {
    loadTopMatches();
  }

  // ===== NAV LINKS ACTIVE STATE =====
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});

// Load top 10 matches
async function loadTopMatches() {
  const container = document.getElementById('topMatches');
  if (!container) return;

  try {
    showLoading();
    const response = await MatchesAPI.getTop10();
    hideLoading();

    if (response.success && response.matches.length > 0) {
      container.innerHTML = response.matches.map((match, index) => `
        <div class="match-card ${match.riskLevel}">
          <div class="match-header">
            <span class="match-number">#${index + 1}</span>
            <span class="match-league"><i class="fas fa-trophy"></i> ${match.league}</span>
          </div>
          <div class="match-teams">
            <div class="team home">
              <span class="team-name">${match.homeTeam}</span>
            </div>
            <div class="vs">VS</div>
            <div class="team away">
              <span class="team-name">${match.awayTeam}</span>
            </div>
          </div>
          <div class="match-analysis">
            <div class="analysis-item">
              <span class="label">النقاط:</span>
              <span class="value">${match.analysis?.overallScore || 0}/100</span>
            </div>
            <div class="analysis-item">
              <span class="label">الثقة:</span>
              <span class="value">${match.confidence || 0}%</span>
            </div>
          </div>
          <div class="match-footer">
            <span class="risk-badge ${match.riskLevel}">
              ${match.riskLevel === 'low' ? '✅ آمن' : match.riskLevel === 'medium' ? '⚠️ متوسط' : '❌ عالي'}
            </span>
            <span class="recommendation">${match.recommendation === 'safe' ? 'موصى به' : 'حذر'}</span>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-day"></i><p>لا توجد مباريات اليوم</p></div>';
    }
  } catch (error) {
    hideLoading();
    console.error('Load matches error:', error);
    container.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>خطأ في تحميل المباريات</p></div>';
  }
}

window.loadTopMatches = loadTopMatches;
