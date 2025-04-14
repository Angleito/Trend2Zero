import apiClient from '../api/apiClient';

export class MarketDataService {
    async getAssetBySymbol(symbol) {
        const response = await apiClient.get(`/market-data/assets/${symbol}`);
        return response.data;
    }

    async searchAssets(query, limit = 10) {
        const response = await apiClient.get('/market-data/assets/search', {
            params: { q: query, limit }
        });
        return response.data;
    }

    async getAssetsByType(type, limit = 10) {
        const response = await apiClient.get('/market-data/assets', {
            params: { type, limit }
        });
        return response.data;
    }

    async getHistoricalData(symbol, options = {}) {
        const response = await apiClient.get(`/market-data/historical/${symbol}`, {
            params: options
        });
        return response.data;
    }

    async getPopularAssets(limit = 10) {
        const response = await apiClient.get('/market-data/assets/popular', {
            params: { limit }
        });
        return response.data;
    }

    async getTrendingAssets(limit = 10) {
        const response = await apiClient.get('/market-data/assets/trending', {
            params: { limit }
        });
        return response.data;
    }

    async getAssetPrice(symbol) {
        const response = await apiClient.get(`/market-data/assets/${symbol}/price`);
        return response.data;
    }

    async getMarketOverview() {
        const response = await apiClient.get('/market-data/overview');
        return response.data;
    }
}

// Export both the class and a default instance
const marketDataService = new MarketDataService();
export default marketDataService;