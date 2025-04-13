import axios from 'axios';
import { HistoricalDataPoint, OHLCDataPoint, AssetPrice } from '../types';

/**
 * CoinGecko API Service
 *
 * This service provides methods to fetch cryptocurrency data from CoinGecko API.
 */
export class CoinGeckoService {
  private apiKey?: string;
  private baseURL: string;
  private headers: Record<string, string>;
  private symbolToIdMappings: Record<string, string>;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.coingecko.com/api/v3';
    
    // Default headers
    this.headers = {
      'Accept': 'application/json'
    };

    // Add API key if provided
    if (this.apiKey) {
      this.headers['x-cg-pro-api-key'] = this.apiKey;
    }

    // Predefined list of symbol to ID mappings
    this.symbolToIdMappings = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'USDC': 'usd-coin',
      'XRP': 'ripple',
      'STETH': 'staked-ether',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'TRX': 'tron',
      'TON': 'the-open-network',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'MATIC': 'polygon',
      'DOT': 'polkadot',
      'SHIB': 'shiba-inu',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
      'XLM': 'stellar',
      'NEAR': 'near',
      'ICP': 'internet-computer',
      'FIL': 'filecoin'
    };
  }

  /**
   * Get asset price in a format compatible with the application's requirements
   * 
   * @param id - CoinGecko cryptocurrency ID
   * @returns Formatted asset price data
   */
  async getAssetPrice(id: string): Promise<AssetPrice | null> {
    // Validate input
    if (!id) {
      console.warn('[CoinGecko] Invalid asset ID provided');
      return null;
    }

    try {
      console.log(`[CoinGecko] Fetching price for asset: ${id}`);

      // Set a timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      const response = await axios.get(`${this.baseURL}/simple/price`, {
        params: {
          ids: id,
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_vol: 'true',
          include_24hr_change: 'true',
          include_last_updated_at: 'true'
        },
        headers: this.headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.data || !response.data[id]) {
        console.warn(`[CoinGecko] No price data found for asset: ${id}`);
        return null;
      }

      const priceData = response.data[id];
      
      // Validate price data
      if (!priceData.usd) {
        console.warn(`[CoinGecko] Invalid price data for asset: ${id}`);
        return null;
      }

      const lastUpdateTimestamp = priceData.last_updated_at;
      const lastUpdated = new Date(lastUpdateTimestamp * 1000).toISOString();

      const assetPrice: AssetPrice = {
        id,
        symbol: this.getSymbolFromId(id),
        name: id.charAt(0).toUpperCase() + id.slice(1), // Capitalize first letter
        type: 'cryptocurrency',
        price: priceData.usd,
        change: priceData.usd_24h_change || 0,
        changePercent: priceData.usd_24h_change || 0,
        priceInBTC: 0, // CoinGecko doesn't provide this directly
        priceInUSD: priceData.usd,
        lastUpdated
      };

      console.log(`[CoinGecko] Successfully fetched price for ${id}: $${assetPrice.price}`);
      return assetPrice;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error(`[CoinGecko] Request timeout for asset: ${id}`);
        } else if (error.response) {
          console.error(`[CoinGecko] API response error for ${id}:`, {
            status: error.response.status,
            data: error.response.data
          });
        } else if (error.request) {
          console.error(`[CoinGecko] No response received for ${id}`);
        } else {
          console.error(`[CoinGecko] Error setting up request for ${id}:`, error.message);
        }
      } else {
        console.error(`[CoinGecko] Unexpected error for ${id}:`, error);
      }
      return null;
    }
  }

  /**
   * Get historical price data for a cryptocurrency
   * 
   * @param symbol - Cryptocurrency symbol (e.g., BTC)
   * @param days - Number of days of data to retrieve
   * @returns Array of historical data points
   */
  async getHistoricalData(symbol: string, days: number): Promise<HistoricalDataPoint[]> {
    try {
      // Convert symbol to CoinGecko ID
      const id = this.getIdFromSymbol(symbol);
      
      if (!id) {
        throw new Error(`Cryptocurrency not found: ${symbol}`);
      }

      // Dynamically select interval based on the number of days
      const interval = days <= 30 ? 'hourly' : 'daily';

      const response = await axios.get(`${this.baseURL}/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days.toString(),
          interval
        },
        headers: this.headers
      });

      // Transform CoinGecko data format into HistoricalDataPoint format
      const prices = response.data.prices; // [timestamp, price] pairs
      const volumes = response.data.total_volumes; // [timestamp, volume] pairs
      
      const historicalData: HistoricalDataPoint[] = [];
      
      for (let i = 0; i < prices.length; i++) {
        const timestamp = prices[i][0];
        const price = prices[i][1];
        const volume = i < volumes.length ? volumes[i][1] : 0;
        
        // Calculate approximate OHLC from daily prices
        const variation = price * 0.02; // 2% price variation during the day
        
        historicalData.push({
          date: new Date(timestamp),
          price,
          open: price - (variation / 2),
          high: price + variation,
          low: price - variation,
          close: price,
          volume
        });
      }
      
      return historicalData;
    } catch (error) {
      console.error('CoinGecko API Error:', error);
      throw error;
    }
  }

  /**
   * Converts a cryptocurrency symbol to CoinGecko's ID format
   * 
   * @param symbol - Cryptocurrency symbol (e.g., BTC)
   * @returns CoinGecko ID or null if not found
   */
  private getIdFromSymbol(symbol: string): string | null {
    const upperSymbol = symbol.toUpperCase();
    
    // Check direct mapping first
    if (this.symbolToIdMappings[upperSymbol]) {
      return this.symbolToIdMappings[upperSymbol];
    }
    
    // Make a best guess for other symbols by converting to lowercase
    return symbol.toLowerCase();
  }

  /**
   * Converts a CoinGecko ID to a symbol
   * 
   * @param id - CoinGecko cryptocurrency ID
   * @returns Symbol or the ID itself if not found
   */
  private getSymbolFromId(id: string): string {
    const reverseMapping = Object.fromEntries(
      Object.entries(this.symbolToIdMappings).map(([k, v]) => [v, k])
    );
    return reverseMapping[id] || id.toUpperCase();
  }
}

// Export singleton instance
export default new CoinGeckoService(process.env.COINGECKO_API_KEY);