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

export const tourManagerAPI = {
  // --- PACKAGES ---
  getPackages: () => fetch(`${API_BASE}/tourmanager/packages`, {
    headers: authHeaders()
  }).then(r => r.json()),

  createPackage: (payload) => fetch(`${API_BASE}/tourmanager/packages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  updatePackage: (packageId, payload) => fetch(`${API_BASE}/tourmanager/packages/${packageId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  deletePackage: (packageId) => fetch(`${API_BASE}/tourmanager/packages/${packageId}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(r => r.json()),

  // --- TOURS ---
  getTours: () => fetch(`${API_BASE}/tourmanager/tours`, {
    headers: authHeaders()
  }).then(r => r.json()),

  createTour: (payload) => fetch(`${API_BASE}/tourmanager/tours`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  updateTour: (tourId, payload) => fetch(`${API_BASE}/tourmanager/tours/${tourId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  deleteTour: (tourId) => fetch(`${API_BASE}/tourmanager/tours/${tourId}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(r => r.json()),

  // --- QUOTES ---
  getQuotes: (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetch(`${API_BASE}/tourmanager/quotes${query}`, {
      headers: authHeaders()
    }).then(r => r.json());
  },

  updateQuote: (quoteId, payload) => fetch(`${API_BASE}/tourmanager/quotes/${quoteId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  getStats: () => fetch(`${API_BASE}/tourmanager/stats`, {
    headers: authHeaders()
  }).then(r => r.json()),

  // --- BOOKINGS & DISPATCH ---
  getBookings: () => fetch(`${API_BASE}/tourmanager/bookings`, {
    headers: authHeaders()
  }).then(r => r.json()),

  assignDriver: (bookingId, payload) => fetch(`${API_BASE}/tourmanager/tours/${bookingId}/assign-driver`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  // --- STAY OPERATIONS ---
  getStayRequests: (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetch(`${API_BASE}/tourmanager/stay/requests${query}`, {
      headers: authHeaders()
    }).then(r => r.json());
  },

  allocateStay: (bookingId, payload) => fetch(`${API_BASE}/tourmanager/stay/bookings/${bookingId}/allocate`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  updateStayStatus: (bookingId, payload) => fetch(`${API_BASE}/tourmanager/stay/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  deleteStayAllocation: (bookingId, allocationId) => fetch(`${API_BASE}/tourmanager/stay/bookings/${bookingId}/allocations/${allocationId}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(r => r.json()),

  getStayInventory: () => fetch(`${API_BASE}/tourmanager/stay/inventory`, {
    headers: authHeaders()
  }).then(r => r.json()),

  createStayInventory: (payload) => fetch(`${API_BASE}/tourmanager/stay/inventory`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  updateStayInventory: (inventoryId, payload) => fetch(`${API_BASE}/tourmanager/stay/inventory/${inventoryId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then(r => r.json()),

  deleteStayInventory: (inventoryId) => fetch(`${API_BASE}/tourmanager/stay/inventory/${inventoryId}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(r => r.json()),
};
