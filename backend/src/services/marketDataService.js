const axios = require('axios');
const AppError = require('../utils/appError');

/**
 * Fetch cryptocurrency data from CoinGecko
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {Promise<Object>} - Cryptocurrency data
 */
exports.fetchCryptoData = async (symbol) => {
  try {
    // Convert symbol to CoinGecko ID format
    const coinId = getCoinGeckoId(symbol);
    
    // Fetch coin data including price in BTC and USD
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false
      },
      headers: {
        'x-cg-pro-api-key': process.env.COIN_GECKO_API_KEY || ''
      }
    });
    
    const data = response.data;
    
    // Extract relevant data
    return {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      priceInBTC: data.market_data.current_price.btc,
      priceInUSD: data.market_data.current_price.usd,
      change24h: data.market_data.price_change_percentage_24h,
      marketCap: data.market_data.market_cap.usd,
      volume24h: data.market_data.total_volume.usd,
      image: data.image?.small,
      returns: {
        ytd: data.market_data.price_change_percentage_ytd || 0,
        oneYear: data.market_data.price_change_percentage_1y || 0,
        threeYear: 0, // Not provided by CoinGecko API
        fiveYear: 0, // Not provided by CoinGecko API
        max: 0 // Not provided by CoinGecko API
      }
    };
  } catch (error) {
    console.error(`Error fetching crypto data for ${symbol}:`, error.message);
    
    // If API rate limit is exceeded, return mock data
    if (error.response && error.response.status === 429) {
      console.warn('CoinGecko API rate limit exceeded, using mock data');
      return getMockCryptoData(symbol);
    }
    
    throw new AppError(`Failed to fetch data for ${symbol}`, 404);
  }
};

/**
 * Fetch stock data from Alpha Vantage
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} - Stock data
 */
exports.fetchStockData = async (symbol) => {
  try {
    // Fetch global quote for the asset
    const quoteResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      }
    });
    
    if (!quoteResponse.data['Global Quote'] || !quoteResponse.data['Global Quote']['05. price']) {
      throw new Error('Invalid quote response format from Alpha Vantage API');
    }
    
    const assetPriceUSD = parseFloat(quoteResponse.data['Global Quote']['05. price']);
    
    // Fetch current Bitcoin price from CoinGecko (free API)
    const btcResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      },
      headers: {
        'x-cg-pro-api-key': process.env.COIN_GECKO_API_KEY || ''
      }
    });
    
    const btcPriceUSD = btcResponse.data.bitcoin.usd;
    
    // Fetch asset overview for additional information
    const overviewResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'OVERVIEW',
        symbol: symbol,
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      }
    });
    
    // Calculate price in BTC
    const priceInBTC = assetPriceUSD / btcPriceUSD;
    
    // Extract relevant data
    return {
      name: overviewResponse.data.Name || symbol,
      symbol: symbol.toUpperCase(),
      priceInBTC: priceInBTC,
      priceInUSD: assetPriceUSD,
      change24h: parseFloat(quoteResponse.data['Global Quote']['10. change percent'].replace('%', '')),
      returns: {
        ytd: 0, // Not provided by Alpha Vantage API
        oneYear: 0, // Not provided by Alpha Vantage API
        threeYear: 0, // Not provided by Alpha Vantage API
        fiveYear: 0, // Not provided by Alpha Vantage API
        max: 0 // Not provided by Alpha Vantage API
      }
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error.message);
    
    // If API rate limit is exceeded, return mock data
    if (error.response && error.response.status === 429) {
      console.warn('Alpha Vantage API rate limit exceeded, using mock data');
      return getMockStockData(symbol);
    }
    
    throw new AppError(`Failed to fetch data for ${symbol}`, 404);
  }
};

/**
 * Fetch historical cryptocurrency data from CoinGecko
 * @param {string} symbol - Cryptocurrency symbol
 * @param {number} days - Number of days of historical data to fetch
 * @returns {Promise<Array>} - Historical data points
 */
exports.fetchCryptoHistoricalData = async (symbol, days = 30) => {
  try {
    // Convert symbol to CoinGecko ID format
    const coinId = getCoinGeckoId(symbol);
    
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
        interval: days > 90 ? 'daily' : undefined
      },
      headers: {
        'x-cg-pro-api-key': process.env.COIN_GECKO_API_KEY || ''
      }
    });
    
    // Transform the response to our HistoricalDataPoint format
    return response.data.prices.map((item) => ({
      date: new Date(item[0]),
      price: item[1],
      volume: response.data.total_volumes.find((v) => v[0] === item[0])?.[1]
    }));
  } catch (error) {
    console.error(`Error fetching crypto historical data for ${symbol}:`, error.message);
    
    // If API rate limit is exceeded, return mock data
    if (error.response && error.response.status === 429) {
      console.warn('CoinGecko API rate limit exceeded, using mock data');
      return getMockHistoricalData(symbol, days);
    }
    
    throw new AppError(`Failed to fetch historical data for ${symbol}`, 404);
  }
};

/**
 * Fetch historical stock data from Alpha Vantage
 * @param {string} symbol - Stock symbol
 * @param {number} days - Number of days of historical data to fetch
 * @returns {Promise<Array>} - Historical data points
 */
