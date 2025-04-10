import axios from 'axios';
import apiClient, { setAuthToken, getAuthToken, isAuthenticated, axiosInstance } from '../../lib/api/apiClient';

// Mock axios
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    defaults: { baseURL: '' }
  };
  return mockAxios;
});

// Mock the exported axiosInstance
jest.mock('../../lib/api/apiClient', () => {
  const originalModule = jest.requireActual('../../lib/api/apiClient');
  return {
    ...originalModule,
    axiosInstance: {
      create: jest.fn(() => originalModule.default),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      },
      defaults: { baseURL: '' }
    }
  };
});

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
    expect(axiosInstance.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
  });

  it('sets up request interceptor', () => {
    expect(axiosInstance.interceptors.request.use).toHaveBeenCalled();
  });

  it('sets up response interceptor', () => {
    expect(axiosInstance.interceptors.response.use).toHaveBeenCalled();
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
