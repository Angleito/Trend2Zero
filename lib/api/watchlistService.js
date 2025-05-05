/**
 * Watchlist API Service
 * 
 * This module provides functions for managing the user's watchlist.
 * @module watchlistService
 */

import { apiClient } from './apiClient';

/**
 * Asset type definition
 * @typedef {Object} WatchlistAsset
 * @property {string} symbol - Asset symbol (e.g., 'BTC', 'AAPL')
 * @property {string} type - Asset type (e.g., 'crypto', 'stock')
 * @property {string} dateAdded - ISO date string when asset was added
 */

/**
 * Get the current user's watchlist
 * @returns {Promise<WatchlistAsset[]>} Array of watchlist assets
 * @throws {Error} If API request fails
 */
export async function getWatchlist() {
  try {
    const response = await apiClient.get('/users/watchlist');
    return response.data;
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch watchlist');
  }
}

/**
 * Add an asset to the watchlist
 * @param {string} symbol - Asset symbol to add
 * @returns {Promise<WatchlistAsset[]>} Updated watchlist
 * @throws {Error} If API request fails
 */
export async function addToWatchlist(symbol) {
  try {
    const response = await apiClient.post('/users/watchlist', { symbol });
    return response.data;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw new Error(error.response?.data?.message || 'Failed to add asset to watchlist');
  }
}

/**
 * Remove an asset from the watchlist
 * @param {string} symbol - Asset symbol to remove
 * @returns {Promise<WatchlistAsset[]>} Updated watchlist
 * @throws {Error} If API request fails
 */
export async function removeFromWatchlist(symbol) {
  try {
    const response = await apiClient.delete(`/users/watchlist/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing ${symbol} from watchlist:`, error);
    throw new Error(error.response?.data?.message || 'Failed to remove asset from watchlist');
  }
}
