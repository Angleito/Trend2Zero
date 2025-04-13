import axios from 'axios';

/**
 * CoinGecko API Service
 *
 * This service provides methods to fetch cryptocurrency data from CoinGecko API.
 */
export class CoinGeckoService {
  constructor(apiKey) {
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

    // Common symbol to CoinGecko ID mappings
    this.symbolToIdMappings = {
      // Top cryptocurrencies as of April 2025
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'XRP': 'ripple',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'USDC': 'usd-coin',
      'DOT': 'polkadot',
      'MATIC': 'polygon',
      'SHIB': 'shiba-inu',
      'TRX': 'tron',
      'AVAX': 'avalanche-2',
      'UNI': 'uniswap',
      'APT': 'aptos',
      'LINK': 'chainlink',
      'LTC': 'litecoin',
      'ATOM': 'cosmos',
      'XMR': 'monero',
      'FIL': 'filecoin',
      'ALGO': 'algorand',
      'ICP': 'internet-computer',
      'SUI': 'sui',
      'ZEC': 'zcash',
      
      // Keep other existing mappings
      'BCH': 'bitcoin-cash',
      'XLM': 'stellar'
    };
  }

  /**
   * Converts a cryptocurrency symbol to CoinGecko's ID format
   * 
   * @param symbol - Cryptocurrency symbol (e.g., BTC)
   * @returns CoinGecko ID or null if not found
   */
  getIdFromSymbol(symbol) {
    const upperSymbol = symbol.toUpperCase();
    
    // Check direct mapping first
    if (this.symbolToIdMappings[upperSymbol]) {
      return this.symbolToIdMappings[upperSymbol];
    }
    
    // Make a best guess for other symbols by converting to lowercase
    // This works for many but not all coins on CoinGecko
    return symbol.toLowerCase();
  }

  /**
   * Get current cryptocurrency price
   * 
   * @param symbol - Cryptocurrency symbol (e.g., BTC)
   * @returns Price data
   */
  async getCryptoPrice(symbol) {
    try {
      // Convert symbol to CoinGecko ID
      const id = this.getIdFromSymbol(symbol);
      
      if (!id) {
        throw new Error(`Cryptocurrency not found: ${symbol}`);
      }

      const response = await axios.get(`${this.baseURL}/simple/price`, {
        params: {
          ids: id,
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_vol: 'true',
          include_24hr_change: 'true',
          include_last_updated_at: 'true'
        },
        headers: this.headers
      });

      if (!response.data || !response.data[id]) {
        throw new Error(`Cryptocurrency not found: ${symbol}`);
      }

      const priceData = response.data[id];
      const lastUpdateTimestamp = priceData.last_updated_at;
      const lastUpdated = new Date(lastUpdateTimestamp * 1000).toISOString();

      return {
        symbol,
        price: priceData.usd,
        lastUpdated,
        volume24h: priceData.usd_24h_vol,
        marketCap: priceData.usd_market_cap,
        change24h: priceData.usd_24h_change
      };
    } catch (error) {
      console.error('CoinGecko API Error:', error);
      throw error;
    }
  }

  // Other methods remain the same (getHistoricalData, getHistoricalDataRange, etc.)
}

// Export a function to create a service instance
export function createCoinGeckoService(apiKey) {
  return new CoinGeckoService(apiKey);
}

// Export a default instance for convenience
export default createCoinGeckoService(process.env.COINGECKO_API_KEY);