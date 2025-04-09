export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.MONGODB_URI || 'mongodb://localhost:27017/trend2zero',
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  RATE_LIMIT: {
    WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  SECURITY: {
    CSP: {
      DEFAULT_SRC: "'self'",
      SCRIPT_SRC: "'self' 'unsafe-inline'",
      STYLE_SRC: "'self' 'unsafe-inline'",
      IMG_SRC: "'self' data:",
      CONNECT_SRC: "'self' https://www.alphavantage.co"
    }
  },

  FEATURE_FLAGS: {
    CRYPTO_TRADING: process.env.ENABLE_CRYPTO_TRADING === 'true',
    STOCK_TRADING: process.env.ENABLE_STOCK_TRADING === 'true',
    PRICE_ALERTS: process.env.ENABLE_PRICE_ALERTS === 'true'
  },

  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    ERROR_REPORTING: process.env.ERROR_REPORTING_ENABLED === 'true'
  }
};
