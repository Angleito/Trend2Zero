/**
 * Authentication Hooks
 * 
 * This module provides React hooks for authentication and user management.
 */

import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useRouter } from 'next/router';
import * as authService from '@/lib/api/authService';
import { isAuthenticated } from '@/lib/api/apiClient';

// Create auth context
const AuthContext = createContext({
    isAuthenticated: false,
    user: null,
    login: () => {},
    logout: () => {},
    loading: true
});

/**
 * Auth Provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Provider component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data.user);
        } catch (err) {
          console.error('Error fetching user data:', err);
          // Clear invalid token
          await authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Sign up function
  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.signup(userData);
      setUser(response.data.user);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      setUser(response.data.user);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Error during logout:', err);
      // Still clear user state even if API call fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Update user info function
  const updateUserInfo = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.updateUserInfo(userData);
      setUser(response.data.user);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user info');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update password function
  const updatePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.updatePassword(passwordData);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete account function
  const deleteAccount = async () => {
    try {
      setLoading(true);
      await authService.deleteAccount();
      setUser(null);
      router.push('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (!isAuthenticated()) return;
    
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Error refreshing user data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateUserInfo,
    updatePassword,
    deleteAccount,
    refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook for using auth context
 * @returns {Object} - Auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook for protecting routes
 * @param {Object} options - Options
 * @param {string} options.redirectTo - Redirect path for unauthenticated users
 * @returns {Object} - Auth state
 */
export function useProtectedRoute(options = { redirectTo: '/login' }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(options.redirectTo);
    }
  }, [loading, user, router, options.redirectTo]);

  return { user, loading };
}
