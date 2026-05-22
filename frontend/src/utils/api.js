import axios from 'axios';
import Cookies from 'js-cookie';

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.endsWith('.local')
);

const API_URL = import.meta.env.VITE_API_URL || 
  (isLocalhost
    ? `http://${window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname}:8000`
    : 'https://9j3oe7izwh.execute-api.eu-west-2.amazonaws.com/Prod');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Try to get token from memory/local storage for now. In a real app with strict 
  // memory-only requirements, we'd inject it via state, but for the API interceptor, 
  // keeping it in a secure way is key. For mock purposes, we'll simulate.
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try refreshing token
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true // Assuming httpOnly cookie
        });
        const { access_token } = response.data;
        localStorage.setItem('accessToken', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = `${window.location.pathname.includes('.html') ? '/login.html' : '/login'}?expired=true`;
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
