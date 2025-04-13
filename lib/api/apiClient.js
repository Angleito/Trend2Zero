/**
 * API Client for Trend2Zero
 *
 * This module provides a centralized client for making API requests to the backend.
 */

import axios from 'axios';

// Determine the most appropriate API URL
const determineApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const customPort = process.env.NEXT_PUBLIC_PORT || process.env.PORT;
  
  // Detect port dynamically
  const detectPort = () => {
    if (typeof window !== 'undefined') {
      // Client-side: use current window location
      const { protocol, hostname, port } = window.location;
      return port || (protocol === 'https:' ? '443' : '80');
    }
    
    // Server-side: use environment variables or defaults
    return customPort ||
           (process.env.NODE_ENV === 'development' ? '3000' : '80');
  };

  const port = detectPort();
  const baseUrl = envUrl || `http://localhost:${port}/api`;
  
  console.log('Comprehensive API URL Configuration:', {
    envUrl,
    detectedPort: port,
    baseUrl,
    nodeEnv: process.env.NODE_ENV,
    customPort,
    currentLocation: typeof window !== 'undefined' ? window.location.href : 'server-side'
  });

  return baseUrl;
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: determineApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Allow cookies for authentication
});

// Only add interceptors in non-test environment
if (process.env.NODE_ENV !== 'test') {
  // Request interceptor for adding auth token and logging
  apiClient.interceptors.request.use(
    (config) => {
      // Enhanced logging for request configuration
      console.log('API Request Details:', {
        baseURL: config.baseURL,
        url: config.url,
        method: config.method,
        params: config.params,
        headers: {
          ...config.headers,
          Authorization: config.headers.Authorization ? '[REDACTED]' : 'Not Set'
        }
      });

      // Get token from localStorage if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      // If token exists, add to headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      console.error('Request Interceptor Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling errors and logging
  apiClient.interceptors.response.use(
    (response) => {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data ? '[TRUNCATED]' : null
      });
      return response;
    },
    (error) => {
      console.error('Comprehensive API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });

      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        // Clear token and redirect to login if on client side
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }

      return Promise.reject(error);
    }
  );
}

// Export the axios instance for testing
export const axiosInstance = axios;

/**
 * Set authentication token
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

/**
 * Get authentication token
 * @returns {string|null} JWT token
 */
export const getAuthToken = () => {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default apiClient;
