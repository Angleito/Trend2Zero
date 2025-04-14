import apiClient from './apiClient';

export const getAllAssets = async (options = {}) => {
    const { data } = await apiClient.get('/market-data/assets', { params: options });
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
    const { data } = await apiClient.get(`/market-data/assets/type/${type}`, {
        params: { limit }
    });
    return data;
};

export const getAssetHistory = async (symbol, { days = 30, interval = '1d' } = {}) => {
    const { data } = await apiClient.get(`/market-data/history/${symbol}`, {
        params: { days, interval }
    });
    return data;
};

export const getHistoricalData = async (symbol, options = {}) => {
    const { data } = await apiClient.get(`/market-data/historical/${symbol}`, {
        params: options
    });
    return data;
};

export const getAssetBySymbol = async (symbol) => {
    const { data } = await apiClient.get(`/market-data/assets/${symbol}`);
    return data;
};

export const getMarketData = async (symbol) => {
    const { data } = await apiClient.get(`/market-data/${symbol}`);
    return data;
};

export const getAssetPrice = async (symbol) => {
    const { data } = await apiClient.get(`/market-data/price/${symbol}`);
    return data;
};
