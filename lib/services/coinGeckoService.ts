import axios, { AxiosError } from 'axios';
import { HistoricalDataPoint, AssetPrice, normalizeHistoricalDataPoint, MarketAsset } from '../types';
import { getCachedData } from '../cache';
import fetch from 'node-fetch';

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
  private baseUrl = 'https://api.coingecko.com/api/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || 'free_tier_public_access';
    this.baseURL = 'https://api.coingecko.com/api/v3';
    
    // Default headers
    this.headers = {
      'Accept': 'application/json'
    };

    // Add API key if provided
    if (this.apiKey) {
      this.headers['x-cg-pro-api-key'] = this.apiKey;
    }

    // Predefined list of symbol to ID mappings (matching mock service)
    this.symbolToIdMappings = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana'
    };
  }

  /**
   * Get asset price by ID (for backward compatibility)
   * 
   * @param id - Cryptocurrency ID
   * @returns Formatted asset price data
   */
  async getAssetPrice(id: string): Promise<AssetPrice> {
    const cacheKey = `coingecko_asset_price_${id}`;
    return getCachedData<AssetPrice>(cacheKey, async () => {
      try {
        const response = await axios.get(`${this.baseURL}/simple/price`, {
          headers: this.headers,
          params: {
            ids: id,
            vs_currencies: 'usd',
            include_market_cap: 'true',
            include_24hr_vol: 'true',
            include_24hr_change: 'true',
            include_last_updated_at: 'true'
          }
        });

        const data = response.data[id];
        
        return {
          symbol: this.getSymbolFromId(id),
          price: data.usd,
          change: data.usd_24h_change,
          changePercent: data.usd_24h_change,
          volume24h: data.usd_24h_vol,
          marketCap: data.usd_market_cap,
          lastUpdated: new Date(data.last_updated_at * 1000).toISOString(),
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          type: 'Cryptocurrency',
          priceInBTC: 0,
          priceInUSD: data.usd
        };
      } catch (error: unknown) {
        console.error(`[CoinGecko] Error fetching asset price for ${id}:`, error);
        throw error; // Re-throw error for consistency with original behavior
      }
    }, 60 * 60); // 1 hour TTL
  }

  /**
   * Get asset price by symbol
   * 
   * @param symbol - Cryptocurrency symbol
   * @returns Formatted asset price data
   */
  async getCryptoPrice(symbol: string): Promise<AssetPrice | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      const price = data[symbol.toLowerCase()]?.usd;
      
      if (!price) return null;

      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        type: 'Cryptocurrency',
        price,
        changePercent: data[symbol.toLowerCase()]?.usd_24h_change || 0,
        priceInUSD: price,
        priceInBTC: 0,
        change: 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: unknown) {
      console.error(`[CoinGeckoService] Error fetching price for ${symbol}:`, error);
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
  async getHistoricalDataWithCache(symbol: string, days = 30): Promise<HistoricalDataPoint[]> {
    const cacheKey = `coingecko_historical_data_${symbol}_${days}`;
    return getCachedData<HistoricalDataPoint[]>(cacheKey, async () => {
      try {
        const id = this.getIdFromSymbol(symbol);
        const interval = days <= 30 ? 'hourly' : 'daily';

        const response = await axios.get(`${this.baseURL}/coins/${id}/market_chart`, {
          headers: this.headers,
          params: {
            vs_currency: 'usd',
            days: days.toString(),
            interval: interval
          }
        });

        const { prices, total_volumes } = response.data;

        return prices.map((priceData: [number, number], index: number) => 
          normalizeHistoricalDataPoint({
            timestamp: priceData[0],
            date: new Date(priceData[0]),
            price: priceData[1],
            value: priceData[1],
            open: priceData[1],
            high: priceData[1],
            low: priceData[1],
            close: priceData[1],
            volume: total_volumes[index][1]
          })
        );
      } catch (error: unknown) {
        if (this.isRateLimitError(error)) {
          console.error(`[CoinGecko] Rate limit exceeded for historical data: ${symbol}`);
          return [];
        }
        console.error(`[CoinGecko] Error fetching historical data for ${symbol}:`, error);
        return [];
      }
    }, 60 * 60);
  }

  /**
   * Fetch historical data for a specific time range
   * 
   * @param symbol - Cryptocurrency symbol
   * @param from - Start timestamp
   * @param to - End timestamp
   * @returns Historical data points
   */
  async getHistoricalDataRange(symbol: string, from: Date, to: Date): Promise<HistoricalDataPoint[]> {
    const cacheKey = `coingecko_historical_range_${symbol}_${from.toISOString()}_${to.toISOString()}`;
    return getCachedData<HistoricalDataPoint[]>(cacheKey, async () => {
      try {
        const id = this.getIdFromSymbol(symbol);
        const fromTimestamp = Math.floor(from.getTime() / 1000);
        const toTimestamp = Math.floor(to.getTime() / 1000);

        const response = await axios.get(`${this.baseURL}/coins/${id}/market_chart/range`, {
          headers: this.headers,
          params: {
            vs_currency: 'usd',
            from: fromTimestamp,
            to: toTimestamp
          }
        });

        const { prices, total_volumes } = response.data;

        return prices.map((priceData: [number, number], index: number) => 
          normalizeHistoricalDataPoint({
            timestamp: priceData[0],
            date: new Date(priceData[0]),
            price: priceData[1],
            value: priceData[1],
            open: priceData[1],
            high: priceData[1],
            low: priceData[1],
            close: priceData[1],
            volume: total_volumes[index][1]
          })
        );
      } catch (error: unknown) {
        if (this.isRateLimitError(error)) {
          console.error(`[CoinGecko] Rate limit exceeded for historical data range: ${symbol}`);
          return [];
        }
        console.error(`[CoinGecko] Error fetching historical data range for ${symbol}:`, error);
        return [];
      }
    }, 60 * 60);
  }

  /**
   * Fetch OHLC data for a cryptocurrency
   * 
   * @param symbol - Cryptocurrency symbol
   * @param days - Number of days of OHLC data to retrieve
   * @returns OHLC data points
   */
  async getOHLCData(symbol: string, days: number): Promise<any[]> {
    const cacheKey = `coingecko_ohlc_${symbol}_${days}`;
    return getCachedData<any[]>(cacheKey, async () => {
      const validDays = [1, 7, 14, 30, 90, 180, 365];
      const closestDays = validDays.reduce((prev, curr) => 
        Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
      );

      if (days !== closestDays) {
        console.warn(`Adjusted days from ${days} to ${closestDays} for OHLC data`);
      }

      try {
        const id = this.getIdFromSymbol(symbol);

        const response = await axios.get(`${this.baseURL}/coins/${id}/ohlc`, {
          headers: this.headers,
          params: {
            vs_currency: 'usd',
            days: closestDays.toString()
          }
        });

        return response.data.map((ohlcData: [number, number, number, number, number]) => ({
          timestamp: ohlcData[0],
          open: ohlcData[1],
          high: ohlcData[2],
          low: ohlcData[3],
          close: ohlcData[4]
        }));
      } catch (error: unknown) {
        if (this.isRateLimitError(error)) {
          console.error(`[CoinGecko] Rate limit exceeded for OHLC data: ${symbol}`);
          return [];
        }
        console.error(`[CoinGecko] Error fetching OHLC data for ${symbol}:`, error);
        return [];
      }
    }, 60 * 60);
  }

  /**
   * Converts a cryptocurrency symbol to CoinGecko's ID format
   * 
   * @param symbol - Cryptocurrency symbol (e.g., BTC)
   * @returns CoinGecko ID or null if not found
   */
  getIdFromSymbol(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();
    return this.symbolToIdMappings[upperSymbol] || symbol.toLowerCase();
  }

  /**
   * Converts a CoinGecko ID to a symbol
   * 
   * @param id - CoinGecko cryptocurrency ID
   * @returns Symbol or the ID itself if not found
   */
  getSymbolFromId(id: string): string {
    const reverseMapping = Object.fromEntries(
      Object.entries(this.symbolToIdMappings).map(([k, v]) => [v, k])
    );
    return reverseMapping[id] || id.toUpperCase();
  }

  /**
   * Type guard for rate limit error (handles both Axios and test mock errors)
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof AxiosError && error.response?.status === 429) {
      return true;
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response === 'object' &&
      (error as any).response !== null &&
      'status' in (error as any).response &&
      (error as any).response.status === 429
    ) {
      return true;
    }
    return false;
  }

  async getTopAssets(limit: number = 100): Promise<MarketAsset[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        symbol: item.symbol.toUpperCase(),
        name: item.name,
        type: 'Cryptocurrency',
        price: item.current_price,
        changePercent: item.price_change_percentage_24h,
        priceInUSD: item.current_price,
        priceInBTC: item.current_price / (data[0].current_price || 1),
        change: item.price_change_24h,
        lastUpdated: item.last_updated
      }));
    } catch (error: unknown) {
      console.error('[CoinGeckoService] Error fetching top assets:', error);
      return [];
    }
  }

  async getHistoricalData(symbol: string, days: number = 7): Promise<HistoricalDataPoint[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/coins/${symbol.toLowerCase()}/market_chart?vs_currency=usd&days=${days}&interval=daily`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.prices.map(([timestamp, price]: [number, number]): HistoricalDataPoint => ({
        timestamp,
        date: new Date(timestamp),
        price,
        value: price
      }));
    } catch (error: unknown) {
      console.error(`[CoinGeckoService] Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }
  async searchAssets(query: string, limit: number = 10): Promise<MarketAsset[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?query=${query}`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      // The CoinGecko /search endpoint returns coins, exchanges, and markets.
      // We'll filter for coins and map to MarketAsset.
      return data.coins.slice(0, limit).map((item: any) => ({
        symbol: item.symbol.toUpperCase(),
        name: item.name,
        type: 'Cryptocurrency', // Assuming search primarily returns cryptocurrencies
        price: 0, // Search endpoint doesn't return price directly
        change: 0, // Search endpoint doesn't return change directly
        changePercent: 0, // Search endpoint doesn't return change directly
        priceInUSD: 0, // Search endpoint doesn't return price directly
        priceInBTC: 0, // Search endpoint doesn't return price directly
        lastUpdated: new Date().toISOString(), // Use current time as last updated
        id: item.id
      }));
    } catch (error: unknown) {
      console.error(`[CoinGeckoService] Error searching assets for query "${query}":`, error);
      return [];
    }
  }


}

// Export the default instance for compatibility
const coinGeckoService = new CoinGeckoService(process.env.COINGECKO_API_KEY);
export default coinGeckoService;