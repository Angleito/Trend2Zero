import React from 'react';
import { useRouter } from 'next/router';

// Create a mock context with simplified implementation
export const AuthContext = React.createContext({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  updateUserInfo: async () => {},
  updatePassword: async () => {},
  deleteAccount: async () => {}
});

export const AuthProvider = ({ children, initialState = {} }) => {
  const router = useRouter();

  const [user, setUser] = React.useState(() => {
    if (initialState && initialState.user) {
      return initialState.user;
    }
    return null;
  });

  const [loading, setLoading] = React.useState(() => {
    if (initialState && initialState.loading !== undefined) {
      return initialState.loading;
    }
    return true;
  });

  const [error, setError] = React.useState(() => {
    if (initialState && initialState.error) {
      return initialState.error;
    }
    return null;
  });

  // Simplified auth methods
  const signup = React.useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const mockUser = { 
        id: 'user-123', 
        email: userData.email 
      };
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setUser(mockUser);
      setLoading(false);
      return { data: { user: mockUser } };
    } catch (err) {
      setError(err.message || 'Signup failed');
      setUser(null);
      setLoading(false);
      throw err;
    }
  }, []);

  const login = React.useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const mockUser = { 
        id: 'user-123', 
        email: credentials.email 
      };
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setUser(mockUser);
      setLoading(false);
      return { data: { user: mockUser } };
    } catch (err) {
      setError(err.message || 'Login failed');
      setUser(null);
      setLoading(false);
      throw err;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      setUser(null);
      setLoading(false);
      router.push('/login');
    } catch (err) {
      setError(err.message || 'Logout failed');
      setLoading(false);
    }
  }, [router]);

  const updateUserInfo = React.useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = { 
        ...user, 
        ...userData 
      };
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setUser(updatedUser);
      setLoading(false);
      return { data: { user: updatedUser } };
    } catch (err) {
      setError(err.message || 'Update failed');
      setLoading(false);
      throw err;
    }
  }, [user]);

  const updatePassword = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setLoading(false);
      return { data: { message: 'Password updated' } };
    } catch (err) {
      setError(err.message || 'Password update failed');
      setLoading(false);
      throw err;
    }
  }, []);

  const deleteAccount = React.useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      setUser(null);
      setLoading(false);
      router.push('/login');
    } catch (err) {
      setError(err.message || 'Account deletion failed');
      setLoading(false);
    }
  }, [router]);

  const value = React.useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateUserInfo,
    updatePassword,
    deleteAccount
  }), [
    user, 
    loading, 
    error, 
    signup, 
    login, 
    logout, 
    updateUserInfo, 
    updatePassword, 
    deleteAccount
  ]);

  return (
    <AuthContext.Provider value={value}>
      <div data-testid="auth-context-wrapper">{children}</div>
    </AuthContext.Provider>
  );
};

// Mock useAuth hook
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};