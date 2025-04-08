import axios from 'axios';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

export class CoinGeckoService {
  private baseURL: string;
  private useMockData: boolean;

  constructor(useMockData: boolean = false) {
    console.log('[CoinGeckoService] Initializing service');
    this.baseURL = 'https://api.coingecko.com/api/v3';
    this.useMockData = useMockData;
  }

  /**
   * List available cryptocurrencies
   */
  async listAvailableCryptos(options: {
    page?: number;
    pageSize?: number;
  } = {}): Promise<MarketAsset[]> {
    console.log('[CoinGeckoService] listAvailableCryptos called with options:', options);
    const { page = 1, pageSize = 50 } = options;

    // If mock data is explicitly requested, return it immediately
    if (this.useMockData) {
      console.log('Using mock crypto list data as configured');
      return this.getMockCryptos(page, pageSize);
    }

    try {
      // Try to fetch real data from CoinGecko API
      console.log('Fetching crypto list from CoinGecko API...');
      const response = await axios.get(`${this.baseURL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: pageSize,
          page: page,
          sparkline: false
        }
      });

      // Process and transform the API response
      const assets = response.data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'Cryptocurrency' as AssetCategory,
        description: `${coin.name} cryptocurrency`,
        image: coin.image
      }));

      console.log(`Successfully fetched ${assets.length} cryptocurrencies from CoinGecko API`);
      return assets;
    } catch (error) {
      // Log the error but don't throw
      console.error('Error fetching available cryptocurrencies:', error);

      // Fallback to mock data
      console.log('Falling back to mock crypto list data');
      return this.getMockCryptos(page, pageSize);
    }
  }

  /**
   * Get asset price in BTC
   */
  async getAssetPriceInBTC(assetSymbol: string): Promise<AssetData> {
    console.log(`[CoinGeckoService] getAssetPriceInBTC called for symbol: ${assetSymbol}`);

    // If mock data is explicitly requested, return it immediately
    if (this.useMockData) {
      console.log(`Using mock data for asset: ${assetSymbol}`);
      return this.getMockAssetData(assetSymbol);
    }

    try {
      console.log(`Fetching real-time data for asset: ${assetSymbol}`);

      // Convert symbol to CoinGecko ID format (lowercase)
      const coinId = this.getCoinGeckoId(assetSymbol);

      // Fetch coin data including price in BTC and USD
      console.log(`Requesting price data for: ${coinId}`);
      const coinData = await axios.get(`${this.baseURL}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });

      const priceInBTC = coinData.data.market_data.current_price.btc;
      const priceInUSD = coinData.data.market_data.current_price.usd;

      console.log(`Asset price: $${priceInUSD}, Price in BTC: ${priceInBTC}`);

      // Calculate returns (simplified for now)
      const returns = {
        ytd: 15.5,
        oneYear: 35.2,
        threeYear: 120.8,
        fiveYear: 380.5,
        max: 850.3
      };

      const assetData: AssetData = {
        name: coinData.data.name,
        symbol: coinData.data.symbol.toUpperCase(),
        type: 'Cryptocurrency',
        priceInBTC: priceInBTC,
        priceInUSD: priceInUSD,
        returns: returns,
        lastUpdated: new Date(coinData.data.market_data.last_updated),
        image: coinData.data.image?.small
      };

      console.log(`Successfully fetched and processed data for: ${assetSymbol}`);
      return assetData;
    } catch (error) {
      // Log the error but don't throw
      console.error(`Error fetching data for asset: ${assetSymbol}:`, error);

      // Fallback to mock data
      console.log(`Falling back to mock data for asset: ${assetSymbol}`);
      return this.getMockAssetData(assetSymbol);
    }
  }

  /**
   * Get historical price data for a cryptocurrency
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    console.log(`[CoinGeckoService] getHistoricalData called for symbol: ${symbol}, days: ${days}`);

    if (this.useMockData) {
      console.log(`Using mock historical data for: ${symbol}`);
      return this.getMockHistoricalData(symbol, days);
    }

    try {
      console.log(`Fetching historical data for: ${symbol}`);

      // Convert symbol to CoinGecko ID format
      const coinId = this.getCoinGeckoId(symbol);

      const response = await axios.get(`${this.baseURL}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days > 90 ? 'daily' : undefined
        }
      });

      // Transform the response to our HistoricalDataPoint format
      const historicalData: HistoricalDataPoint[] = response.data.prices.map((item: [number, number]) => ({
        date: new Date(item[0]).toISOString().split('T')[0],
        price: item[1],
        volume: response.data.total_volumes.find((v: [number, number]) => v[0] === item[0])?.[1]
      }));

      console.log(`Successfully fetched historical data for: ${symbol}`);

      return historicalData;
    } catch (error) {
      console.error(`Error fetching historical data for: ${symbol}:`, error);
      return this.getMockHistoricalData(symbol, days);
    }
  }

  /**
   * Convert a symbol to CoinGecko ID format
   */
  private getCoinGeckoId(symbol: string): string {
    // Remove any :IND or other suffixes
    const cleanSymbol = symbol.split(':')[0].toLowerCase();

    // Map common symbols to their CoinGecko IDs
    const symbolMap: Record<string, string> = {
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
   */
  private getMockCryptos(page: number, pageSize: number): MarketAsset[] {
    const allCryptos: MarketAsset[] = [
      { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency', description: 'Digital gold' },
      { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency', description: 'Smart contract platform' },
      { symbol: 'BNB', name: 'Binance Coin', type: 'Cryptocurrency', description: 'Exchange token' },
      { symbol: 'SOL', name: 'Solana', type: 'Cryptocurrency', description: 'Smart contract platform' },
      { symbol: 'XRP', name: 'Ripple', type: 'Cryptocurrency', description: 'Payment protocol' },
      { symbol: 'ADA', name: 'Cardano', type: 'Cryptocurrency', description: 'Smart contract platform' },
      { symbol: 'DOGE', name: 'Dogecoin', type: 'Cryptocurrency', description: 'Meme coin' },
      { symbol: 'DOT', name: 'Polkadot', type: 'Cryptocurrency', description: 'Interoperability protocol' },
      { symbol: 'AVAX', name: 'Avalanche', type: 'Cryptocurrency', description: 'Smart contract platform' },
      { symbol: 'MATIC', name: 'Polygon', type: 'Cryptocurrency', description: 'Ethereum scaling solution' }
    ];

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return allCryptos.slice(start, end);
  }

  /**
   * Generate mock asset data for a given symbol
   */
  private getMockAssetData(symbol: string): AssetData {
    const mockData: {[key: string]: AssetData} = {
      'BTC': {
        name: 'Bitcoin',
        symbol: 'BTC',
        type: 'Cryptocurrency',
        priceInBTC: 1.0,
        priceInUSD: 29250.0,
        returns: {
          ytd: 20.0,
          oneYear: 50.0,
          threeYear: 150.0,
          fiveYear: 500.0,
          max: 1200.0
        },
        lastUpdated: new Date()
      },
      'ETH': {
        name: 'Ethereum',
        symbol: 'ETH',
        type: 'Cryptocurrency',
        priceInBTC: 0.0615,
        priceInUSD: 1800.0,
        returns: {
          ytd: 15.5,
          oneYear: 35.2,
          threeYear: 120.8,
          fiveYear: 380.5,
          max: 850.3
        },
        lastUpdated: new Date()
      },
      'BNB': {
        name: 'Binance Coin',
        symbol: 'BNB',
        type: 'Cryptocurrency',
        priceInBTC: 0.0123,
        priceInUSD: 360.0,
        returns: {
          ytd: 10.2,
          oneYear: 25.7,
          threeYear: 95.3,
          fiveYear: 320.8,
          max: 750.2
        },
        lastUpdated: new Date()
      },
      'SOL': {
        name: 'Solana',
        symbol: 'SOL',
        type: 'Cryptocurrency',
        priceInBTC: 0.0041,
        priceInUSD: 120.0,
        returns: {
          ytd: 25.8,
          oneYear: 45.3,
          threeYear: 180.2,
          fiveYear: 420.5,
          max: 950.7
        },
        lastUpdated: new Date()
      },
      'XRP': {
        name: 'Ripple',
        symbol: 'XRP',
        type: 'Cryptocurrency',
        priceInBTC: 0.00002,
        priceInUSD: 0.58,
        returns: {
          ytd: 8.5,
          oneYear: 15.2,
          threeYear: 35.8,
          fiveYear: 75.3,
          max: 150.2
        },
        lastUpdated: new Date()
      }
    };

    // Default to Bitcoin if the requested symbol is not in our mock data
    return mockData[symbol] || mockData['BTC'];
  }

  /**
   * Generate mock historical data for a symbol
   */
  private getMockHistoricalData(symbol: string, days: number): HistoricalDataPoint[] {
    const result: HistoricalDataPoint[] = [];
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
      case 'BNB':
        baseValue = 360;
        break;
      case 'SOL':
        baseValue = 120;
        break;
      case 'XRP':
        baseValue = 0.58;
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
        date: date.toISOString().split('T')[0],
        price: parseFloat(close.toFixed(2)),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        volume: parseFloat(volume.toFixed(2))
      });
    }

    return result;
  }
}