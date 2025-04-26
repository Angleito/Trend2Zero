import { useState, useEffect, useCallback } from 'react';
import * as authService from '../api/authService';

export interface User {
  _id: string;
  email: string;
  name?: string;
  role: string;
}

export interface AuthResponse {
  token?: string;
  user: User | null;
}

export interface CurrentUserResponse {
  user: User | null;
}

export interface AuthHook {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, passwordConfirm: string) => Promise<void>;
  // resetPassword: (email: string) => Promise<void>;
}

export const useAuth = (): AuthHook => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      setUser((response as CurrentUserResponse).user);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(null); // Don't show error for auth check
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      setUser((response as CurrentUserResponse).user);
      setError(null);
    } catch (err: any) {
      setUser(null);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, passwordConfirm: string) => {
    try {
      setLoading(true);
      const response = await authService.signup({ email, password, name, passwordConfirm }); // TODO: Handle password confirmation properly
      setUser((response as CurrentUserResponse).user);
      setError(null);
    } catch (err: any) {
      setUser(null);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // const resetPassword = useCallback(async (email: string) => {
//   try {
//     setLoading(true);
//     // await authService.resetPassword(email); // Function not available in authService
//     setError(null);
//   } catch (err: any) {
//     setError(err.response?.data?.message || 'Password reset failed');
//     throw err;
//   } finally {
//     setLoading(false);
//   }
// }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    register,
    // resetPassword
  };
};