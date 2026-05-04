import axios from 'axios';

// This uses the Render URL if available, otherwise it falls back to localhost for development
const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

export default api;