// API utility functions

const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Handle FormData (don't set Content-Type for FormData)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
    if (token && !options.skipAuth) {
      config.headers = {
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const authAPI = {
  register: (data) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  }),

  login: (data) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  }),

  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),

  verify: () => apiRequest('/auth/verify'),
};

export const adminAPI = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
  },

  updateUser: (data) => apiRequest('/admin/users', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteUser: (userId) => apiRequest(`/admin/users?userId=${userId}`, {
    method: 'DELETE',
  }),

  getAnalytics: () => apiRequest('/admin/analytics'),
};

