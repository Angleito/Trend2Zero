class MockMetalPriceService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getMetalBySymbol(symbol) {
    const prices = {
      'GOLD': { price: 1900, currency: 'USD' },
      'SILVER': { price: 25, currency: 'USD' }
    };

    return prices[symbol] || null;
  }

  async getHistoricalData(symbol, interval = '1d') {
    const historicalData = {
      'GOLD': [
        { date: '2023-01-01', price: 1850 },
        { date: '2023-01-02', price: 1900 }
      ],
      'SILVER': [
        { date: '2023-01-01', price: 23 },
        { date: '2023-01-02', price: 25 }
      ]
    };

    return historicalData[symbol] || [];
  }

  async getSupportedMetals() {
    return [
      { symbol: 'GOLD', name: 'Gold', type: 'metal' },
      { symbol: 'SILVER', name: 'Silver', type: 'metal' }
    ];
  }
}

module.exports = MockMetalPriceService;