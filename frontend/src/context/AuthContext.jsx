import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth state on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getMe();
      setUser(data.user);
    } catch {
      // 401 or not authenticated is normal for guests
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (credentials) => {
    setError(null);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    }
  };

  // Register handler
  const register = async (userData) => {
    setError(null);
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser: checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
