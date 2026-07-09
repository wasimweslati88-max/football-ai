// Football AI - Auth Module (FIXED)

document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth module loaded');

  // ===== LOGIN FORM =====
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      console.log('Login form submitted');

      const accessCode = document.getElementById('accessCode').value.trim();
      const name = document.getElementById('userName')?.value.trim() || '';

      if (!accessCode) {
        showError('loginError', 'الرجاء إدخال كود الدخول');
        return;
      }

      try {
        showLoading();
        const response = await AuthAPI.login(accessCode, name);
        hideLoading();

        if (response.success) {
          // Save token and user
          localStorage.setItem('football_ai_token', response.token);
          localStorage.setItem('football_ai_user', JSON.stringify(response.user));

          showSuccess('loginSuccess', 'تم تسجيل الدخول بنجاح!');

          // Redirect after short delay
          setTimeout(() => {
            redirect('/dashboard');
          }, 1000);
        }
      } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showError('loginError', error.message || 'خطأ في تسجيل الدخول');
      }
    });
  }

  // ===== ADMIN LOGIN FORM =====
  const adminForm = document.getElementById('adminForm');
  if (adminForm) {
    adminForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      console.log('Admin form submitted');

      const password = document.getElementById('adminPassword').value;

      if (!password) {
        showError('adminError', 'الرجاء إدخال كلمة المرور');
        return;
      }

      try {
        showLoading();
        const response = await AuthAPI.adminLogin(password);
        hideLoading();

        if (response.success) {
          localStorage.setItem('football_ai_token', response.token);
          localStorage.setItem('football_ai_user', JSON.stringify(response.user));

          showSuccess('adminError', 'تم الدخول كأدمن!');

          setTimeout(() => {
            redirect('/admin');
          }, 1000);
        }
      } catch (error) {
        hideLoading();
        console.error('Admin login error:', error);
        showError('adminError', error.message || 'كلمة المرور خاطئة');
      }
    });
  }

  // ===== LOGIN BUTTON (Navbar) =====
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Login button clicked');

      const modal = document.getElementById('loginModal');
      if (modal) {
        modal.style.display = 'block';
      } else {
        redirect('/login');
      }
    });
  }

  // ===== ADMIN BUTTON (Navbar) =====
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Admin button clicked');

      const modal = document.getElementById('adminModal');
      if (modal) {
        modal.style.display = 'block';
      }
    });
  }

  // ===== LOGOUT BUTTON =====
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Logout clicked');

      AuthAPI.logout().catch(() => {});
      localStorage.removeItem('football_ai_token');
      localStorage.removeItem('football_ai_user');
      redirect('/');
    });
  }

  // ===== MODAL CLOSE BUTTONS =====
  document.querySelectorAll('.modal .close').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });

  // Close modal on outside click
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });

  // ===== UPDATE UI BASED ON AUTH STATE =====
  updateAuthUI();
});

// Update UI based on login state
function updateAuthUI() {
  const token = getToken();
  const user = getUser();

  const loginBtn = document.getElementById('loginBtn');
  const adminBtn = document.getElementById('adminBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userNameEl = document.getElementById('userName');

  if (token && user) {
    // User is logged in
    if (loginBtn) loginBtn.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (userNameEl) userNameEl.textContent = user.name || 'مستخدم';

    // Show welcome name
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) welcomeName.textContent = user.name || 'مستخدم';
  } else {
    // User is logged out
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (adminBtn) adminBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userNameEl) userNameEl.textContent = '';
  }
}

// Check auth on protected pages
function requireAuth() {
  if (!isLoggedIn()) {
    redirect('/login');
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) {
    redirect('/');
    return false;
  }
  return true;
}

window.updateAuthUI = updateAuthUI;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
