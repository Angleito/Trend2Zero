import apiClient from '../../lib/api/apiClient';
import * as authService from '../../lib/api/authService';
import { setAuthToken } from '../../lib/api/apiClient';

// Mock the API client and setAuthToken
jest.mock('../../lib/api/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  setAuthToken: jest.fn()
}));

describe('Auth API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('calls the correct endpoint with user data', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          token: 'test-token',
          data: {
            user: {
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        }
      };
      apiClient.post.mockResolvedValue(mockResponse);

      // Call the function
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      };
      const result = await authService.signup(userData);

      // Assertions
      expect(apiClient.post).toHaveBeenCalledWith('/users/signup', userData);
      expect(setAuthToken).toHaveBeenCalledWith('test-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('handles errors correctly', async () => {
      // Mock error
      const mockError = new Error('API Error');
      apiClient.post.mockRejectedValue(mockError);

      // Call the function and expect it to throw
      await expect(authService.signup({})).rejects.toThrow('API Error');
    });
  });

  describe('login', () => {
    it('calls the correct endpoint with credentials', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          token: 'test-token',
          data: {
            user: {
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        }
      };
      apiClient.post.mockResolvedValue(mockResponse);

      // Call the function
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      const result = await authService.login(credentials);

      // Assertions
      expect(apiClient.post).toHaveBeenCalledWith('/users/login', credentials);
      expect(setAuthToken).toHaveBeenCalledWith('test-token');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    it('calls the correct endpoint and clears token', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success'
        }
      };
      apiClient.get.mockResolvedValue(mockResponse);

      // Call the function
      const result = await authService.logout();

      // Assertions
      expect(apiClient.get).toHaveBeenCalledWith('/users/logout');
      expect(setAuthToken).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockResponse.data);
    });

    it('clears token even if API call fails', async () => {
      // Mock error
      const mockError = new Error('API Error');
      apiClient.get.mockRejectedValue(mockError);

      // Call the function and expect it to throw
      await expect(authService.logout()).rejects.toThrow('API Error');
      expect(setAuthToken).toHaveBeenCalledWith(null);
    });
  });

  describe('getCurrentUser', () => {
    it('calls the correct endpoint', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            user: {
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        }
      };
      apiClient.get.mockResolvedValue(mockResponse);

      // Call the function
      const result = await authService.getCurrentUser();

      // Assertions
      expect(apiClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateUserInfo', () => {
    it('calls the correct endpoint with user data', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            user: {
              name: 'Updated Name',
              email: 'test@example.com'
            }
          }
        }
      };
      apiClient.patch.mockResolvedValue(mockResponse);

      // Call the function
      const userData = {
        name: 'Updated Name'
      };
      const result = await authService.updateUserInfo(userData);

      // Assertions
      expect(apiClient.patch).toHaveBeenCalledWith('/users/updateMe', userData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updatePassword', () => {
    it('calls the correct endpoint with password data and updates token', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          token: 'new-token',
          data: {
            user: {
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        }
      };
      apiClient.patch.mockResolvedValue(mockResponse);

      // Call the function
      const passwordData = {
        passwordCurrent: 'oldpassword',
        password: 'newpassword',
        passwordConfirm: 'newpassword'
      };
      const result = await authService.updatePassword(passwordData);

      // Assertions
      expect(apiClient.patch).toHaveBeenCalledWith('/users/updateMyPassword', passwordData);
      expect(setAuthToken).toHaveBeenCalledWith('new-token');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteAccount', () => {
    it('calls the correct endpoint and clears token', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          data: null
        }
      };
      apiClient.delete.mockResolvedValue(mockResponse);

      // Call the function
      const result = await authService.deleteAccount();

      // Assertions
      expect(apiClient.delete).toHaveBeenCalledWith('/users/deleteMe');
      expect(setAuthToken).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
