import AppError from './appError';

class MockCoinMarketCapService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getCryptoPrice(symbol) {
    const prices = {
      'BTC': 50000,
      'ETH': 3000,
      'DOGE': 0.5
    };

    if (!prices[symbol]) {
      throw new AppError(`Cryptocurrency not found: ${symbol}`, 404);
    }

    return {
      symbol,
      price: prices[symbol],
      lastUpdated: new Date().toISOString()
    };
  }

  async getHistoricalData(symbol, interval = '1d') {
    const historicalData = {
      'BTC': [
        { date: '2023-01-01', price: 45000 },
        { date: '2023-01-02', price: 46000 }
      ],
      'ETH': [
        { date: '2023-01-01', price: 2800 },
        { date: '2023-01-02', price: 2900 }
      ]
    };

    if (!historicalData[symbol]) {
      throw new AppError(`Historical data not found for symbol: ${symbol}`, 404);
    }

    return historicalData[symbol];
  }

  async searchCrypto(query) {
    const cryptos = [
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
      { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
      { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' }
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
        topCryptos: [
          { symbol: 'BTC', name: 'Bitcoin', price: 50000, change24h: 2.5 },
          { symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: 1.8 }
        ],
        globalMarketCap: 1500000000000,
        totalVolume: 50000000000
      };
    } catch (error) {
      throw new AppError('Failed to fetch market overview', 500);
    }
  }
}

export default MockCoinMarketCapService;