import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for 401 (Token Expiry)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If 401 and not already retrying
    if (error.response?.status === 401 && !error.config._retry) {
      // You could implement refresh token logic here
      // For now, simpler handling:
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;
