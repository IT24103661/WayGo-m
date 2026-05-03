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

export const fleetManagerAPI = {
  getVehicles: () => request('/fleetmanager/vehicles'),

  getAvailableVehicles: () => request('/fleetmanager/vehicles/available'),

  addVehicle: (payload) => request('/fleetmanager/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateVehicle: (vehicleId, payload) => request(`/fleetmanager/vehicles/${vehicleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  deleteVehicle: (vehicleId) => request(`/fleetmanager/vehicles/${vehicleId}`, {
    method: 'DELETE'
  }),

  assignBooking: (bookingId, payload) => request(`/fleetmanager/bookings/${bookingId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),

  getFleetBookings: (status) => request(`/fleetmanager/bookings${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  updateFleetBooking: (bookingId, payload) => request(`/fleetmanager/bookings/${bookingId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  deleteFleetBooking: (bookingId) => request(`/fleetmanager/bookings/${bookingId}`, {
    method: 'DELETE'
  }),

  getMaintenanceAlerts: () => request('/fleetmanager/maintenance-alerts'),

  getNotifications: () => request('/fleetmanager/notifications'),

  markNotificationRead: (id) => request(`/fleetmanager/notifications/${id}/read`, {
    method: 'PATCH'
  }),

  markAllNotificationsRead: () => request('/fleetmanager/notifications/read-all', {
    method: 'PATCH'
  }),

  getManagedDrivers: () => request('/fleetmanager/drivers'),

  createManualDriver: (payload) => request('/fleetmanager/drivers/manual', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateManualDriver: (driverId, payload) => request(`/fleetmanager/drivers/manual/${driverId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  deleteManualDriver: (driverId) => request(`/fleetmanager/drivers/manual/${driverId}`, {
    method: 'DELETE'
  }),

  getAvailableDrivers: () => request('/fleetmanager/drivers/available'),

  getSalaries: (month) => request(`/fleetmanager/salaries${month ? `?month=${month}` : ''}`),

  saveSalary: (payload) => request('/fleetmanager/salaries', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  updateSalary: (salaryId, payload) => request(`/fleetmanager/salaries/${salaryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  deleteSalary: (salaryId) => request(`/fleetmanager/salaries/${salaryId}`, {
    method: 'DELETE'
  }),

  getProfile: () => request('/users/profile'),

  updateProfile: (payload) => request('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
};
