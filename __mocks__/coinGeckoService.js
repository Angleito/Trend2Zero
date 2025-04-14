import AppError from './appError';

class MockCoinGeckoService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.coingecko.com/api/v3';
    this.headers = { 'Accept': 'application/json' };
    this.symbolToIdMappings = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana'
    };
  }

  async getAssetPrice(id) {
    const prices = {
      'bitcoin': 48000,
      'ethereum': 2800,
      'solana': 120
    };

    if (!prices[id]) {
      throw new AppError(`Cryptocurrency not found: ${id}`, 404);
    }

    return {
      id,
      symbol: this.getSymbolFromId(id),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      type: 'cryptocurrency',
      price: prices[id],
      change: 2.1,
      changePercent: 2.1,
      priceInBTC: 0,
      priceInUSD: prices[id],
      lastUpdated: new Date().toISOString()
    };
  }

  async getHistoricalData(symbol, days = 30) {
    const historicalData = {
      'BTC': Array.from({length: days+1}, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 86400000),
        price: 48000 + (i * 100) + (Math.random() * 1000) - 500,
        open: 47800 + (i * 100),
        high: 48500 + (i * 100),
        low: 47500 + (i * 100),
        close: 48000 + (i * 100),
        volume: 30000000000 + (Math.random() * 5000000000)
      })),
      'ETH': Array.from({length: days+1}, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 86400000),
        price: 2800 + (i * 10) + (Math.random() * 100) - 50,
        open: 2780 + (i * 10),
        high: 2850 + (i * 10),
        low: 2750 + (i * 10),
        close: 2800 + (i * 10),
        volume: 10000000000 + (Math.random() * 2000000000)
      }))
    };

    if (!historicalData[symbol]) {
      throw new AppError(`Historical data not found for symbol: ${symbol}`, 404);
    }

    return historicalData[symbol];
  }

  async getOHLCData(symbol, days) {
    const validDays = [1, 7, 14, 30, 90, 180, 365];
    const closestDays = validDays.reduce((prev, curr) => 
      Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
    );

    console.warn(`Adjusted days from ${days} to ${closestDays} for OHLC data`);

    return [
      [1638360000000, 48000, 48500, 47500, 48000],
      [1638446400000, 48100, 48600, 47600, 48100]
    ];
  }

  async getHistoricalDataRange(symbol, from, to) {
    return [
      {
        timestamp: from,
        date: new Date(from),
        price: 48000,
        open: 48000,
        high: 48500,
        low: 47500,
        close: 48000,
        volume: 30000000000
      },
      {
        timestamp: to,
        date: new Date(to),
        price: 48100,
        open: 48100,
        high: 48600,
        low: 47600,
        close: 48100,
        volume: 30000000000
      }
    ];
  }

  async searchCrypto(query) {
    const cryptos = [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
      { id: 'solana', symbol: 'SOL', name: 'Solana', type: 'crypto' },
      { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' }
    ];

    const results = cryptos.filter(crypto => 
      crypto.symbol.toLowerCase().includes(query.toLowerCase()) || 
      crypto.name.toLowerCase().includes(query.toLowerCase())
    );

    return results;
  }

  async getMarketOverview() {
    try {
      return {
        totalMarketCap: 1600000000000,
        total24hVolume: 60000000000,
        btcDominance: 43.5,
        ethDominance: 19.8
      };
    } catch (error) {
      throw new AppError('Failed to fetch market overview', 500);
    }
  }

  async getTopCryptocurrencies(limit = 10) {
    const topCryptos = [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 48000, marketCap: 900000000000, change24h: 2.1, volume24h: 30000000000, rank: 1 },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 2800, marketCap: 300000000000, change24h: 1.5, volume24h: 10000000000, rank: 2 },
      { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', price: 380, marketCap: 60000000000, change24h: 0.5, volume24h: 2000000000, rank: 3 },
      { id: 'solana', symbol: 'SOL', name: 'Solana', price: 120, marketCap: 50000000000, change24h: 3.2, volume24h: 3000000000, rank: 4 }
    ];
    
    return topCryptos.slice(0, limit);
  }

  getIdFromSymbol(symbol) {
    const upperSymbol = symbol.toUpperCase();
    return this.symbolToIdMappings[upperSymbol] || symbol.toLowerCase();
  }

  getSymbolFromId(id) {
    const reverseMapping = Object.fromEntries(
      Object.entries(this.symbolToIdMappings).map(([k, v]) => [v, k])
    );
    return reverseMapping[id] || id.toUpperCase();
  }
}

export default MockCoinGeckoService;