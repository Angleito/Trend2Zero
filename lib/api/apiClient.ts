/**
 * API Client for Trend2Zero
 *
 * This module provides a centralized client for making API requests to the backend.
 */

import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const nodeEnv = process.env.NODE_ENV;
  const customPort = process.env.TEST_SERVER_PORT;
  const defaultPort = '3000';

  // For test environment, use the dynamic port if available
  if (nodeEnv === 'test' && customPort) {
    return `http://localhost:${customPort}/api`;
  }

  // Use environment variable if available
  if (envUrl) {
    return envUrl;
  }

  // Default development URL with fallback port
  return `http://localhost:${defaultPort}/api`;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
if (typeof window !== 'undefined') {
  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle response errors
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

/**
 * Set authentication token
 * @param {string} token - JWT token
 */
export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
}

/**
 * Get authentication token
 * @returns {string|null} JWT token
 */
export function getAuthToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

export const axiosInstance = axios;
