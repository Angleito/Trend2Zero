/**
 * Authentication API Service
 * 
 * This module provides functions for user authentication and account management.
 */

import apiClient, { setAuthToken } from './apiClient';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.passwordConfirm - Password confirmation
 * @returns {Promise<Object>} - API response
 */
export const signup = async (userData) => {
  try {
    const response = await apiClient.post('/users/signup', userData);
    
    // Store token in localStorage
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error during signup:', error);
    throw error;
  }
};

/**
 * Log in a user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} - API response
 */
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/users/login', credentials);
    
    // Store token in localStorage
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

/**
 * Log out the current user
 * @returns {Promise<Object>} - API response
 */
export const logout = async () => {
  try {
    const response = await apiClient.get('/users/logout');
    
    // Remove token from localStorage
    setAuthToken(null);
    
    return response.data;
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Remove token even if API call fails
    setAuthToken(null);
    
    throw error;
  }
};

/**
 * Get current user information
 * @returns {Promise<Object>} - API response
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

/**
 * Update current user information
 * @param {Object} userData - User data to update
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @returns {Promise<Object>} - API response
 */
export const updateUserInfo = async (userData) => {
  try {
    const response = await apiClient.patch('/users/updateMe', userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user info:', error);
    throw error;
  }
};

/**
 * Update current user password
 * @param {Object} passwordData - Password data
 * @param {string} passwordData.passwordCurrent - Current password
 * @param {string} passwordData.password - New password
 * @param {string} passwordData.passwordConfirm - New password confirmation
 * @returns {Promise<Object>} - API response
 */
export const updatePassword = async (passwordData) => {
  try {
    const response = await apiClient.patch('/users/updateMyPassword', passwordData);
    
    // Update token in localStorage
    if (response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Delete current user account
 * @returns {Promise<Object>} - API response
 */
export const deleteAccount = async () => {
  try {
    const response = await apiClient.delete('/users/deleteMe');
    
    // Remove token from localStorage
    setAuthToken(null);
    
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};
