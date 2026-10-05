import axios from 'axios';

const TOKEN_KEY = 'sf_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalise API errors so components can rely on { message, errors }. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data || {};
    const normalised = {
      status: error.response?.status || 0,
      message:
        payload.message ||
        (error.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : 'We could not reach the server. Please check your connection.'),
      errors: payload.errors || {},
    };
    if (normalised.status === 401) {
      setToken('');
      window.dispatchEvent(new CustomEvent('sf:unauthorised'));
    }
    return Promise.reject(normalised);
  }
);

/* --------------------------------------------------------------- api helpers */
export const auth = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => api.patch('/auth/me', payload).then((r) => r.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data),
  demoAccounts: () => api.get('/auth/demo-accounts').then((r) => r.data),
};

export const meta = {
  all: () => api.get('/meta').then((r) => r.data),
};

export const scholarshipsApi = {
  list: (params) => api.get('/scholarships', { params }).then((r) => r.data),
  get: (id) => api.get(`/scholarships/${id}`).then((r) => r.data),
  create: (payload) => api.post('/scholarships', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/scholarships/${id}`, payload).then((r) => r.data),
  remove: (id, params) => api.delete(`/scholarships/${id}`, { params }).then((r) => r.data),
};

export const eventsApi = {
  list: (params) => api.get('/events', { params }).then((r) => r.data),
  get: (id) => api.get(`/events/${id}`).then((r) => r.data),
  create: (payload) => api.post('/events', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/events/${id}`, payload).then((r) => r.data),
  remove: (id, params) => api.delete(`/events/${id}`, { params }).then((r) => r.data),
  volunteers: (id) => api.get(`/events/${id}/volunteers`).then((r) => r.data),
  notify: (id) => api.post(`/events/${id}/notify`).then((r) => r.data),
};

export const applicationsApi = {
  submit: (formData) => api.post('/applications', formData).then((r) => r.data),
  mine: () => api.get('/applications/me').then((r) => r.data),
  mineOne: (id) => api.get(`/applications/me/${id}`).then((r) => r.data),
  adminList: (params) => api.get('/applications/admin/list', { params }).then((r) => r.data),
  adminToday: (params) => api.get('/applications/admin/today', { params }).then((r) => r.data),
  adminStats: () => api.get('/applications/admin/stats').then((r) => r.data),
  adminOne: (id) => api.get(`/applications/admin/${id}`).then((r) => r.data),
  setStatus: (id, payload) => api.patch(`/applications/admin/${id}/status`, payload).then((r) => r.data),
  setNote: (id, payload) => api.patch(`/applications/admin/${id}/note`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/applications/admin/${id}`).then((r) => r.data),
  exportUrl: (params = {}) => `/api/applications/admin/export?${new URLSearchParams(params).toString()}`,
};

export const volunteersApi = {
  register: (payload) => api.post('/volunteers', payload).then((r) => r.data),
  mine: () => api.get('/volunteers/me').then((r) => r.data),
  adminList: (params) => api.get('/volunteers/admin/list', { params }).then((r) => r.data),
  adminOne: (id) => api.get(`/volunteers/admin/${id}`).then((r) => r.data),
  setStatus: (id, payload) => api.patch(`/volunteers/admin/${id}/status`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/volunteers/admin/${id}`).then((r) => r.data),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  unread: () => api.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id, read = true) => api.patch(`/notifications/${id}/read`, { read }).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
  remove: (id) => api.delete(`/notifications/${id}`).then((r) => r.data),
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  system: () => api.get('/admin/system').then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  createUser: (payload) => api.post('/admin/users', payload).then((r) => r.data),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data),
  deleteUser: (id, params) => api.delete(`/admin/users/${id}`, { params }).then((r) => r.data),
  emails: (params) => api.get('/admin/emails', { params }).then((r) => r.data),
  email: (id) => api.get(`/admin/emails/${id}`).then((r) => r.data),
  resendEmail: (id) => api.post(`/admin/emails/${id}/resend`).then((r) => r.data),
  broadcast: (payload) => api.post('/admin/broadcast', payload).then((r) => r.data),
};

export default api;
