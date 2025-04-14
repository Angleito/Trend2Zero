/**
 * Cryptocurrency Helper Functions
 * 
 * This module provides utilities for detecting and working with cryptocurrency data.
 */

// Common cryptocurrency symbols - comprehensive list
const CRYPTO_SYMBOLS = [
  'BTC', 'ETH', 'XRP', 'USDT', 'BNB', 'SOL', 'ADA', 'DOGE', 'USDC', 'DOT', 
  'MATIC', 'SHIB', 'TRX', 'AVAX', 'UNI', 'APT', 'LINK', 'LTC', 'ATOM', 'XMR',
  'FIL', 'ALGO', 'ICP', 'SUI', 'ZEC', 'BCH', 'XLM', 'ETC', 'NEAR', 'STX',
  'PEPE', 'MANA', 'GRT', 'SAND', 'RUNE', 'IMX', 'COMP', 'AAVE', 'MKR', 'CRO',
  // Additional popular cryptocurrencies
  'DAI', 'WBTC', 'LEO', 'OKB', 'HT', 'AXS', 'THETA', 'EOS', 'XTZ', 'CAKE',
  'HBAR', 'CHZ', 'AR', 'FLOW', 'FTT', 'SNX', 'KCS', 'GMT', 'CRV', 'LDO',
  'NEO', 'EGLD', 'QNT', 'RPL', 'DASH', 'APE', 'KLAY', 'ENJ', 'BAT', 'ROSE',
  'ZRX', '1INCH', 'MINA', 'IOTA', 'GALA', 'XDC', 'LUNA', 'SUSHI', 'BIT', 'XEC',
  // Layer 2 and newer tokens
  'ARB', 'OP', 'BASE', 'BLUR', 'ENS', 'JTO', 'PYTH', 'SEI', 'TIA', 'BONK',
  'DYM', 'JUP', 'STRK', 'WIF', 'TAO', 'AEVO', 'BEAM', 'ONDO', 'NAKA', 'MOG',
  'PIXEL', 'RNDR', 'ZETA', 'ID', 'ORDI', 'CYBER', 'DYDX', 'GMX', 'INJ', 'METIS',
  'YGG', 'ACE', 'AGIX', 'AUDIO', 'CFX', 'CUDOS', 'FXS', 'GARI', 'GHO', 'GLM'
];

// Common cryptocurrency exchanges
const CRYPTO_EXCHANGES = [
  'BINANCE', 'COINBASE', 'KRAKEN', 'BITFINEX', 'HUOBI', 'KUCOIN', 'BYBIT', 
  'OKEX', 'GATEIO', 'BITTREX', 'GEMINI', 'BITSTAMP', 'FTX', 'BITMEX', 'POLONIEX',
  'COINEX', 'HOTBIT', 'MEXC', 'PHEMEX', 'DERIBIT', 'UPBIT', 'HITBTC', 'CRYPTO',
  'UNISWAP', 'PANCAKESWAP', 'SUSHISWAP', 'DYDX', '1INCH', 'CURVE', 'BALANCER'
];

// Common stock market symbols to avoid false positives
const COMMON_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT',
  'BAC', 'PG', 'MA', 'XOM', 'JNJ', 'CVX', 'HD', 'PFE', 'CSCO', 'ADBE', 'KO',
  'DIS', 'INTC', 'NFLX', 'AMD', 'QCOM', 'IBM', 'T', 'PYPL', 'SBUX', 'MCD',
  'BA', 'CAT', 'GS', 'NKE', 'VZ', 'UNH', 'CRM', 'ORCL', 'GOOG', 'BABA', 'F',
  'GM', 'MMM', 'GE', 'HON', 'UBER', 'LYFT', 'ZM', 'ABNB', 'SNOW', 'COP'
];

// Common stock market indices, commodities, and forex symbols
const INDICES_AND_COMMODITIES = [
  'SPX', 'DJI', 'IXIC', 'NDX', 'RUT', 'VIX', 'HSI', 'N225', 'FTSE', 'DAX', 
  'XAU', 'XAG', 'OIL', 'GAS', 'GOLD', 'SLVR', 'PLAT', 'CL', 'NG', 'GC',
  'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'INR', 'RUB'
];

