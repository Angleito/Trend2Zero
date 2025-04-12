import React from 'react';

const mockUser = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User'
};

const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  signup: jest.fn(),
  logout: jest.fn(),
  error: null
};

const useAuth = (initialState = {}) => {
  const [user, setUser] = React.useState(() => {
    if (initialState && initialState.user) {
      return initialState.user;
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [error, setError] = React.useState(null);

  const login = jest.fn(async (credentials) => {
    try {
      setUser(mockUser);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      setError(err);
      setIsAuthenticated(false);
    }
  });

  const signup = jest.fn(async (userData) => {
    try {
      setUser(mockUser);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      setError(err);
      setIsAuthenticated(false);
    }
  });

  const logout = jest.fn(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  });

  return { user, isAuthenticated, login, signup, logout, error };
};

// Minimal test to ensure mock works
describe('AuthContext Mock', () => {
  it('should have a valid mock implementation', () => {
    const { user, isAuthenticated, login, signup, logout, error } = useAuth();
    
    expect(user).toBe(null);
    expect(isAuthenticated).toBe(false);
    expect(error).toBe(null);
    expect(login).toBeInstanceOf(Function);
    expect(signup).toBeInstanceOf(Function);
    expect(logout).toBeInstanceOf(Function);
  });
});

export { useAuth, mockUser, mockAuthContext };