import axios from 'axios';
// Create axios instance with base URL
const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    withCredentials: true
});
/**
 * API Service for interacting with the backend
 */
export class ApiService {
    /**
     * Get JWT token from localStorage
     */
    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }
    /**
     * Set authorization header if token exists
     */
    setAuthHeader() {
        const token = this.getToken();
        if (token) {
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        else {
            delete API.defaults.headers.common['Authorization'];
        }
    }
    /**
     * Handle API errors
     */
    handleError(error, context) {
        // Log a generic error message without exposing details
        console.error(`API Error in ${context}`);
        // Only log detailed error in development
        if (process.env.NODE_ENV === 'development') {
            console.debug('Detailed error:', error);
        }
        throw error;
    }
    /**
     * List available assets by category
     */
    async listAvailableAssets(options = {}) {
        try {
            this.setAuthHeader();
            const { category, page = 1, pageSize = 20, keywords } = options;
            // Build query parameters
            const params = { page, limit: pageSize };
            if (category) {
                params.type = category;
            }
            if (keywords) {
                params.search = keywords;
            }
            const response = await API.get('/market-data/assets', { params });
            return response.data.data.assets;
        }
        catch (error) {
            this.handleError(error, 'listAvailableAssets');
            return [];
        }
    }
    /**
     * Get asset price in BTC
     */
    async getAssetPriceInBTC(assetSymbol) {
        try {
            this.setAuthHeader();
            const response = await API.get(`/market-data/price/${assetSymbol}`);
            return response.data.data;
        }
        catch (error) {
            this.handleError(error, `getAssetPriceInBTC for ${assetSymbol}`);
            return null;
        }
    }
    /**
     * Get historical price data
     */
    async getHistoricalData(symbol, days = 30) {
        try {
            this.setAuthHeader();
            const response = await API.get(`/market-data/historical/${symbol}`, {
                params: { days }
            });
            return response.data.data.dataPoints;
        }
        catch (error) {
            this.handleError(error, `getHistoricalData for ${symbol}`);
            return [];
        }
    }
    /**
     * Search assets
     */
    async searchAssets(query) {
        try {
            this.setAuthHeader();
            const response = await API.get('/market-data/assets/search', {
                params: { query }
            });
            return response.data.data.assets;
        }
        catch (error) {
            this.handleError(error, `searchAssets for ${query}`);
            return [];
        }
    }
    /**
     * Get popular assets
     */
    async getPopularAssets(limit = 10) {
        try {
            this.setAuthHeader();
            const response = await API.get('/market-data/assets/popular', {
                params: { limit }
            });
            return response.data.data.assets;
        }
        catch (error) {
            this.handleError(error, 'getPopularAssets');
            return [];
        }
    }
    /**
     * Get assets by type
     */
    async getAssetsByType(type, limit = 20) {
        try {
            this.setAuthHeader();
            const response = await API.get(`/market-data/assets/type/${type}`, {
                params: { limit }
            });
            return response.data.data.assets;
        }
        catch (error) {
            this.handleError(error, `getAssetsByType for ${type}`);
            return [];
        }
    }
    /**
     * Register a new user
     */
    async register(name, email, password, passwordConfirm) {
        try {
            const response = await API.post('/users/signup', {
                name,
                email,
                password,
                passwordConfirm
            });
            // Store token in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                this.setAuthHeader();
            }
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'register');
            throw error;
        }
    }
    /**
     * Login a user
     */
    async login(email, password) {
        try {
            const response = await API.post('/users/login', {
                email,
                password
            });
            // Store token in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                this.setAuthHeader();
            }
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'login');
            throw error;
        }
    }
    /**
     * Logout a user
     */
    async logout() {
        try {
            this.setAuthHeader();
            await API.get('/users/logout');
            // Remove token from localStorage
            localStorage.removeItem('token');
            delete API.defaults.headers.common['Authorization'];
        }
        catch (error) {
            this.handleError(error, 'logout');
        }
    }
    /**
     * Get current user
     */
    async getCurrentUser() {
        try {
            this.setAuthHeader();
            const response = await API.get('/users/me');
            return response.data.data.user;
        }
        catch (error) {
            this.handleError(error, 'getCurrentUser');
            return null;
        }
    }
    /**
     * Update user profile
     */
    async updateProfile(data) {
        try {
            this.setAuthHeader();
            const response = await API.patch('/users/updateMe', data);
            return response.data.data.user;
        }
        catch (error) {
            this.handleError(error, 'updateProfile');
            throw error;
        }
    }
    /**
     * Update user password
     */
    async updatePassword(passwordCurrent, password, passwordConfirm) {
        try {
            this.setAuthHeader();
            const response = await API.patch('/users/updateMyPassword', {
                passwordCurrent,
                password,
                passwordConfirm
            });
            // Update token in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                this.setAuthHeader();
            }
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'updatePassword');
            throw error;
        }
    }
    /**
     * Get user watchlist
     */
    async getWatchlist() {
        try {
            this.setAuthHeader();
            const response = await API.get('/users/watchlist');
            return response.data.data.watchlist;
        }
        catch (error) {
            this.handleError(error, 'getWatchlist');
            return [];
        }
    }
    /**
     * Add asset to watchlist
     */
    async addToWatchlist(assetSymbol, assetType) {
        try {
            this.setAuthHeader();
            const response = await API.post('/users/watchlist', {
                assetSymbol,
                assetType
            });
            return response.data.data.watchlist;
        }
        catch (error) {
            this.handleError(error, 'addToWatchlist');
            throw error;
        }
    }
    /**
     * Remove asset from watchlist
     */
    async removeFromWatchlist(assetSymbol) {
        try {
            this.setAuthHeader();
            const response = await API.delete(`/users/watchlist/${assetSymbol}`);
            return response.data.data.watchlist;
        }
        catch (error) {
            this.handleError(error, 'removeFromWatchlist');
            throw error;
        }
    }
}
const apiServiceInstance = new ApiService();
export default apiServiceInstance;
