import { AssetData, HistoricalDataPoint, MarketAsset } from '../types';

/**
 * Mock Data Service
 *
 * This service provides mock data for when external API calls fail.
 * It's used as a fallback to ensure the application can still function
 * even when external services are unavailable.
 */
export class MockDataService {
  /**
   * Get mock cryptocurrency list
   */
  getMockCryptoList(page: number = 1, pageSize: number = 20): { data: MarketAsset[], pagination: { page: number, pageSize: number, totalItems: number, totalPages: number } } {
    const cryptos = [
      { 
        symbol: 'BTC', 
        name: 'Bitcoin', 
        type: 'Cryptocurrency' as const,
        price: 50000,
        change: 1000,
        changePercent: 2.0,
        priceInBTC: 1,
        priceInUSD: 50000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'ETH', 
        name: 'Ethereum', 
        type: 'Cryptocurrency' as const,
        price: 3000,
        change: 100,
        changePercent: 3.3,
        priceInBTC: 0.06,
        priceInUSD: 3000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'BNB', 
        name: 'Binance Coin', 
        type: 'Cryptocurrency' as const,
        price: 500,
        change: 15,
        changePercent: 3.0,
        priceInBTC: 0.01,
        priceInUSD: 500,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'SOL', 
        name: 'Solana', 
        type: 'Cryptocurrency' as const,
        price: 150,
        change: 5,
        changePercent: 3.3,
        priceInBTC: 0.003,
        priceInUSD: 150,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'XRP', 
        name: 'XRP', 
        type: 'Cryptocurrency' as const,
        price: 1.2,
        change: 0.04,
        changePercent: 3.3,
        priceInBTC: 0.000024,
        priceInUSD: 1.2,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'ADA', 
        name: 'Cardano', 
        type: 'Cryptocurrency' as const,
        price: 2.5,
        change: 0.08,
        changePercent: 3.2,
        priceInBTC: 0.00005,
        priceInUSD: 2.5,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'DOGE', 
        name: 'Dogecoin', 
        type: 'Cryptocurrency' as const,
        price: 0.15,
        change: 0.005,
        changePercent: 3.3,
        priceInBTC: 0.000003,
        priceInUSD: 0.15,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'DOT', 
        name: 'Polkadot', 
        type: 'Cryptocurrency' as const,
        price: 20,
        change: 0.6,
        changePercent: 3.0,
        priceInBTC: 0.0004,
        priceInUSD: 20,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'AVAX', 
        name: 'Avalanche', 
        type: 'Cryptocurrency' as const,
        price: 35,
        change: 1.05,
        changePercent: 3.0,
        priceInBTC: 0.0007,
        priceInUSD: 35,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'MATIC', 
        name: 'Polygon', 
        type: 'Cryptocurrency' as const,
        price: 1.5,
        change: 0.045,
        changePercent: 3.0,
        priceInBTC: 0.00003,
        priceInUSD: 1.5,
        lastUpdated: new Date().toISOString()
      }
    ];

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, cryptos.length);
    const paginatedResults = cryptos.slice(start, end);

