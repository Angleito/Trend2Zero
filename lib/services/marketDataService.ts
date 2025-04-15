import { SecureMarketDataService } from './secureMarketDataService';
import type { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

/**
 * Market Data Service
 *
 * This service provides a unified interface for accessing market data
 * from various sources. It uses the SecureMarketDataService to ensure
 * that API keys are not exposed to the client.
 */
import coinGeckoService from './coinGeckoService';
import coinMarketCapService from './coinMarketCapService';
import { AssetPrice } from '../types';

export class MarketDataService {
  private secureService: SecureMarketDataService;
  private useMockData: boolean;

  constructor() {
    console.log(`[MarketDataService] Initializing service`);
    this.secureService = new SecureMarketDataService();
    this.useMockData = process.env.USE_MOCK_DATA === 'true';
  }

  /**
   * Get asset price with weighted/round-robin logic and fallback
   * BTC/ETH: CoinGecko first, fallback to CoinMarketCap
   * Other cryptos: CoinMarketCap first, fallback to CoinGecko
   * Others: use secureService (stocks, metals, etc)
   */
  async getAssetPrice(symbol: string): Promise<AssetData | null> {
    if (this.useMockData) {
      return this.getMockAssets(undefined, 1).find(a => a.symbol === symbol) || null;
    }
    const upper = symbol.toUpperCase();
    const isCrypto = this.isCryptoCurrency(upper);
    let primary: 'coingecko' | 'cmc' | null = null;
    let secondary: 'coingecko' | 'cmc' | null = null;
    if (isCrypto) {
      if (upper === 'BTC' || upper === 'ETH') {
        primary = 'coingecko';
        secondary = 'cmc';
      } else {
        primary = 'cmc';
        secondary = 'coingecko';
      }
    }
    // Try crypto logic
    if (isCrypto) {
      let price: AssetPrice | null = null;
      let provider: string = '';
      // Try primary
      try {
        if (primary === 'coingecko') {
          price = await coinGeckoService.getAssetPrice(upper.toLowerCase());
          provider = 'CoinGecko';
        } else if (primary === 'cmc') {
          // Map symbol to CMC ID if needed, here we assume symbol is CMC ID or symbol
          price = await coinMarketCapService.getAssetPrice(upper);
          provider = 'CoinMarketCap';
        }
      } catch (e) {
        price = null;
      }
      if (price && price.price) {
        console.log(`[MarketDataService] Used ${provider} for ${symbol}`);
        return {
          symbol: upper,
          price: price.price,
          change: price.change ?? 0,
          changePercent: price.changePercent ?? 0,
          priceInBTC: price.priceInBTC ?? undefined,
          priceInUSD: price.price,
          lastUpdated: price.lastUpdated ?? new Date().toISOString(),
        };
      }
      // Try secondary
      try {
        if (secondary === 'coingecko') {
          price = await coinGeckoService.getAssetPrice(upper.toLowerCase());
          provider = 'CoinGecko';
        } else if (secondary === 'cmc') {
          price = await coinMarketCapService.getAssetPrice(upper);
          provider = 'CoinMarketCap';
        }
      } catch (e) {
        price = null;
      }
      if (price && price.price) {
        console.log(`[MarketDataService] Used fallback ${provider} for ${symbol}`);
        return {
          symbol: upper,
          price: price.price,
          change: price.change ?? 0,
          changePercent: price.changePercent ?? 0,
          priceInBTC: price.priceInBTC ?? undefined,
          priceInUSD: price.price,
          lastUpdated: price.lastUpdated ?? new Date().toISOString(),
        };
      }
      console.warn(`[MarketDataService] Both providers failed for ${symbol}`);
      return null;
    }
    // Not a crypto: use secureService.getAssetPriceInBTC (stocks, metals, etc)
    const nonCryptoPrice = await this.secureService.getAssetPriceInBTC(symbol);
    if (nonCryptoPrice && nonCryptoPrice.price) {
      return {
        symbol: nonCryptoPrice.symbol,
        price: nonCryptoPrice.price,
        change: nonCryptoPrice.change ?? 0,
        changePercent: nonCryptoPrice.changePercent ?? 0,
        priceInBTC: nonCryptoPrice.priceInBTC ?? undefined,
        priceInUSD: nonCryptoPrice.priceInUSD ?? nonCryptoPrice.price,
        lastUpdated: nonCryptoPrice.lastUpdated ?? new Date().toISOString(),
      };
    }
    return null;
  }

  /**
   * List available assets of a specific category
   */
  async listAvailableAssets(options: {
    page?: number;
    pageSize?: number;
    category?: AssetCategory;
    keywords?: string;
  } = {}): Promise<MarketAsset[]> {
    if (this.useMockData) {
      return this.getMockAssets(options.category, options.pageSize);
    }

    return this.secureService.listAvailableAssets(options);
  }

  /**
   * Get asset price in BTC
   */
  async getAssetPriceInBTC(assetSymbol: string): Promise<AssetData | null> {
    if (this.useMockData) {
      const mockPrices: Record<string, AssetData> = {
        'BTC': {
          symbol: 'BTC',
          price: 67890.12,
          change: 1234.56,
          changePercent: 2.34,
          priceInBTC: 1.0,
          priceInUSD: 67890.12,
          lastUpdated: new Date().toISOString()
        },
        'ETH': {
          symbol: 'ETH',
          price: 3456.78,
          change: 123.45,
          changePercent: 1.5,
          priceInBTC: 0.05,
          priceInUSD: 3456.78,
          lastUpdated: new Date().toISOString()
        },
        'AAPL': {
          symbol: 'AAPL',
          price: 180.50,
          change: 2.75,
          changePercent: 1.2,
          priceInBTC: 0.0025,
          priceInUSD: 180.50,
          lastUpdated: new Date().toISOString()
        }
      };

      return mockPrices[assetSymbol] || null;
    }

    return this.secureService.getAssetPriceInBTC(assetSymbol);
  }

  /**
   * Get historical price data for an asset
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    if (this.useMockData) {
      // Generate mock historical data
      const result: HistoricalDataPoint[] = [];
      const today = new Date();
      let basePrice = 100;
      
      if (symbol === 'BTC') basePrice = 60000;
      else if (symbol === 'ETH') basePrice = 3000;
      else if (symbol === 'AAPL') basePrice = 180;
      else if (symbol === 'GOOGL') basePrice = 125;
      else if (symbol === 'XAU') basePrice = 2000;

      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const randomFactor = 0.98 + Math.random() * 0.04;
        const price = basePrice * randomFactor;
        
        result.push({
          timestamp: date.getTime(),
          value: price,
          date,
          price,
          open: price * 0.99,
          high: price * 1.01,
          low: price * 0.98,
          close: price,
          volume: Math.floor(Math.random() * 1000000)
        });
        
        basePrice = price;
      }

      return result;
    }

    const data = await this.secureService.getHistoricalData(symbol, days);
    return data ?? [];
  }

  /**
   * Determine if an asset is a cryptocurrency based on its symbol
   */
  isCryptoCurrency(symbol: string): boolean {
    // Fallback: treat as crypto if symbol matches common crypto symbols
    const cryptoSymbols = ["BTC", "ETH", "USDT", "BNB", "XRP", "ADA", "DOGE", "SOL", "DOT", "MATIC"];
    return cryptoSymbols.includes(symbol.toUpperCase());
  }

  /**
   * Get mock assets when API calls are not available
   */
  getMockAssets(category?: AssetCategory, limit: number = 20): MarketAsset[] {
    const mockAssets: MarketAsset[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'Cryptocurrency',
        price: 65000,
        changePercent: 2.3,
        priceInUSD: 65000,
        priceInBTC: 1,
        change: 1500,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'Cryptocurrency',
        price: 3500,
        changePercent: 1.5,
        priceInUSD: 3500,
        priceInBTC: 0.05,
        change: 120,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc',
        type: 'Stocks',
        price: 175,
        changePercent: 1.2,
        priceInUSD: 175,
        priceInBTC: 0.003,
        change: 2.5,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc',
        type: 'Stocks',
        price: 140,
        changePercent: 1.0,
        priceInUSD: 140,
        priceInBTC: 0.002,
        change: 1.8,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'XAU',
        name: 'Gold',
        type: 'Precious Metal',
        price: 2000,
        changePercent: -0.2,
        priceInUSD: 2000,
        priceInBTC: 0.03,
        change: -5,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'XAG',
        name: 'Silver',
        type: 'Precious Metal',
        price: 25,
        changePercent: -0.1,
        priceInUSD: 25,
        priceInBTC: 0.0004,
        change: -0.2,
        lastUpdated: new Date().toISOString()
      }
    ];

    const filteredAssets = category 
      ? mockAssets.filter(asset => asset.type === category)
      : mockAssets;

    return filteredAssets.slice(0, limit);
  }
}

export default MarketDataService;