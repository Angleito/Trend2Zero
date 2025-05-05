/**
 * Authentication API Service
 * 
 * This module provides functions for user authentication and account management.
 */

const { apiClient, setAuthToken } = require('./apiClient');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.passwordConfirm - Password confirmation
 * @returns {Promise<Object>} - API response
 */
async function register(userData) {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error during signup:', error);
    throw error;
  }
}

/**
 * Log in a user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} - API response
 */
async function login(credentials) {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    const { token } = response.data;
    setAuthToken(token);
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

/**
 * Log out the current user
 * @returns {Promise<Object>} - API response
 */
async function logout() {
  try {
    setAuthToken(null);
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}

/**
 * Get current user information
 * @returns {Promise<Object>} - API response
 */
async function getCurrentUser() {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
}

/**
 * Update current user information
 * @param {Object} userData - User data to update
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @returns {Promise<Object>} - API response
 */
async function updateUserInfo(userData) {
  try {
    const response = await apiClient.patch('/users/updateMe', userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user info:', error);
    throw error;
  }
}

/**
 * Update current user password
 * @param {Object} passwordData - Password data
 * @param {string} passwordData.passwordCurrent - Current password
 * @param {string} passwordData.password - New password
 * @param {string} passwordData.passwordConfirm - New password confirmation
 * @returns {Promise<Object>} - API response
 */
async function updatePassword(passwordData) {
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
}

/**
 * Delete current user account
 * @returns {Promise<Object>} - API response
 */
async function deleteAccount() {
  try {
    const response = await apiClient.delete('/users/deleteMe');
    
    // Remove token from localStorage
    setAuthToken(null);
    
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateUserInfo,
  updatePassword,
  deleteAccount
};
