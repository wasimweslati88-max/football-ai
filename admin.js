// Football AI - Admin Panel
document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin JS loaded');

  // Require admin
  if (!requireAdmin()) return;

  // Tab switching
  document.querySelectorAll('.sidebar-menu li').forEach(item => {
    item.addEventListener('click', function() {
      const tab = this.dataset.tab;

      // Update active tab
      document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
      this.classList.add('active');

      // Show content
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      const tabContent = document.getElementById(tab + 'Tab');
      if (tabContent) tabContent.classList.add('active');

      // Load data for tab
      if (tab === 'dashboard') loadDashboardStats();
      if (tab === 'codes') loadAccessCodes();
      if (tab === 'users') loadUsers();
      if (tab === 'matches') loadAdminMatches();
    });
  });

  // Create code button
  const createCodeBtn = document.getElementById('createCodeBtn');
  if (createCodeBtn) {
    createCodeBtn.addEventListener('click', function() {
      const modal = document.getElementById('createCodeModal');
      if (modal) modal.style.display = 'block';
    });
  }

  // Generate random code
  const generateCodeBtn = document.getElementById('generateCodeBtn');
  if (generateCodeBtn) {
    generateCodeBtn.addEventListener('click', async function() {
      try {
        showLoading();
        const response = await AdminAPI.generateCodes(1, 'VIP');
        hideLoading();
        if (response.success) {
          alert('تم توليد الكود: ' + response.codes[0].code);
          loadAccessCodes();
        }
      } catch (error) {
        hideLoading();
        alert('خطأ: ' + error.message);
      }
    });
  }

  // Create code form
  const createCodeForm = document.getElementById('createCodeForm');
  if (createCodeForm) {
    createCodeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const code = document.getElementById('newCodeInput').value.trim();
      const expiry = document.getElementById('codeExpiry').value;

      try {
        showLoading();
        await AdminAPI.createCode(code, expiry || null);
        hideLoading();
        document.getElementById('createCodeModal').style.display = 'none';
        this.reset();
        loadAccessCodes();
      } catch (error) {
        hideLoading();
        alert('خطأ: ' + error.message);
      }
    });
  }

  // Close modal
  document.querySelectorAll('.modal .close').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
    });
  });

  // Initial load
  loadDashboardStats();
});

async function loadDashboardStats() {
  try {
    const response = await AdminAPI.getStats();
    if (response.success) {
      const stats = response.stats;
      updateStat('totalUsers', stats.totalUsers);
      updateStat('totalCodes', stats.totalCodes);
      updateStat('usedCodes', stats.usedCodes);
      updateStat('todayMatches', stats.todayMatches);
    }
  } catch (error) {
    console.error('Stats error:', error);
  }
}

function updateStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || 0;
}

async function loadAccessCodes() {
  const tbody = document.getElementById('codesTableBody');
  if (!tbody) return;

  try {
    const response = await AdminAPI.getCodes();
    if (response.success && response.codes.length > 0) {
      tbody.innerHTML = response.codes.map(code => `
        <tr>
          <td><code>${code.code}</code></td>
          <td><span class="status-badge ${code.isActive ? 'active' : 'inactive'}">${code.isActive ? 'نشط' : 'معطل'}</span></td>
          <td>${code.isUsed ? (code.usedBy ? 'نعم' : 'نعم') : 'لا'}</td>
          <td>${new Date(code.createdAt).toLocaleDateString('ar-SA')}</td>
          <td>
            <button class="btn btn-small btn-warning" onclick="toggleCode('${code._id}')">
              <i class="fas fa-power-off"></i>
            </button>
            <button class="btn btn-small btn-danger" onclick="deleteCode('${code._id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد أكواد</td></tr>';
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-error">خطأ في التحميل</td></tr>';
  }
}

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  try {
    const response = await AdminAPI.getUsers();
    if (response.success && response.users.length > 0) {
      tbody.innerHTML = response.users.map(user => `
        <tr>
          <td>${user.name}</td>
          <td><code>${user.accessCode}</code></td>
          <td>${user.loginCount || 0}</td>
          <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'لم يسبق'}</td>
          <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'نشط' : 'معطل'}</span></td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا يوجد مستخدمين</td></tr>';
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-error">خطأ في التحميل</td></tr>';
  }
}

async function loadAdminMatches() {
  const tbody = document.getElementById('matchesTableBody');
  if (!tbody) return;

  try {
    const response = await AdminAPI.getMatches();
    if (response.success && response.matches.length > 0) {
      tbody.innerHTML = response.matches.map(match => `
        <tr>
          <td>${match.homeTeam} VS ${match.awayTeam}</td>
          <td>${match.league}</td>
          <td>${new Date(match.matchDate).toLocaleDateString('ar-SA')}</td>
          <td><span class="risk-badge ${match.riskLevel}">${match.riskLevel}</span></td>
          <td>${match.recommendation}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد مباريات</td></tr>';
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-error">خطأ في التحميل</td></tr>';
  }
}

async function toggleCode(id) {
  try {
    await AdminAPI.toggleCode(id);
    loadAccessCodes();
  } catch (error) {
    alert('خطأ: ' + error.message);
  }
}

async function deleteCode(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;
  try {
    await AdminAPI.deleteCode(id);
    loadAccessCodes();
  } catch (error) {
    alert('خطأ: ' + error.message);
  }
}

window.loadDashboardStats = loadDashboardStats;
window.loadAccessCodes = loadAccessCodes;
window.loadUsers = loadUsers;
window.loadAdminMatches = loadAdminMatches;
window.toggleCode = toggleCode;
window.deleteCode = deleteCode;