/**
 * Normalize a trading symbol by stripping exchange prefixes and standardizing format
 * 
 * @param symbol Symbol with potential exchange prefix (e.g., "BINANCE:BTC")
 * @returns Normalized symbol (e.g., "BTC")
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  
  // Handle cases where symbol might contain a colon (e.g., 'BINANCE:BTC')
  const parts = symbol.split(':');
  // Take the last part after any colons
  const normalizedSymbol = parts[parts.length - 1].toUpperCase();
  
  // Remove common suffixes like -USD, -USDT, /USD, etc.
  return normalizedSymbol
    .replace(/-USD$|-USDT$|-BTC$|\/USD$|\/USDT$|\/BTC$/i, '')
    .replace(/PERP$|PERPETUAL$/i, '')
    .trim();
}

/**
 * Check if a symbol represents a common stock rather than cryptocurrency
 * 
 * @param symbol Symbol to check
 * @returns True if it's likely a stock symbol
 */
export function isCommonStockSymbol(symbol: string): boolean {
  if (!symbol) return false;
  
  const normalizedSymbol = symbol.toUpperCase();
  
  return COMMON_STOCKS.includes(normalizedSymbol) ||
         INDICES_AND_COMMODITIES.includes(normalizedSymbol);
}

/**
 * Determine if a symbol is a cryptocurrency
 * Uses multiple heuristics including known symbols, exchanges, and pattern matching
 * 
 * @param symbol Asset symbol to check (e.g., 'BTC', 'BINANCE:ETH')
 * @returns true if the asset is a cryptocurrency, false otherwise
 */
export function isCryptoCurrency(symbol: string): boolean {
  if (!symbol) return false;
  
  // Extract the base symbol without exchange prefix
  const parts = symbol.split(':');
  const exchangePart = parts.length > 1 ? parts[0].toUpperCase() : '';
  const normalizedSymbol = normalizeSymbol(symbol);
  
  // Check if symbol is in our list of known cryptocurrencies
  if (CRYPTO_SYMBOLS.includes(normalizedSymbol)) {
    return true;
  }
  
  // Check if it has a known crypto exchange prefix
  if (exchangePart && CRYPTO_EXCHANGES.includes(exchangePart)) {
    return true;
  }
  
  // Check for non-crypto symbols to avoid false positives
  if (isCommonStockSymbol(normalizedSymbol)) {
    return false;
  }
  
  // Additional pattern-based detection heuristics
  
  // Most crypto symbols are 3-5 characters and consist of letters/numbers only
  if (/^[A-Z0-9]{3,5}$/.test(normalizedSymbol)) {
    return true;
  }
  
  // Some newer crypto tokens have specific patterns
  if (/^[A-Z0-9]{3,8}$/.test(normalizedSymbol) && !/^[A-Z]{1,3}$/.test(normalizedSymbol)) {
    return true;
  }
  
  // Special cases for newer naming conventions (memecoin patterns)
  if (/^[A-Z0-9]{3,8}(INU|DOGE|PEPE|FLOKI|SHIB|BONK|CAT|DOG)$/.test(normalizedSymbol)) {
    return true;
  }
  
  return false;
}

/**
 * Get origin type of a cryptocurrency symbol
 * (e.g., "Binance" from "BINANCE:BTC")
 * 
 * @param symbol The cryptocurrency symbol with potential prefix
 * @returns The origin type (exchange name) or null
 */
export function getCryptoOriginType(symbol: string): string | null {
  if (!symbol) return null;
  
  const parts = symbol.split(':');
  if (parts.length <= 1) return null;
  
  const exchangePart = parts[0].toUpperCase();
  if (CRYPTO_EXCHANGES.includes(exchangePart)) {
    return exchangePart;
  }
  
  return null;
}

/**
 * Get a list of well-known cryptocurrency symbols
 * Useful for autocomplete features or suggestions
 * 
 * @returns Array of common crypto symbols
 */
export function getCommonCryptoSymbols(): string[] {
  return [...CRYPTO_SYMBOLS];
}

export default {
  isCryptoCurrency,
  normalizeSymbol,
  isCommonStockSymbol,
  getCryptoOriginType,
  getCommonCryptoSymbols
};