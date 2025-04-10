import axios from 'axios';
import apiClient, { setAuthToken, getAuthToken, isAuthenticated } from '../../lib/api/apiClient';

const mockAxiosCreate = jest.fn();
const mockRequestUse = jest.fn();
const mockResponseUse = jest.fn();

// Create mock instance before using it in mock
const mockAxiosInstance = {
  interceptors: {
    request: { use: mockRequestUse },
    response: { use: mockResponseUse }
  },
  defaults: { baseURL: '' }
};

// Mock axios after creating the instance
jest.mock('axios', () => ({
  create: mockAxiosCreate.mockReturnValue(mockAxiosInstance)
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('creates an axios instance with correct config', () => {
    expect(mockAxiosCreate).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
  });

  it('sets up request interceptor', () => {
    expect(mockRequestUse).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('sets up response interceptor', () => {
    expect(mockResponseUse).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  describe('setAuthToken', () => {
    it('sets token in localStorage when provided', () => {
      setAuthToken('test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
    });

    it('removes token from localStorage when not provided', () => {
      setAuthToken();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('getAuthToken', () => {
    it('gets token from localStorage', () => {
      localStorageMock.setItem('token', 'test-token');
      expect(getAuthToken()).toBe('test-token');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
    });

    it('returns null when token is not in localStorage', () => {
      expect(getAuthToken()).toBe(null);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      localStorageMock.setItem('token', 'test-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when token does not exist', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });
});
