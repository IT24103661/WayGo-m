import axios from 'axios';

// Get base URL from env or use default
const API_URL = 'http://localhost:5001/api/driver'; 

// Utility to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('waygo_token') || localStorage.getItem('token');
  return {
    headers: {
      ...(token && token !== 'null' && token !== 'undefined'
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
  };
};

export const updateDriverStatus = async (statusData) => {
  const response = await axios.patch(`${API_URL}/status`, statusData, getAuthHeaders());
  return response.data;
};

export const getAvailableJobs = async () => {
  const response = await axios.get(`${API_URL}/jobs/available`, getAuthHeaders());
  return response.data;
};

export const getMyJobs = async () => {
  const response = await axios.get(`${API_URL}/jobs/mine`, getAuthHeaders());
  return response.data;
};

export const acceptJob = async (bookingId) => {
  const response = await axios.patch(`${API_URL}/bookings/${bookingId}/accept`, {}, getAuthHeaders());
  return response.data;
};

export const updateJobStatus = async (bookingId, status) => {
  const response = await axios.patch(`${API_URL}/bookings/${bookingId}/status`, { status }, getAuthHeaders());
  return response.data;
};
