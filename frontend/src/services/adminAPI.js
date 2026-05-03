const API_BASE = 'http://localhost:5001/api';

const getToken = () => {
  const token = localStorage.getItem('waygo_token') || localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
};

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const parseJson = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid response received from server.');
  }
};

const request = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });

  const json = await parseJson(res);
  if (!res.ok) {
    throw new Error(json.message || 'Request failed.');
  }
  return json;
};

export const adminAPI = {
  getMyProfile: () => request('/users/profile'),

  updateMyProfile: (payload) => request('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  changeMyPassword: (payload) => request('/users/password', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  getOverview: () => request('/admin/overview'),

  getAnalytics: () => request('/admin/analytics'),

  getStaff: ({ role = '', status = '', q = '', page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request(`/admin/staff?${params.toString()}`);
  },

  createStaff: (payload) => request('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateStaff: (staffId, payload) => request(`/admin/staff/${staffId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  updateStaffStatus: (staffId, status) => request(`/admin/staff/${staffId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  deleteStaff: (staffId) => request(`/admin/staff/${staffId}`, {
    method: 'DELETE'
  }),

  getRefundRequests: (status = '') => request(`/admin/conflicts/refunds${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  updateRefundRequest: (refundId, payload) => request(`/admin/conflicts/refunds/${refundId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  getBans: (active = '') => request(`/admin/conflicts/bans${active === '' ? '' : `?active=${active}`}`),

  getConflictUsers: ({ q = '', role = '' } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    const qs = params.toString();
    return request(`/admin/conflicts/users${qs ? `?${qs}` : ''}`);
  },

  createBan: (payload) => request('/admin/conflicts/bans', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateBan: (banId, payload) => request(`/admin/conflicts/bans/${banId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  getConfig: () => request('/admin/config'),

  updateConfig: (payload) => request('/admin/config', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  getAuditLogs: ({ action = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request(`/admin/audit-logs?${params.toString()}`);
  },

  getEmergencyAlerts: ({ status = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request(`/admin/emergency-alerts?${params.toString()}`);
  },

  resolveEmergencyAlert: (alertId) => request(`/admin/emergency-alerts/${alertId}/resolve`, {
    method: 'PATCH'
  }),

  getSentimentReviews: ({ sentiment = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (sentiment) params.set('sentiment', sentiment);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request(`/admin/alerts/reviews?${params.toString()}`);
  },

  getFlaggedDrivers: () => request('/admin/alerts/flagged-drivers'),

  getSalaryApprovals: (status) => request(`/users/admin/salaries${status ? `?status=${status}` : ''}`),

  getSalaryCandidates: (role) => request(`/users/admin/salaries/candidates${role ? `?role=${encodeURIComponent(role)}` : ''}`),

  createSalaryApprovals: (payload) => request('/users/admin/salaries', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateSalaryApproval: (salaryId, payload) => request(`/users/admin/salaries/${salaryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  updateSalaryStatus: (salaryId, payload) => request(`/users/admin/salaries/${salaryId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
};
