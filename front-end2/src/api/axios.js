import axios from 'axios';

const api = axios.create({
    baseURL: '', // Empty base URL so requests starting with /api go through Vite proxy
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Try to refresh token (if endpoint exists) or just logout
                // Assuming simple logout for now as per previous script.js implementation
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                window.location.href = '/'; 
            } catch (err) {
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
