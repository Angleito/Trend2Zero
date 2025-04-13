const axios = require('axios');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

class MarketDataService {
    constructor() {
        this.apiClient = axios.create({
            baseURL: process.env.MARKET_DATA_API_URL,
            headers: {
                'X-API-Key': process.env.MARKET_DATA_API_KEY
            }
        });
    }

    async getMarketData(symbol) {
        try {
            const response = await this.apiClient.get(`/v1/market-data/${symbol}`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching market data for ${symbol}:`, error);
            throw new AppError('Failed to fetch market data', 500);
        }
    }

    async searchAssets(query, type = 'crypto', limit = 5) {
        try {
            const response = await this.apiClient.get('/v1/search', {
                params: { query, type, limit }
            });
            return response.data;
        } catch (error) {
            logger.error('Error searching assets:', error);
            throw new AppError('Failed to search assets', 500);
        }
    }

    async getPopularAssets(limit = 10) {
        try {
            const response = await this.apiClient.get('/v1/popular', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            logger.error('Error fetching popular assets:', error);
            throw new AppError('Failed to fetch popular assets', 500);
        }
    }

    async getAssetsByType(type, limit = 10) {
        try {
            const response = await this.apiClient.get(`/v1/assets/${type}`, {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            logger.error(`Error fetching assets by type ${type}:`, error);
            throw new AppError('Failed to fetch assets by type', 500);
        }
    }

    async getAssetHistory(symbol, { days = 30, interval = '1d' } = {}) {
        try {
            const response = await this.apiClient.get(`/v1/history/${symbol}`, {
                params: { days, interval }
            });
            return response.data;
        } catch (error) {
            logger.error(`Error fetching history for ${symbol}:`, error);
            throw new AppError('Failed to fetch asset history', 500);
        }
    }

    async getAssetBySymbol(symbol) {
        try {
            const response = await this.apiClient.get(`/v1/asset/${symbol}`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching asset ${symbol}:`, error);
            throw new AppError('Failed to fetch asset', 500);
        }
    }

    async getMarketOverview() {
        try {
            const response = await this.apiClient.get('/v1/market/overview');
            return response.data;
        } catch (error) {
            logger.error('Error fetching market overview:', error);
            throw new AppError('Failed to fetch market overview', 500);
        }
    }

    async getTrendingAssets() {
        try {
            const response = await this.apiClient.get('/v1/market/trending');
            return response.data;
        } catch (error) {
            logger.error('Error fetching trending assets:', error);
            throw new AppError('Failed to fetch trending assets', 500);
        }
    }
}

module.exports = new MarketDataService();
