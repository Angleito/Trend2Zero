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
  getMockCryptoList(page: number = 1, pageSize: number = 20): any {
    const cryptos = [
      { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency', description: 'bitcoin' },
      { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency', description: 'ethereum' },
      { symbol: 'BNB', name: 'Binance Coin', type: 'Cryptocurrency', description: 'binance-coin' },
      { symbol: 'SOL', name: 'Solana', type: 'Cryptocurrency', description: 'solana' },
      { symbol: 'XRP', name: 'XRP', type: 'Cryptocurrency', description: 'xrp' },
      { symbol: 'ADA', name: 'Cardano', type: 'Cryptocurrency', description: 'cardano' },
      { symbol: 'DOGE', name: 'Dogecoin', type: 'Cryptocurrency', description: 'dogecoin' },
      { symbol: 'DOT', name: 'Polkadot', type: 'Cryptocurrency', description: 'polkadot' },
      { symbol: 'AVAX', name: 'Avalanche', type: 'Cryptocurrency', description: 'avalanche' },
      { symbol: 'MATIC', name: 'Polygon', type: 'Cryptocurrency', description: 'polygon' }
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
  getMockStockList(page: number = 1, pageSize: number = 20): any {
    const stocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stocks', description: 'United States' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stocks', description: 'United States' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Stocks', description: 'United States' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Stocks', description: 'United States' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Stocks', description: 'United States' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stocks', description: 'United States' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stocks', description: 'United States' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Stocks', description: 'United States' },
      { symbol: 'V', name: 'Visa Inc.', type: 'Stocks', description: 'United States' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stocks', description: 'United States' }
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
  getMockCommoditiesList(page: number = 1, pageSize: number = 20): any {
    const commodities = [
      { symbol: 'XAU', name: 'Gold', type: 'Commodities', description: 'Precious metal' },
      { symbol: 'XAG', name: 'Silver', type: 'Commodities', description: 'Precious metal' },
      { symbol: 'XPT', name: 'Platinum', type: 'Commodities', description: 'Precious metal' },
      { symbol: 'XPD', name: 'Palladium', type: 'Commodities', description: 'Precious metal' },
      { symbol: 'BRENT', name: 'Brent Crude Oil', type: 'Commodities', description: 'Energy' },
      { symbol: 'WTI', name: 'WTI Crude Oil', type: 'Commodities', description: 'Energy' }
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
  getMockIndicesList(page: number = 1, pageSize: number = 20): any {
    const indices = [
      { symbol: 'SPX', name: 'S&P 500', type: 'Indices', description: 'US large-cap stocks' },
      { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'Indices', description: 'US blue-chip stocks' },
      { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'Indices', description: 'US technology stocks' },
      { symbol: 'RUT', name: 'Russell 2000', type: 'Indices', description: 'US small-cap stocks' },
      { symbol: 'FTSE', name: 'FTSE 100', type: 'Indices', description: 'UK large-cap stocks' },
      { symbol: 'DAX', name: 'DAX', type: 'Indices', description: 'German stocks' },
      { symbol: 'CAC', name: 'CAC 40', type: 'Indices', description: 'French stocks' },
      { symbol: 'N225', name: 'Nikkei 225', type: 'Indices', description: 'Japanese stocks' },
      { symbol: 'HSI', name: 'Hang Seng', type: 'Indices', description: 'Hong Kong stocks' },
      { symbol: 'SSEC', name: 'Shanghai Composite', type: 'Indices', description: 'Chinese stocks' }
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
    // Generate a random price between 100 and 10000
    const price = Math.random() * 9900 + 100;
    // Generate a random change between -5% and 5%
    const changePercent = (Math.random() * 10) - 5;
    const change = price * (changePercent / 100);
    // Mock Bitcoin price at 50000
    const bitcoinPrice = 50000;
    const priceInBTC = price / bitcoinPrice;

    return {
      symbol,
      price,
      change,
      changePercent,
      priceInBTC,
      priceInUSD: price,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get mock historical data
   */
  getMockHistoricalData(symbol: string, days: number = 30): HistoricalDataPoint[] {
    const result: HistoricalDataPoint[] = [];
    const basePrice = Math.random() * 9900 + 100;
    
    // Generate data points for the specified number of days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Add some randomness to the price
      const volatility = 0.02; // 2% volatility
      const randomChange = (Math.random() * 2 - 1) * volatility;
      const price = basePrice * (1 + randomChange * i);
      
      // Generate open, high, low prices around the close price
      const open = price * (1 + (Math.random() * 0.02 - 0.01));
      const high = Math.max(open, price) * (1 + Math.random() * 0.01);
      const low = Math.min(open, price) * (1 - Math.random() * 0.01);
      
      // Generate random volume
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      result.push({
        date,
        price,
        open,
        high,
        low,
        close: price,
        volume
      });
    }
    
    return result;
  }
}

export default MockDataService;
