import AppError from './appError';

class MockCoinGeckoService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getCryptoPrice(symbol) {
    const prices = {
      'BTC': 48000,
      'ETH': 2800,
      'SOL': 120
    };

    if (!prices[symbol]) {
      throw new AppError(`Cryptocurrency not found: ${symbol}`, 404);
    }

    return {
      symbol,
      price: prices[symbol],
      lastUpdated: new Date().toISOString(),
      volume24h: symbol === 'BTC' ? 30000000000 : 10000000000,
      marketCap: symbol === 'BTC' ? 900000000000 : 300000000000,
      change24h: 2.1
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
}

export default MockCoinGeckoService;