/**
 * Watchlist API Service
 * 
 * This module provides functions for managing the user's watchlist.
 */

import apiClient from './apiClient';

/**
 * Get the current user's watchlist
 * @returns {Promise<Object>} - API response
 */
export const getWatchlist = async () => {
  try {
    const response = await apiClient.get('/users/watchlist');
    return response.data;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
};

/**
 * Add an asset to the watchlist
 * @param {Object} assetData - Asset data
 * @param {string} assetData.assetSymbol - Asset symbol
 * @param {string} assetData.assetType - Asset type
 * @returns {Promise<Object>} - API response
 */
export const addToWatchlist = async (assetData) => {
  try {
    const response = await apiClient.post('/users/watchlist', assetData);
    return response.data;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
};

/**
 * Remove an asset from the watchlist
 * @param {string} assetSymbol - Asset symbol to remove
 * @returns {Promise<Object>} - API response
 */
export const removeFromWatchlist = async (assetSymbol) => {
  try {
    const response = await apiClient.delete(`/users/watchlist/${assetSymbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing ${assetSymbol} from watchlist:`, error);
    throw error;
  }
};