    return {
      data: paginatedResults,
      pagination: {
        page,
        pageSize,
        totalItems: cryptos.length,
        totalPages: Math.ceil(cryptos.length / pageSize)
      }
    };
  }

  /**
   * Get mock stock list
   */
  getMockStockList(page: number = 1, pageSize: number = 20): { data: MarketAsset[], pagination: { page: number, pageSize: number, totalItems: number, totalPages: number } } {
    const stocks = [
      { 
        symbol: 'AAPL', 
        name: 'Apple Inc.', 
        type: 'Stocks' as const,
        price: 175,
        change: 2.5,
        changePercent: 1.43,
        priceInBTC: 0.0035,
        priceInUSD: 175,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'MSFT', 
        name: 'Microsoft Corporation', 
        type: 'Stocks' as const,
        price: 350,
        change: 5,
        changePercent: 1.43,
        priceInBTC: 0.007,
        priceInUSD: 350,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'GOOGL', 
        name: 'Alphabet Inc.', 
        type: 'Stocks' as const,
        price: 2800,
        change: 40,
        changePercent: 1.43,
        priceInBTC: 0.056,
        priceInUSD: 2800,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'AMZN', 
        name: 'Amazon.com Inc.', 
        type: 'Stocks' as const,
        price: 3500,
        change: 50,
        changePercent: 1.43,
        priceInBTC: 0.07,
        priceInUSD: 3500,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'META', 
        name: 'Meta Platforms Inc.', 
        type: 'Stocks' as const,
        price: 480,
        change: 6.86,
        changePercent: 1.43,
        priceInBTC: 0.0096,
        priceInUSD: 480,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'TSLA', 
        name: 'Tesla Inc.', 
        type: 'Stocks' as const,
        price: 250,
        change: 3.57,
        changePercent: 1.43,
        priceInBTC: 0.005,
        priceInUSD: 250,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'NVDA', 
        name: 'NVIDIA Corporation', 
        type: 'Stocks' as const,
        price: 880,
        change: 12.57,
        changePercent: 1.43,
        priceInBTC: 0.0176,
        priceInUSD: 880,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'JPM', 
        name: 'JPMorgan Chase & Co.', 
        type: 'Stocks' as const,
        price: 180,
        change: 2.57,
        changePercent: 1.43,
        priceInBTC: 0.0036,
        priceInUSD: 180,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'V', 
        name: 'Visa Inc.', 
        type: 'Stocks' as const,
        price: 270,
        change: 3.86,
        changePercent: 1.43,
        priceInBTC: 0.0054,
        priceInUSD: 270,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'JNJ', 
        name: 'Johnson & Johnson', 
        type: 'Stocks' as const,
        price: 155,
        change: 2.21,
        changePercent: 1.43,
        priceInBTC: 0.0031,
        priceInUSD: 155,
        lastUpdated: new Date().toISOString()
      }
    ];

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, stocks.length);
    const paginatedResults = stocks.slice(start, end);

    return {
      data: paginatedResults,
      pagination: {
        page,
        pageSize,
        totalItems: stocks.length,
        totalPages: Math.ceil(stocks.length / pageSize)
      }
    };
  }

  /**
   * Get mock commodities list
   */
  getMockCommoditiesList(page: number = 1, pageSize: number = 20): { data: MarketAsset[], pagination: { page: number, pageSize: number, totalItems: number, totalPages: number } } {
    const commodities = [
      { 
        symbol: 'XAU', 
        name: 'Gold', 
        type: 'Commodity' as const,
        price: 2000,
        change: 10,
        changePercent: 0.5,
        priceInBTC: 0.04,
        priceInUSD: 2000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'XAG', 
        name: 'Silver', 
        type: 'Commodity' as const,
        price: 25,
        change: 0.125,
        changePercent: 0.5,
        priceInBTC: 0.0005,
        priceInUSD: 25,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'XPT', 
        name: 'Platinum', 
        type: 'Commodity' as const,
        price: 950,
        change: 4.75,
        changePercent: 0.5,
        priceInBTC: 0.019,
        priceInUSD: 950,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'XPD', 
        name: 'Palladium', 
        type: 'Commodity' as const,
        price: 1200,
        change: 6,
        changePercent: 0.5,
        priceInBTC: 0.024,
        priceInUSD: 1200,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'BRENT', 
        name: 'Brent Crude Oil', 
        type: 'Commodity' as const,
        price: 85,
        change: 0.425,
        changePercent: 0.5,
        priceInBTC: 0.0017,
        priceInUSD: 85,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'WTI', 
        name: 'WTI Crude Oil', 
        type: 'Commodity' as const,
        price: 80,
        change: 0.4,
        changePercent: 0.5,
        priceInBTC: 0.0016,
        priceInUSD: 80,
        lastUpdated: new Date().toISOString()
      }
    ];

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, commodities.length);
    const paginatedResults = commodities.slice(start, end);

    return {
      data: paginatedResults,
      pagination: {
        page,
        pageSize,
        totalItems: commodities.length,
        totalPages: Math.ceil(commodities.length / pageSize)
      }
    };
  }

  /**
   * Get mock indices list
   */
  getMockIndicesList(page: number = 1, pageSize: number = 20): { data: MarketAsset[], pagination: { page: number, pageSize: number, totalItems: number, totalPages: number } } {
    const indices = [
      { 
        symbol: 'SPX', 
        name: 'S&P 500', 
        type: 'Indices' as const,
        price: 4200,
        change: 29.4,
        changePercent: 0.7,
        priceInBTC: 0.084,
        priceInUSD: 4200,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'DJI', 
        name: 'Dow Jones Industrial Average', 
        type: 'Indices' as const,
        price: 34000,
        change: 238,
        changePercent: 0.7,
        priceInBTC: 0.68,
        priceInUSD: 34000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'IXIC', 
        name: 'NASDAQ Composite', 
        type: 'Indices' as const,
        price: 14000,
        change: 98,
        changePercent: 0.7,
        priceInBTC: 0.28,
        priceInUSD: 14000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'RUT', 
        name: 'Russell 2000', 
        type: 'Indices' as const,
        price: 2000,
        change: 14,
        changePercent: 0.7,
        priceInBTC: 0.04,
        priceInUSD: 2000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'FTSE', 
        name: 'FTSE 100', 
        type: 'Indices' as const,
        price: 7500,
        change: 52.5,
        changePercent: 0.7,
        priceInBTC: 0.15,
        priceInUSD: 7500,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'DAX', 
        name: 'DAX', 
        type: 'Indices' as const,
        price: 16000,
        change: 112,
        changePercent: 0.7,
        priceInBTC: 0.32,
        priceInUSD: 16000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'CAC', 
        name: 'CAC 40', 
        type: 'Indices' as const,
        price: 7000,
        change: 49,
        changePercent: 0.7,
        priceInBTC: 0.14,
        priceInUSD: 7000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'N225', 
        name: 'Nikkei 225', 
        type: 'Indices' as const,
        price: 30000,
        change: 210,
        changePercent: 0.7,
        priceInBTC: 0.6,
        priceInUSD: 30000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'HSI', 
        name: 'Hang Seng', 
        type: 'Indices' as const,
        price: 25000,
        change: 175,
        changePercent: 0.7,
        priceInBTC: 0.5,
        priceInUSD: 25000,
        lastUpdated: new Date().toISOString()
      },
      { 
        symbol: 'SSEC', 
        name: 'Shanghai Composite', 
        type: 'Indices' as const,
        price: 3500,
        change: 24.5,
        changePercent: 0.7,
        priceInBTC: 0.07,
        priceInUSD: 3500,
        lastUpdated: new Date().toISOString()
      }
    ];

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, indices.length);
    const paginatedResults = indices.slice(start, end);

    return {
      data: paginatedResults,
      pagination: {
        page,
        pageSize,
        totalItems: indices.length,
        totalPages: Math.ceil(indices.length / pageSize)
      }
    };
  }

  /**
   * Get mock asset price data
   */
  getMockAssetPrice(symbol: string): AssetData {
    // Use predefined base prices for known assets
    const basePrices: { [key: string]: number } = {
      'BTC': 50000,
      'ETH': 3000,
      'BNB': 500,
      'SOL': 150,
      'XRP': 1.20,
      'ADA': 2.50,
      'DOGE': 0.15,
      'DOT': 20,
      'MATIC': 1.50,
      'AVAX': 35,
      // Stock prices
      'AAPL': 175,
      'MSFT': 350,
      'GOOGL': 2800,
      'AMZN': 3500,
      'TSLA': 250,
      'META': 480,
      'NVDA': 880,
      'JPM': 180,
      'V': 270,
      'JNJ': 155,
      // Commodities
      'XAU': 2000,  // Gold
      'XAG': 25,    // Silver
      'XPT': 950,   // Platinum
      'XPD': 1200,  // Palladium
      'CL': 85,     // Crude Oil
      'NG': 3.50    // Natural Gas
    };

    const basePrice = basePrices[symbol.toUpperCase()] || 100;
    // Reduce variation to max ±1% for more stability
    const changePercent = (Math.random() * 2) - 1;
    const change = basePrice * (changePercent / 100);
    const bitcoinPrice = basePrices['BTC'];
    const priceInBTC = basePrice / bitcoinPrice;

    return {
      symbol,
      name: symbol,
      type: 'Cryptocurrency' as const,
      price: basePrice,
      change,
      changePercent,
      priceInBTC,
      priceInUSD: basePrice,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get mock historical data
   */
  getMockHistoricalData(symbol: string, days: number = 30): HistoricalDataPoint[] {
    const result: HistoricalDataPoint[] = [];
    const today = new Date();
    const basePrices: { [key: string]: number } = {
      'BTC': 50000,
      'ETH': 3000,
      'AAPL': 175,
      'MSFT': 350,
      'XAU': 2000
    };

    let baseValue = basePrices[symbol.toUpperCase()] || 100;

    // Reduce daily variation to max ±0.5% for more stability
    const maxDailyVariation = 0.005;

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dailyVariation = baseValue * maxDailyVariation * (Math.random() * 2 - 1);
      const price = baseValue + dailyVariation;

      // Generate realistic OHLC data with tight spreads
      const spread = price * 0.001; // 0.1% spread
      const open = price * (1 - spread/2 + Math.random() * spread);
      const high = Math.max(open, price) * (1 + Math.random() * (spread/2));
      const low = Math.min(open, price) * (1 - Math.random() * (spread/2));
      const close = price;

      // Generate realistic volume based on asset type
      const baseVolume = symbol.toUpperCase() === 'BTC' ? 1000000000 : 
                        symbol.toUpperCase() === 'ETH' ? 500000000 :
                        symbol.length === 4 ? 50000 : // Forex pairs
                        100000; // Stocks and others
      const volume = Math.round(baseVolume * (0.8 + Math.random() * 0.4));

      result.push({
        timestamp: date.getTime(),
        value: close,
        date: new Date(date),
        price: parseFloat(price.toFixed(2)),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      });

      // Update base value with smaller drift for next day
      baseValue = close * (1 + (Math.random() * 0.002 - 0.001)); // ±0.1% drift
    }

    return result;
  }
}

export default MockDataService;
