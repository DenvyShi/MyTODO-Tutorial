const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status);
  }
  
  return data;
}

// Auth API
export const authApi = {
  login: (username, password) => 
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  getMe: () => request('/auth/me'),
  
  updateProfile: (data) => 
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  changePassword: (currentPassword, newPassword) =>
    request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Lists API
export const listsApi = {
  getAll: () => request('/lists'),
  
  create: (name) =>
    request('/lists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  
  update: (id, data) =>
    request(`/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  reorder: (orders) =>
    request('/lists/batch/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orders }),
    }),
  
  delete: (id) =>
    request(`/lists/${id}`, { method: 'DELETE' }),
};

// Tasks API
export const tasksApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tasks${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => request(`/tasks/${id}`),
  
  create: (data) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  toggle: (id) =>
    request(`/tasks/${id}/toggle`, { method: 'POST' }),
  
  reorder: (tasks) =>
    request('/tasks/batch/reorder', {
      method: 'PUT',
      body: JSON.stringify({ tasks }),
    }),
  
  delete: (id) =>
    request(`/tasks/${id}`, { method: 'DELETE' }),
};

export { ApiError };
