import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Utility function to log DOM structure
const logDOMStructure = (structure: any, filename: string) => {
  const logPath = path.resolve(__dirname, `dom-structure-${filename}.json`);
  fs.writeFileSync(logPath, JSON.stringify(structure, null, 2));
  console.log(`DOM structure logged to ${logPath}`);
};

test('Analyze Crypto Page Structure', async ({ page }) => {
  // Configure extended timeout for more robust testing
  test.setTimeout(60000);

  console.log('Starting crypto page structure analysis...');
  
  try {
    // Navigate to the tracker page
    await page.goto('/tracker', { timeout: 30000 });
    console.log('✅ Navigation to tracker page successful');
  } catch (error) {
    console.error('❌ Navigation failed:', error);
    
    // Take screenshot of failed navigation
    await page.screenshot({ path: 'screenshots/navigation-failed.png' });
    throw error;
  }

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  console.log('✅ Page fully loaded');

  // Take screenshot of the tracker page
  await page.screenshot({ path: 'screenshots/tracker-page.png', fullPage: true });
  console.log('✅ Screenshot taken');

  // Analyze DOM structure - first look for cryptocurrency related elements
  const pageStructure = await page.evaluate(() => {
    // Helper function to get a simplified representation of an element
    const getElementInfo = (element: Element) => {
      if (!element) return null;
      
      const attributes = {};
      for (const attr of element.attributes) {
        (attributes as any)[attr.name] = attr.value;
      }
      
      return {
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        className: element.className || null,
        attributes,
        textContent: element.textContent?.trim().substring(0, 100) || null,
        childCount: element.children.length
      };
    };

    // Find possible crypto sections
    const potentialCryptoSections = [
      ...document.querySelectorAll('section, div[class*="crypto"], div[class*="asset"], div[id*="crypto"], div[id*="asset"]')
    ].map(getElementInfo);

    // Find possible crypto item elements
    const potentialCryptoItems = [
      ...document.querySelectorAll('div[class*="crypto-item"], div[class*="asset-item"], tr, li')
    ].map(getElementInfo);

    // Find any pricing related elements
    const priceElements = [
      ...document.querySelectorAll('div[class*="price"], span[class*="price"], p[class*="price"]')
    ].map(getElementInfo);

    // Look for search inputs
    const searchInputs = [
      ...document.querySelectorAll('input[type="search"], input[type="text"], input[placeholder*="search"], input[placeholder*="filter"]')
    ].map(getElementInfo);

    // Check if Bitcoin is mentioned on the page
    const bitcoinMentions = document.body.innerHTML.includes('BTC') || 
                            document.body.innerHTML.includes('Bitcoin');
    
    return {
      title: document.title,
      url: window.location.href,
      bitcoinMentions,
      potentialCryptoSections,
      potentialCryptoItems,
      priceElements,
      searchInputs
    };
  });

  console.log('Page analysis complete');
  console.log(`Bitcoin mentioned on page: ${pageStructure.bitcoinMentions ? 'Yes' : 'No'}`);
  console.log(`Found ${pageStructure.potentialCryptoSections.length} potential crypto sections`);
  console.log(`Found ${pageStructure.potentialCryptoItems.length} potential crypto items`);
  console.log(`Found ${pageStructure.priceElements.length} potential price elements`);
  console.log(`Found ${pageStructure.searchInputs.length} search inputs`);

  // Save the DOM structure for analysis
  logDOMStructure(pageStructure, 'tracker-page');

  // Take screenshot of all found crypto sections
  if (pageStructure.potentialCryptoSections.length > 0) {
    // Try to locate and screenshot elements that might be cryptocurrency sections
    for (let i = 0; i < Math.min(pageStructure.potentialCryptoSections.length, 5); i++) {
      try {
        const section = pageStructure.potentialCryptoSections[i];
        if (section && section.id) {
          await page.locator(`#${section?.id}`).screenshot({ path: `screenshots/crypto-section-${i}-by-id.png` });
        } else if (section && section.className) {
          const className = section?.className?.split(' ')[0];
          await page.locator(`.${className}`).first().screenshot({ 
            path: `screenshots/crypto-section-${i}-by-class.png` 
          });
        }
      } catch (error) {
        console.log(`Could not take screenshot of section ${i}`);
      }
    }
  }

  // List all visible text that might relate to cryptocurrencies
  const cryptoRelatedText = await page.evaluate(() => {
    const cryptoKeywords = ['BTC', 'ETH', 'Bitcoin', 'Ethereum', 'crypto', 'Crypto', 'coin', 'Coin', 'token', 'Token'];
    
    // Find all text nodes
    const walker = document.createTreeWalker(
      document.body, 
      NodeFilter.SHOW_TEXT, 
      null, 
      // Removed extra argument to fix TS2554 error
    );
    
    const cryptoTexts = [];
    let node;
    while(node = walker.nextNode()) {
      const text = node.textContent ? node.textContent.trim() : '';
      if (text && cryptoKeywords.some(keyword => text.includes(keyword))) {
        cryptoTexts.push({
          text: text.substring(0, 100), // Limit length
          parentElement: node.parentElement ? node.parentElement.tagName : null,
          parentClass: node.parentElement ? node.parentElement.className : null
        });
      }
    }
    
    return cryptoTexts;
  });
  
  console.log(`Found ${cryptoRelatedText.length} text items mentioning cryptocurrencies`);
  
  // Save crypto-related text items
  fs.writeFileSync(
    path.resolve(__dirname, 'crypto-related-text.json'),
    JSON.stringify(cryptoRelatedText, null, 2)
  );

  // Test results - primarily focused on gathering information, not validation
  expect(page.url()).toContain('tracker');
  expect(await page.title()).toBeTruthy();
});