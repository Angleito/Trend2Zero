import axios from 'axios';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

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
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }
  
  /**
   * Set authorization header if token exists
   */
  private setAuthHeader() {
    const token = this.getToken();
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete API.defaults.headers.common['Authorization'];
    }
  }
  
  /**
   * Handle API errors
   */
  private handleError(error: any, context: string): void {
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
  async listAvailableAssets(options: {
    category?: AssetCategory;
    page?: number;
    pageSize?: number;
    keywords?: string;
  } = {}): Promise<MarketAsset[]> {
    try {
      this.setAuthHeader();
      
      const { category, page = 1, pageSize = 20, keywords } = options;
      
      // Build query parameters
      const params: any = { page, limit: pageSize };
      
      if (category) {
        params.type = category;
      }
      
      if (keywords) {
        params.search = keywords;
      }
      
      const response = await API.get('/market-data/assets', { params });
      
      return response.data.data.assets;
    } catch (error) {
      this.handleError(error, 'listAvailableAssets');
      return [];
    }
  }
  
  /**
   * Get asset price in BTC
   */
  async getAssetPriceInBTC(assetSymbol: string): Promise<AssetData | null> {
    try {
      this.setAuthHeader();
      
      const response = await API.get(`/market-data/price/${assetSymbol}`);
      
      return response.data.data;
    } catch (error) {
      this.handleError(error, `getAssetPriceInBTC for ${assetSymbol}`);
      return null;
    }
  }
  
  /**
   * Get historical price data
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    try {
      this.setAuthHeader();
      
      const response = await API.get(`/market-data/historical/${symbol}`, {
        params: { days }
      });
      
      return response.data.data.dataPoints;
    } catch (error) {
      this.handleError(error, `getHistoricalData for ${symbol}`);
      return [];
    }
  }
  
  /**
   * Search assets
   */
  async searchAssets(query: string): Promise<MarketAsset[]> {
    try {
      this.setAuthHeader();
      
      const response = await API.get('/market-data/assets/search', {
        params: { query }
      });
      
      return response.data.data.assets;
    } catch (error) {
      this.handleError(error, `searchAssets for ${query}`);
      return [];
    }
  }
  
  /**
   * Get popular assets
   */
  async getPopularAssets(limit: number = 10): Promise<MarketAsset[]> {
    try {
      this.setAuthHeader();
      
      const response = await API.get('/market-data/assets/popular', {
        params: { limit }
      });
      
      return response.data.data.assets;
    } catch (error) {
      this.handleError(error, 'getPopularAssets');
      return [];
    }
  }
  
  /**
   * Get assets by type
   */
  async getAssetsByType(type: AssetCategory, limit: number = 20): Promise<MarketAsset[]> {
    try {
      this.setAuthHeader();
      
      const response = await API.get(`/market-data/assets/type/${type}`, {
        params: { limit }
      });
      
      return response.data.data.assets;
    } catch (error) {
      this.handleError(error, `getAssetsByType for ${type}`);
      return [];
    }
  }
  
  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string, passwordConfirm: string): Promise<any> {
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
    } catch (error) {
      this.handleError(error, 'register');
      throw error;
    }
  }
  
  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<any> {
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
    } catch (error) {
      this.handleError(error, 'login');
      throw error;
    }
  }
  
  /**
   * Logout a user
   */
  async logout(): Promise<void> {
    try {
      this.setAuthHeader();
      await API.get('/users/logout');
      
      // Remove token from localStorage
      localStorage.removeItem('token');
      delete API.defaults.headers.common['Authorization'];
    } catch (error) {
      this.handleError(error, 'logout');
    }
  }
  
  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    try {
      this.setAuthHeader();
      const response = await API.get('/users/me');
      
      return response.data.data.user;
    } catch (error) {
      this.handleError(error, 'getCurrentUser');
      return null;
    }
  }
  
  /**
   * Update user profile
   */
  async updateProfile(data: { name?: string; email?: string }): Promise<any> {
    try {
      this.setAuthHeader();
      const response = await API.patch('/users/updateMe', data);
      
      return response.data.data.user;
    } catch (error) {
      this.handleError(error, 'updateProfile');
      throw error;
    }
  }
  
  /**
   * Update user password
   */
  async updatePassword(passwordCurrent: string, password: string, passwordConfirm: string): Promise<any> {
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
    } catch (error) {
      this.handleError(error, 'updatePassword');
      throw error;
    }
  }
  
  /**
   * Get user watchlist
   */
  async getWatchlist(): Promise<any[]> {
    try {
      this.setAuthHeader();
      const response = await API.get('/users/watchlist');
      
      return response.data.data.watchlist;
    } catch (error) {
      this.handleError(error, 'getWatchlist');
      return [];
    }
  }
  
  /**
   * Add asset to watchlist
   */
  async addToWatchlist(assetSymbol: string, assetType: AssetCategory): Promise<any[]> {
    try {
      this.setAuthHeader();
      const response = await API.post('/users/watchlist', {
        assetSymbol,
        assetType
      });
      
      return response.data.data.watchlist;
    } catch (error) {
      this.handleError(error, 'addToWatchlist');
      throw error;
    }
  }
  
  /**
   * Remove asset from watchlist
   */
  async removeFromWatchlist(assetSymbol: string): Promise<any[]> {
    try {
      this.setAuthHeader();
      const response = await API.delete(`/users/watchlist/${assetSymbol}`);
      
      return response.data.data.watchlist;
    } catch (error) {
      this.handleError(error, 'removeFromWatchlist');
      throw error;
    }
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;
