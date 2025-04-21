// scripts/comprehensive-caching.test.ts
import { closeDatabaseConnection } from '../lib/mongo';
import coinGeckoService from '../lib/services/coinGeckoService';
import coinMarketCapService from '../lib/services/coinMarketCapService';
import metalPriceService from '../lib/services/metalPriceService';
const TEST_SYMBOLS = {
    coinGecko: [
        'bitcoin',
        'ethereum',
        'litecoin',
        'cardano',
        'solana',
    ],
    coinMarketCap: [
        '1', // Bitcoin
        '1027', // Ethereum
        '2', // Litecoin
        '2010', // Cardano
        '5426', // Solana
    ],
    metalPrice: [
        'XAU', // Gold
        'XAG', // Silver
        'XPT', // Platinum
        'XPD', // Palladium
    ],
};
async function testServiceCache(serviceName, fetchFunction, assetIds, results) {
    console.log(`\n=== Testing ${serviceName} Cache ===`);
    for (const assetId of assetIds) {
        let result1 = null;
        let result2 = null;
        let errorFirst = null;
        let errorSecond = null;
        try {
            console.log(`\n[${serviceName}] First call for ${assetId}...`);
            result1 = await fetchFunction(assetId);
            console.log(`[${serviceName}] First call result for ${assetId}:`, result1?.price ? `$${result1.price}` : result1);
        }
        catch (err) {
            errorFirst = err;
            console.error(`[${serviceName}] ERROR on first call for ${assetId}:`, err);
        }
        try {
            console.log(`[${serviceName}] Second call for ${assetId}...`);
            result2 = await fetchFunction(assetId);
            console.log(`[${serviceName}] Second call result for ${assetId}:`, result2?.price ? `$${result2.price}` : result2);
        }
        catch (err) {
            errorSecond = err;
            console.error(`[${serviceName}] ERROR on second call for ${assetId}:`, err);
        }
        results.push({
            service: serviceName,
            symbol: assetId,
            firstCall: result1,
            secondCall: result2,
            errorFirst,
            errorSecond,
        });
        if (result1 && result2 && result1.price === result2.price && result1.lastUpdated === result2.lastUpdated) {
            console.log(`[${serviceName}] Results match for ${assetId}. Cache likely hit on second call.`);
        }
        else if (!result1 && !result2) {
            console.log(`[${serviceName}] Both calls returned null for ${assetId}.`);
        }
        else if (errorFirst || errorSecond) {
            console.warn(`[${serviceName}] Error(s) occurred for ${assetId}. See logs above.`);
        }
        else {
            console.warn(`[${serviceName}] Results DO NOT match or one was null for ${assetId}. Potential caching issue.`);
            console.log('Result 1:', result1);
            console.log('Result 2:', result2);
        }
    }
    console.log(`\n=== Finished Testing ${serviceName} Cache ===\n`);
}
function printSummary(results) {
    console.log('\n===== CACHING TEST SUMMARY =====');
    const byService = {};
    for (const r of results) {
        if (!byService[r.service])
            byService[r.service] = [];
        byService[r.service].push(r);
    }
    for (const service of Object.keys(byService)) {
        console.log(`\nService: ${service}`);
        for (const r of byService[service]) {
            const status = r.errorFirst || r.errorSecond
                ? 'ERROR'
                : (!r.firstCall && !r.secondCall)
                    ? 'NULL'
                    : (r.firstCall && r.secondCall && r.firstCall.price === r.secondCall.price && r.firstCall.lastUpdated === r.secondCall.lastUpdated)
                        ? 'PASS'
                        : 'MISMATCH';
            console.log(`  Symbol: ${r.symbol} | Status: ${status}`);
            if (status === 'ERROR') {
                if (r.errorFirst)
                    console.log('    First call error:', r.errorFirst);
                if (r.errorSecond)
                    console.log('    Second call error:', r.errorSecond);
            }
            else if (status === 'MISMATCH') {
                console.log('    First call:', r.firstCall);
                console.log('    Second call:', r.secondCall);
            }
        }
    }
    console.log('\n===== END OF SUMMARY =====\n');
}
async function runComprehensiveCacheTests() {
    const results = [];
    try {
        // CoinGecko
        await testServiceCache('CoinGecko', coinGeckoService.getAssetPrice.bind(coinGeckoService), TEST_SYMBOLS.coinGecko, results);
        // CoinMarketCap
        await testServiceCache('CoinMarketCap', coinMarketCapService.getAssetPrice.bind(coinMarketCapService), TEST_SYMBOLS.coinMarketCap, results);
        // MetalPriceAPI
        await testServiceCache('MetalPriceAPI', metalPriceService.getMetalPrice.bind(metalPriceService), TEST_SYMBOLS.metalPrice, results);
        printSummary(results);
    }
    catch (error) {
        console.error('\n*** An error occurred during comprehensive caching test ***:', error);
    }
    finally {
        console.log('\nClosing database connection...');
        await closeDatabaseConnection();
        console.log('Database connection closed.');
    }
}
runComprehensiveCacheTests();
