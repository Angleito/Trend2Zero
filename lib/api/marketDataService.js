import apiClient from './apiClient';

export const getMarketData = async (symbol) => {
    const { data } = await apiClient.get(`/market-data/${symbol}`);
    return data;
};

export const searchAssets = async (query, type = 'crypto', limit = 5) => {
    const { data } = await apiClient.get('/market-data/search', {
        params: { query, type, limit }
    });
    return data;
};

export const getPopularAssets = async (limit = 10) => {
    const { data } = await apiClient.get('/market-data/popular', {
        params: { limit }
    });
    return data;
};

export const getAssetsByType = async (type, limit = 10) => {
    try {
        console.log(`Fetching assets by type: ${type}, limit: ${limit}`);
        const response = await apiClient.get('/market-data/assets', {
            params: { type, limit }
        });
        
        console.log('Assets response:', response.data);
        
        // Ensure consistent response structure
        return {
            assets: response.data || [],
            total: response.data ? response.data.length : 0
        };
    } catch (error) {
        console.error('Error fetching assets by type:', error);
        throw error;
    }
};

export const getAssetHistory = async (symbol, { days = 30, interval = '1d' } = {}) => {
    const { data } = await apiClient.get(`/market-data/history/${symbol}`, {
        params: { days, interval }
    });
    return data;
};

export const getAssetBySymbol = async (symbol) => {
    const { data } = await apiClient.get(`/market-data/asset/${symbol}`);
    return data;
};

/**
 * Get current price for an asset
 * @param {string} symbol - Asset symbol (e.g., 'BTC', 'ETH')
 * @returns {Promise<Object>} Price data including current price and 24h change
 */
export const getAssetPrice = async (symbol) => {
    const { data } = await apiClient.get(`/market-data/price/${symbol}`);
    return data;
};