exports.fetchStockHistoricalData = async (symbol, days = 30) => {
  try {
    const outputSize = days <= 100 ? 'compact' : 'full';
    
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        outputsize: outputSize,
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      }
    });
    
    if (!response.data['Time Series (Daily)']) {
      throw new Error('Invalid historical data response from Alpha Vantage API');
    }
    
    // Transform the response to our HistoricalDataPoint format
    const timeSeriesData = response.data['Time Series (Daily)'];
    const historicalData = Object.entries(timeSeriesData)
      .map(([date, values]) => ({
        date: new Date(date),
        price: parseFloat(values['4. close']),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        volume: parseFloat(values['5. volume'])
      }))
      .sort((a, b) => a.date - b.date);
    
    // Limit to requested number of days
    return historicalData.slice(-days);
  } catch (error) {
    console.error(`Error fetching stock historical data for ${symbol}:`, error.message);
    
    // If API rate limit is exceeded, return mock data
    if (error.response && error.response.status === 429) {
      console.warn('Alpha Vantage API rate limit exceeded, using mock data');
      return getMockHistoricalData(symbol, days);
    }
    
    throw new AppError(`Failed to fetch historical data for ${symbol}`, 404);
  }
};

/**
 * Convert a symbol to CoinGecko ID format
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {string} - CoinGecko ID
 */
function getCoinGeckoId(symbol) {
  // Remove any :IND or other suffixes
  const cleanSymbol = symbol.split(':')[0].toLowerCase();
  
  // Map common symbols to their CoinGecko IDs
  const symbolMap = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'bnb': 'binancecoin',
    'sol': 'solana',
    'xrp': 'ripple',
    'ada': 'cardano',
    'doge': 'dogecoin',
    'dot': 'polkadot',
    'ltc': 'litecoin'
  };
  
  return symbolMap[cleanSymbol] || cleanSymbol;
}

/**
 * Generate mock cryptocurrency data
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {Object} - Mock cryptocurrency data
 */
function getMockCryptoData(symbol) {
  const mockData = {
    'BTC': {
      name: 'Bitcoin',
      symbol: 'BTC',
      priceInBTC: 1.0,
      priceInUSD: 29250.0,
      change24h: 2.5,
      marketCap: 570000000000,
      volume24h: 25000000000,
      returns: {
        ytd: 20.0,
        oneYear: 50.0,
        threeYear: 150.0,
        fiveYear: 500.0,
        max: 1200.0
      }
    },
    'ETH': {
      name: 'Ethereum',
      symbol: 'ETH',
      priceInBTC: 0.0615,
      priceInUSD: 1800.0,
      change24h: 1.8,
      marketCap: 216000000000,
      volume24h: 12000000000,
      returns: {
        ytd: 15.5,
        oneYear: 35.2,
        threeYear: 120.8,
        fiveYear: 380.5,
        max: 850.3
      }
    }
  };
  
  // Default to Bitcoin if the requested symbol is not in our mock data
  return mockData[symbol.toUpperCase()] || mockData['BTC'];
}

/**
 * Generate mock stock data
 * @param {string} symbol - Stock symbol
 * @returns {Object} - Mock stock data
 */
function getMockStockData(symbol) {
  const mockData = {
    'AAPL': {
      name: 'Apple Inc',
      symbol: 'AAPL',
      priceInBTC: 0.0058,
      priceInUSD: 169.75,
      change24h: 0.75,
      returns: {
        ytd: 15.5,
        oneYear: 25.3,
        threeYear: 45.2,
        fiveYear: 80.1,
        max: 150.7
      }
    },
    'MSFT': {
      name: 'Microsoft Corporation',
      symbol: 'MSFT',
      priceInBTC: 0.0126,
      priceInUSD: 369.14,
      change24h: 1.2,
      returns: {
        ytd: 22.1,
        oneYear: 38.5,
        threeYear: 65.8,
        fiveYear: 110.2,
        max: 210.5
      }
    }
  };
  
  // Default to Apple if the requested symbol is not in our mock data
  return mockData[symbol.toUpperCase()] || mockData['AAPL'];
}

/**
 * Generate mock historical data
 * @param {string} symbol - Asset symbol
 * @param {number} days - Number of days of historical data to generate
 * @returns {Array} - Mock historical data points
 */
function getMockHistoricalData(symbol, days = 30) {
  const result = [];
  const today = new Date();
  
  // Base values for different symbols
  let baseValue = 0;
  switch (symbol.toUpperCase()) {
    case 'BTC':
      baseValue = 28000;
      break;
    case 'ETH':
      baseValue = 1800;
      break;
    case 'AAPL':
      baseValue = 170;
      break;
    case 'MSFT':
      baseValue = 370;
      break;
    default:
      baseValue = 100;
  }
  
  // Generate data points for each day
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add some random variation
    const randomFactor = 0.02; // 2% max variation
    const dailyVariation = baseValue * randomFactor * (Math.random() * 2 - 1);
    const open = baseValue + dailyVariation;
    const high = open * (1 + Math.random() * 0.01);
    const low = open * (1 - Math.random() * 0.01);
    const close = (high + low) / 2;
    const volume = baseValue * 1000 * (0.8 + Math.random() * 0.4);
    
    // Update base value for next day
    baseValue = close;
    
    result.push({
      date,
      price: parseFloat(close.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume: parseFloat(volume.toFixed(2))
    });
  }
  
  return result;
}
