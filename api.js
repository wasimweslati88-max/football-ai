// Football AI - API Service
const API_BASE = window.location.origin + '/api';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('football_ai_token');
}

// Check if user is logged in
function isLoggedIn() {
  return !!getToken();
}

// Check if user is admin
function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

// Get user data
function getUser() {
  try {
    const userStr = localStorage.getItem('football_ai_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add auth token if available
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Stringify body if object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    showLoading();
    const response = await fetch(url, config);
    const data = await response.json();
    hideLoading();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    hideLoading();
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
const AuthAPI = {
  login: (accessCode, name) => apiRequest('/auth/login', {
    method: 'POST',
    body: { accessCode, name }
  }),

  adminLogin: (password) => apiRequest('/auth/admin-login', {
    method: 'POST',
    body: { password }
  }),

  verify: () => apiRequest('/auth/verify', {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  }),

  logout: () => {
    localStorage.removeItem('football_ai_token');
    localStorage.removeItem('football_ai_user');
    return apiRequest('/auth/logout', { method: 'POST' });
  }
};

// Matches API
const MatchesAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/matches?${params}`);
  },

  getTop10: () => apiRequest('/matches/top10'),

  getById: (id) => apiRequest(`/matches/${id}`)
};

// Admin API
const AdminAPI = {
  getStats: () => apiRequest('/admin/stats'),

  getCodes: () => apiRequest('/admin/access-codes'),

  createCode: (code, expiresInDays) => apiRequest('/admin/access-codes', {
    method: 'POST',
    body: { code, expiresInDays }
  }),

  generateCodes: (count, prefix) => apiRequest('/admin/access-codes/generate', {
    method: 'POST',
    body: { count, prefix }
  }),

  toggleCode: (id) => apiRequest(`/admin/access-codes/${id}`, {
    method: 'PATCH'
  }),

  deleteCode: (id) => apiRequest(`/admin/access-codes/${id}`, {
    method: 'DELETE'
  }),

  getUsers: () => apiRequest('/admin/users'),

  getMatches: () => apiRequest('/admin/matches')
};

// Loading functions
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// Show error message
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }
}

// Show success message
function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
}

// Redirect helper
function redirect(path) {
  window.location.href = path;
}

// Export for use in other scripts
window.API_BASE = API_BASE;
window.getToken = getToken;
window.isLoggedIn = isLoggedIn;
window.isAdmin = isAdmin;
window.getUser = getUser;
window.apiRequest = apiRequest;
window.AuthAPI = AuthAPI;
window.MatchesAPI = MatchesAPI;
window.AdminAPI = AdminAPI;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.showSuccess = showSuccess;
window.redirect = redirect;
