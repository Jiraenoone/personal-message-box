import axios from 'axios';

// Relative by default: dev goes through the Vite proxy, production is same-origin
// (Express serves the build). Set VITE_API_URL only if the API lives on another origin.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;

      // Handle 401 - redirect to login.
      // Skip: the silent session check (/auth/me) that runs on every page load,
      // and public pages (landing, auth, public submit /m/:slug) that guests may visit.
      if (error.response.status === 401) {
        const path = window.location.pathname;
        const requestUrl = error.config?.url || '';
        const isSessionCheck = requestUrl.endsWith('/auth/me');
        const isPublicPage = path === '/' ||
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/m/');
        if (!isSessionCheck && !isPublicPage) {
          window.location.href = '/login';
        }
      }

      return Promise.reject(errorData?.error || { message: 'An error occurred' });
    }

    if (error.request) {
      // Request was made but no response received
      return Promise.reject({ message: 'Network error. Please check your connection.' });
    }

    return Promise.reject({ message: error.message });
  }
);

export default api;
