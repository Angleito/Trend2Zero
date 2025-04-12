class MockMarketDataService {
  constructor({ 
    coinMarketCapService, 
    metalPriceService, 
    alphaVantageService 
  }) {
    this.coinMarketCapService = coinMarketCapService;
    this.metalPriceService = metalPriceService;
    this.alphaVantageService = alphaVantageService;
  }

  async getAssetPrice(symbol, type) {
    switch(type) {
      case 'crypto':
        return this.coinMarketCapService.getPrice(symbol);
      case 'metal':
        return this.metalPriceService.getPrice(symbol);
      case 'stock':
        return this.alphaVantageService.getStockQuote(symbol);
      default:
        throw new Error('Unsupported asset type');
    }
  }

  async getHistoricalData(symbol, type, interval) {
    switch(type) {
      case 'crypto':
        return this.coinMarketCapService.getHistoricalData(symbol, interval);
      case 'metal':
        return this.metalPriceService.getHistoricalData(symbol, interval);
      case 'stock':
        return this.alphaVantageService.getHistoricalData(symbol, interval);
      default:
        throw new Error('Unsupported asset type');
    }
  }

  async searchAssets(query, type) {
    const results = [];
    
    if (!type || type === 'crypto') {
      const cryptoResults = await this.coinMarketCapService.searchAssets(query);
      results.push(...cryptoResults);
    }

    if (!type || type === 'stock') {
      const stockResults = await this.alphaVantageService.searchStocks(query);
      results.push(...stockResults);
    }

    if (!type || type === 'metal') {
      const metalResults = await this.metalPriceService.searchAssets(query);
      results.push(...metalResults);
    }

    return results;
  }

  async getMarketOverview() {
    const [cryptoOverview, stockOverview, metalOverview] = await Promise.all([
      this.coinMarketCapService.getMarketOverview(),
      this.alphaVantageService.getMarketOverview(),
      this.metalPriceService.getMarketOverview()
    ]);

    return {
      crypto: cryptoOverview,
      stocks: stockOverview,
      metals: metalOverview
    };
  }
}

module.exports = MockMarketDataService;