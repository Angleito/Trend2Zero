/**
 * Server-side configuration
 * 
 * This file contains configuration that should only be accessible on the server.
 * Never import this file in client-side code.
 */

// API Keys
export const API_KEYS = {
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_API_KEY || '',
  COIN_GECKO: process.env.COIN_GECKO_API_KEY || ''
};

// Security settings
export const SECURITY = {
  // CSRF protection
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['localhost:3000', 'trend2zero.com'],
  
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20')
  },
  
  // Content Security Policy
  CSP: {
    DEFAULT_SRC: process.env.CSP_DEFAULT_SRC || "'self'",
    SCRIPT_SRC: process.env.CSP_SCRIPT_SRC || "'self' 'unsafe-inline' 'unsafe-eval'",
    STYLE_SRC: process.env.CSP_STYLE_SRC || "'self' 'unsafe-inline'",
    IMG_SRC: process.env.CSP_IMG_SRC || "'self' data: https://assets.coingecko.com",
    CONNECT_SRC: process.env.CSP_CONNECT_SRC || "'self' https://api.coingecko.com https://www.alphavantage.co"
  }
};

// Feature flags
export const FEATURES = {
  USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true',
  ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false',
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false'
};

// Cache settings
export const CACHE = {
  TTL: parseInt(process.env.CACHE_TTL || '300000'), // 5 minutes
  MAX_ITEMS: parseInt(process.env.CACHE_MAX_ITEMS || '500')
};
