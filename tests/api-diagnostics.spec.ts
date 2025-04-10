import { test, expect } from '@playwright/test';

test('Test Market Data API', async ({ request }) => {
  // Test the crypto endpoint
  console.log('Testing /api/market-data endpoint with crypto parameter...');
  const cryptoResponse = await request.get('http://localhost:3002/api/market-data?endpoint=crypto');
  console.log(`Crypto API Status: ${cryptoResponse.status()}`);
  
  if (cryptoResponse.ok()) {
    const cryptoData = await cryptoResponse.json();
    console.log('Crypto API Response:', JSON.stringify(cryptoData, null, 2).substring(0, 500) + '...');
  } else {
    console.log('Crypto API Error:', await cryptoResponse.text());
  }
  
  // Test the bitcoin price endpoint
  console.log('\nTesting /api/crypto endpoint with bitcoin-price parameter...');
  const btcResponse = await request.get('http://localhost:3002/api/crypto?endpoint=bitcoin-price');
  console.log(`Bitcoin Price API Status: ${btcResponse.status()}`);
  
  if (btcResponse.ok()) {
    const btcData = await btcResponse.json();
    console.log('Bitcoin Price API Response:', JSON.stringify(btcData, null, 2));
  } else {
    console.log('Bitcoin Price API Error:', await btcResponse.text());
  }
});
