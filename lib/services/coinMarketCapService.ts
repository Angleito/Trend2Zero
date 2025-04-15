import axios from 'axios';
import { AssetPrice } from '../types';
import { getCachedData } from '../cache'; // Import the MongoDB cache utility

class CoinMarketCapService {
  private apiKey?: string;
  private baseURL: string;
  private headers: Record<string, string>;
  private symbolToIdMappings: Record<string, string>;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.baseURL = 'https://pro-api.coinmarketcap.com/v1';
    
    // Default headers
    this.headers = {
      'Accept': 'application/json'
    };

    // Add API key if provided
    if (this.apiKey) {
      this.headers['X-CMC_PRO_API_KEY'] = this.apiKey;
    }

    // Predefined list of symbol to ID mappings
    this.symbolToIdMappings = {
      'BTC': '1',
      'ETH': '1027',
      'USDT': '825',
      'BNB': '1839',
      'SOL': '5426',
      'USDC': '3408',
      'XRP': '52',
      'ADA': '2010',
      'DOGE': '74'
    };
  }

  /**
   * Get asset price in a format compatible with the application's requirements
   *
   * @param id - CoinMarketCap cryptocurrency ID or symbol
   * @returns Formatted asset price data
   */
  async getAssetPrice(id: string): Promise<AssetPrice | null> {
    // Validate input
    if (!id) {
      console.warn('[CoinMarketCap] Invalid asset ID provided');
      return null;
    }

    const cacheKey = `coinmarketcap_asset_price_${id}`;
    // Use the MongoDB cache utility
    return getCachedData<AssetPrice | null>(cacheKey, async () => {
      try {
        console.log(`[CoinMarketCap] Fetching price for asset: ${id}`);

        // Convert symbol to ID if needed
        const coinId = this.getIdFromSymbol(id) || id;

        // Set a timeout for the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        const response = await axios.get(`${this.baseURL}/cryptocurrency/quotes/latest`, {
          params: {
            id: coinId,
            convert: 'USD'
          },
          headers: this.headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.data || !response.data.data || !response.data.data[coinId]) {
          console.warn(`[CoinMarketCap] No price data found for asset: ${id}`);
          return null;
        }

        const priceData = response.data.data[coinId].quote.USD;
        
        // Validate price data
        if (!priceData.price) {
          console.warn(`[CoinMarketCap] Invalid price data for asset: ${id}`);
          return null;
        }

        const assetPrice: AssetPrice = {
          id: coinId.toString(),
          symbol: this.getSymbolFromId(coinId),
          name: response.data.data[coinId].name,
          type: 'cryptocurrency',
          price: priceData.price,
          change: priceData.percent_change_24h || 0,
          changePercent: priceData.percent_change_24h || 0,
          priceInBTC: 0, // CoinMarketCap doesn't provide this directly
          priceInUSD: priceData.price,
          lastUpdated: new Date(priceData.last_updated).toISOString()
        };

        console.log(`[CoinMarketCap] Successfully fetched price for ${id}: $${assetPrice.price}`);
        return assetPrice;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            console.error(`[CoinMarketCap] Request timeout for asset: ${id}`);
          } else if (error.response) {
            console.error(`[CoinMarketCap] API response error for ${id}:`, {
              status: error.response.status,
              data: error.response.data
            });
          } else if (error.request) {
            console.error(`[CoinMarketCap] No response received for ${id}`);
          } else {
            console.error(`[CoinMarketCap] Error setting up request for ${id}:`, error.message);
          }
        } else {
          console.error(`[CoinMarketCap] Unexpected error for ${id}:`, error);
        }
        return null;
      }
    }, 60 * 60); // 1 hour TTL
  }

  /**
   * Converts a cryptocurrency symbol to CoinMarketCap's ID
   *
   * @param symbol - Cryptocurrency symbol (e.g., BTC)
   * @returns CoinMarketCap ID or null if not found
   */
  private getIdFromSymbol(symbol: string): string | null {
    const upperSymbol = symbol.toUpperCase();
    return this.symbolToIdMappings[upperSymbol] || null;
  }

  /**
   * Converts a CoinMarketCap ID to a symbol
   *
   * @param id - CoinMarketCap cryptocurrency ID
   * @returns Symbol or the ID itself if not found
   */
  private getSymbolFromId(id: string | number): string {
    const reverseMapping = Object.fromEntries(
      Object.entries(this.symbolToIdMappings).map(([k, v]) => [v, k])
    );
    return reverseMapping[id.toString()] || id.toString().toUpperCase();
  }
}

const coinMarketCapService = new CoinMarketCapService(process.env.COINMARKETCAP_API_KEY);
export default coinMarketCapService;