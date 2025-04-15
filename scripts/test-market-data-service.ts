// scripts/test-market-data-service.ts
import { MarketDataService } from '../lib/services/marketDataService';
import { closeDatabaseConnection } from '../lib/mongo';

const TEST_ASSETS = [
  // Cryptos
  'BTC', 'ETH', 'ADA', 'SOL',
  // Stocks
  'AAPL', 'GOOGL',
  // Metals
  'XAU', 'XAG',
];

interface TestResult {
  symbol: string;
  first: any;
  second: any;
  errorFirst?: any;
  errorSecond?: any;
}

async function runComprehensiveMarketDataTest() {
  const service = new MarketDataService();
  const results: TestResult[] = [];
  try {
    for (const symbol of TEST_ASSETS) {
      let first = null, second = null, errorFirst = null, errorSecond = null;
      try {
        console.log(`\n[TEST] First call for ${symbol}`);
        first = await service.getAssetPrice(symbol);
        console.log(`[TEST] Result for ${symbol} (first):`, first);
      } catch (e) {
        errorFirst = e;
        console.error(`[TEST] ERROR for ${symbol} (first):`, e);
      }
      try {
        console.log(`[TEST] Second call for ${symbol}`);
        second = await service.getAssetPrice(symbol);
        console.log(`[TEST] Result for ${symbol} (second):`, second);
      } catch (e) {
        errorSecond = e;
        console.error(`[TEST] ERROR for ${symbol} (second):`, e);
      }
      results.push({ symbol, first, second, errorFirst, errorSecond });
    }
  } finally {
    await closeDatabaseConnection();
    printSummary(results);
  }
}

function printSummary(results: TestResult[]) {
  console.log('\n==== MARKET DATA SERVICE TEST SUMMARY ====');
  for (const r of results) {
    let status = 'PASS';
    if (r.errorFirst || r.errorSecond) status = 'ERROR';
    else if (!r.first && !r.second) status = 'NULL';
    else if (r.first?.price !== r.second?.price) status = 'MISMATCH';
    console.log(`Symbol: ${r.symbol} | Status: ${status}`);
    if (status === 'ERROR') {
      if (r.errorFirst) console.log('  First call error:', r.errorFirst);
      if (r.errorSecond) console.log('  Second call error:', r.errorSecond);
    } else if (status === 'MISMATCH') {
      console.log('  First:', r.first);
      console.log('  Second:', r.second);
    }
  }
  console.log('==== END OF SUMMARY ====\n');
}

runComprehensiveMarketDataTest();
