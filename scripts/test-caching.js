// scripts/test-caching.ts
import { closeDatabaseConnection } from '../lib/mongo';
import coinGeckoService from '../lib/services/coinGeckoService';
import coinMarketCapService from '../lib/services/coinMarketCapService';
import metalPriceService from '../lib/services/metalPriceService';
// --- Configuration ---
const TEST_ASSETS = {
    coinGecko: 'bitcoin', // Symbol for CoinGecko
    coinMarketCap: '1', // ID for Bitcoin on CoinMarketCap
    metalPrice: 'XAU', // Symbol for Gold
};
// -------------------
/**
 * Helper function to test caching for a given service and asset.
 * Calls the fetch function twice and logs the results.
 */
async function testServiceCache(serviceName, fetchFunction, assetId) {
    console.log(`\n--- Testing ${serviceName} Cache for ${assetId} ---`);
    console.log(`[${serviceName}] First call for ${assetId}...`);
    const result1 = await fetchFunction(assetId);
    console.log(`[${serviceName}] First call result for ${assetId}:`, result1?.price ? `$${result1.price}` : result1);
    // Small delay to ensure timestamp differences if needed, though likely not necessary
    // await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`\n[${serviceName}] Second call for ${assetId}...`);
    const result2 = await fetchFunction(assetId);
    console.log(`[${serviceName}] Second call result for ${assetId}:`, result2?.price ? `$${result2.price}` : result2);
    if (result1 && result2 && result1.price === result2.price && result1.lastUpdated === result2.lastUpdated) {
        console.log(`[${serviceName}] Results match. Cache likely hit on second call (check logs for fetch messages).`);
    }
    else if (!result1 && !result2) {
        console.log(`[${serviceName}] Both calls returned null.`);
    }
    else {
        console.warn(`[${serviceName}] Results DO NOT match or one was null. Potential caching issue.`);
        console.log('Result 1:', result1);
        console.log('Result 2:', result2);
    }
    console.log(`--- Finished Testing ${serviceName} Cache for ${assetId} ---\n`);
}
/**
 * Main test execution function.
 */
async function runCacheTests() {
    try {
        console.log('Ensuring database connection is available (via promise)...');
        // No explicit connect call needed, clientPromise handles it.
        // Test CoinGecko
        await testServiceCache('CoinGecko', coinGeckoService.getAssetPrice.bind(coinGeckoService), TEST_ASSETS.coinGecko);
        // Test CoinMarketCap
        await testServiceCache('CoinMarketCap', coinMarketCapService.getAssetPrice.bind(coinMarketCapService), TEST_ASSETS.coinMarketCap);
        // Test MetalPriceAPI
        await testServiceCache('MetalPriceAPI', metalPriceService.getMetalPrice.bind(metalPriceService), TEST_ASSETS.metalPrice);
    }
    catch (error) {
        console.error('\n*** An error occurred during testing ***:', error);
    }
    finally {
        console.log('\nClosing database connection...');
        await closeDatabaseConnection();
    }
}
// Run the tests
runCacheTests();
