/**
 * Market Data API Service
 * 
 * This module provides functions for interacting with the market data API endpoints.
 */

import apiClient from './apiClient';

/**
 * Get all assets with optional filtering
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by asset type
 * @param {string} options.sort - Sort field(s)
 * @param {number} options.page - Page number
 * @param {number} options.limit - Results per page
 * @param {string} options.fields - Fields to include
 * @returns {Promise<Object>} - API response
 */
export const getAllAssets = async (options = {}) => {
  try {
    const response = await apiClient.get('/market-data/assets', { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

/**
 * Get asset by symbol
 * @param {string} symbol - Asset symbol
 * @returns {Promise<Object>} - API response
 */
export const getAssetBySymbol = async (symbol) => {
  try {
    const response = await apiClient.get(`/market-data/assets/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching asset ${symbol}:`, error);
    throw error;
  }
};

/**
 * Get asset price in BTC and USD
 * @param {string} symbol - Asset symbol
 * @returns {Promise<Object>} - API response
 */
export const getAssetPrice = async (symbol) => {
  try {
    const response = await apiClient.get(`/market-data/price/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Get historical data for an asset
 * @param {string} symbol - Asset symbol
 * @param {Object} options - Query options
 * @param {string} options.timeframe - Time interval (daily, weekly, monthly)
 * @param {string} options.currency - Currency for prices (USD, BTC)
 * @param {number} options.days - Number of days of historical data
 * @returns {Promise<Object>} - API response
 */
export const getHistoricalData = async (symbol, options = {}) => {
  try {
    const response = await apiClient.get(`/market-data/historical/${symbol}`, { params: options });
    return response.data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Search for assets
 * @param {string} query - Search query
 * @param {string} type - Asset type (crypto, stock, metal, all)
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Object>} - API response
 */
export const searchAssets = async (query, type = 'all', limit = 10) => {
  try {
    const response = await apiClient.get('/market-data/assets/search', {
      params: { query, type, limit }
    });
    return response.data;
  } catch (error) {
    console.error(`Error searching assets for "${query}":`, error);
    throw error;
  }
};

/**
 * Get popular assets
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Object>} - API response
 */
export const getPopularAssets = async (limit = 10) => {
  try {
    const response = await apiClient.get('/market-data/assets/popular', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching popular assets:', error);
    throw error;
  }
};

/**
 * Get assets by type
 * @param {string} type - Asset type (Cryptocurrency, Stocks, Precious Metal, Commodities, Indices)
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Object>} - API response
 */
export const getAssetsByType = async (type, limit = 20) => {
  try {
    const response = await apiClient.get(`/market-data/assets/type/${type}`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching assets of type ${type}:`, error);
    throw error;
  }
};
