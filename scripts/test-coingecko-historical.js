import { createCoinGeckoService } from '../lib/services/coinGeckoService.js';

async function testCoinGeckoHistoricalData() {
  console.log('🚀 CoinGecko Historical Data Test Script 🚀');
  console.log('Environment Variables:');
  console.log('COINGECKO_API_KEY:', process.env.COINGECKO_API_KEY || 'NOT SET');

  // Create a new instance with the API key from environment
  const coinGeckoService = createCoinGeckoService(process.env.COINGECKO_API_KEY);

  try {
    console.log('\n1. Fetching Historical Data for Bitcoin (30 days):');
    const historicalData = await coinGeckoService.getHistoricalData('BTC', 30);
    console.log(`Total data points: ${historicalData.length}`);
    console.log('First data point:', {
      date: historicalData[0].date,
      price: historicalData[0].price,
      volume: historicalData[0].volume
    });
    
    // 2. Fetch historical data range between specific timestamps
    console.log('\n2. Fetching Historical Data Range:');
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const historicalDataRange = await coinGeckoService.getHistoricalDataRange('BTC', thirtyDaysAgo, now);
    console.log(`Total data points in range: ${historicalDataRange.length}`);
    console.log('First data point in range:', {
      date: historicalDataRange[0].date,
      price: historicalDataRange[0].price,
      volume: historicalDataRange[0].volume
    });
    
    // 3. Fetch OHLC data
    console.log('\n3. Fetching OHLC Data for Bitcoin (30 days):');
    const ohlcData = await coinGeckoService.getOHLCData('BTC', 30);
    console.log(`Total OHLC data points: ${ohlcData.length}`);
    console.log('First OHLC data point:', {
      timestamp: new Date(ohlcData[0].timestamp),
      open: ohlcData[0].open,
      high: ohlcData[0].high,
      low: ohlcData[0].low,
      close: ohlcData[0].close
    });
    
    console.log('\n✅ All CoinGecko historical data tests completed successfully!');
  } catch (error) {
    console.error('❌ Error in CoinGecko historical data tests:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    // Log additional axios error details if available
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
    }
    
    if (error.config) {
      console.error('Request URL:', error.config.url);
      console.error('Request Method:', error.config.method);
      console.error('Request Headers:', error.config.headers);
      console.error('Request Params:', error.config.params);
    }
    
    throw error;
  }
}

testCoinGeckoHistoricalData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});