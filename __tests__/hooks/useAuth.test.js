import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from '../../lib/hooks/useAuth';
import * as authService from '../../lib/api/authService';
import { isAuthenticated } from '../../lib/api/apiClient';

// Mock the auth service
jest.mock('../../lib/api/authService');

// Mock the apiClient
jest.mock('../../lib/api/apiClient', () => ({
  isAuthenticated: jest.fn()
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
}));

describe('Auth Hooks', () => {
  const mockUser = {
    _id: '123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    isAuthenticated.mockReturnValue(false);
    authService.getCurrentUser.mockResolvedValue({
      data: { user: mockUser }
    });
  });

  describe('useAuth', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

    it('initializes with null user and loading state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should still be null since isAuthenticated is false
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('fetches user data when authenticated', async () => {
      isAuthenticated.mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have user data
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('handles signup correctly', async () => {
      authService.signup.mockResolvedValue({
        data: { user: mockUser }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Perform signup
      await act(async () => {
        await result.current.signup({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          passwordConfirm: 'password123'
        });
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have user data
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authService.signup).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      });
    });

    it('handles login correctly', async () => {
      authService.login.mockResolvedValue({
        data: { user: mockUser }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Perform login
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have user data
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('handles logout correctly', async () => {
      isAuthenticated.mockReturnValue(true);
      authService.logout.mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have null user
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });

    it('handles update user info correctly', async () => {
      isAuthenticated.mockReturnValue(true);
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      authService.updateUserInfo.mockResolvedValue({
        data: { user: updatedUser }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Perform update
      await act(async () => {
        await result.current.updateUserInfo({ name: 'Updated Name' });
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have updated user data
      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.loading).toBe(false);
      expect(authService.updateUserInfo).toHaveBeenCalledWith({ name: 'Updated Name' });
    });

    it('handles update password correctly', async () => {
      isAuthenticated.mockReturnValue(true);
      authService.updatePassword.mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Perform update password
      await act(async () => {
        await result.current.updatePassword({
          passwordCurrent: 'oldpassword',
          password: 'newpassword',
          passwordConfirm: 'newpassword'
        });
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should still have user data
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(authService.updatePassword).toHaveBeenCalledWith({
        passwordCurrent: 'oldpassword',
        password: 'newpassword',
        passwordConfirm: 'newpassword'
      });
    });

    it('handles delete account correctly', async () => {
      isAuthenticated.mockReturnValue(true);
      authService.deleteAccount.mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Perform delete account
      await act(async () => {
        await result.current.deleteAccount();
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have null user
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.deleteAccount).toHaveBeenCalled();
    });

    it('handles refresh user data correctly', async () => {
      isAuthenticated.mockReturnValue(true);
      const updatedUser = { ...mockUser, name: 'Refreshed Name' };
      authService.getCurrentUser.mockResolvedValue({
        data: { user: updatedUser }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Clear the mock to track the next call
      authService.getCurrentUser.mockClear();

      // Perform refresh
      await act(async () => {
        await result.current.refreshUserData();
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should have updated user data
      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.loading).toBe(false);
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });
  });
});
