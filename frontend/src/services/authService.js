import api from './api';

export const authService = {
  /**
   * Register a new user account.
   */
  async register({ email, password, displayName }) {
    const response = await api.post('/auth/register', {
      email,
      password,
      displayName,
    });
    return response.data;
  },

  /**
   * Log in an existing user.
   */
  async login({ email, password }) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Log out the current user and clear session cookie.
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response;
  },

  /**
   * Fetch current authenticated user's profile.
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
