const { test, expect } = require('@playwright/test');

test.describe.skip('User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    // Using baseURL from config, so this will go to http://localhost:3000/
    await page.goto('/');

    // Add a small delay to ensure page is loaded
    await page.waitForTimeout(1000);
  });

  test('should navigate to market page and view assets', async ({ page }) => {
    // Click on the Market link in the navigation
    await page.click('text=Market');

    // Wait for the page to load
    await expect(page).toHaveURL(/.*\/market/);

    // Check that the page title is displayed
    await expect(page.locator('h1')).toContainText('Market Data');

    // Check that the search bar is displayed
    await expect(page.locator('input[placeholder="Search assets..."]')).toBeVisible();

    // Check that asset type tabs are displayed
    await expect(page.locator('button', { hasText: 'Popular' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Cryptocurrencies' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Stocks' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Precious Metals' })).toBeVisible();

    // Wait for assets to load
    await page.waitForSelector('[data-testid="asset-card"]');

    // Check that at least one asset card is displayed
    const assetCards = await page.locator('[data-testid="asset-card"]').count();
    expect(assetCards).toBeGreaterThan(0);
  });

  test('should search for assets', async ({ page }) => {
    // Navigate to the market page
    await page.click('text=Market');
    await expect(page).toHaveURL(/.*\/market/);

    // Enter search query
    await page.fill('input[placeholder="Search assets..."]', 'bitcoin');

    // Submit search form
    await page.press('input[placeholder="Search assets..."]', 'Enter');

    // Wait for search results to load
    await page.waitForSelector('[data-testid="asset-card"]');

    // Check that search results are displayed
    const assetCards = await page.locator('[data-testid="asset-card"]').count();
    expect(assetCards).toBeGreaterThan(0);

    // Check that at least one result contains "Bitcoin"
    const bitcoinCard = await page.locator('[data-testid="asset-name"]', { hasText: /bitcoin/i }).count();
    expect(bitcoinCard).toBeGreaterThan(0);
  });

  test('should filter assets by type', async ({ page }) => {
    // Navigate to the market page
    await page.click('text=Market');
    await expect(page).toHaveURL(/.*\/market/);

    // Click on Cryptocurrencies tab
    await page.click('button', { hasText: 'Cryptocurrencies' });

    // Wait for filtered assets to load
    await page.waitForSelector('[data-testid="asset-card"]');

    // Check that at least one asset card is displayed
    const assetCards = await page.locator('[data-testid="asset-card"]').count();
    expect(assetCards).toBeGreaterThan(0);

    // Click on Stocks tab
    await page.click('button', { hasText: 'Stocks' });

    // Wait for filtered assets to load
    await page.waitForSelector('[data-testid="asset-card"]');

    // Check that at least one asset card is displayed
    const stockCards = await page.locator('[data-testid="asset-card"]').count();
    expect(stockCards).toBeGreaterThan(0);
  });

  test('should view asset details', async ({ page }) => {
    // Navigate to the market page
    await page.click('text=Market');
    await expect(page).toHaveURL(/.*\/market/);

    // Wait for assets to load
    await page.waitForSelector('[data-testid="asset-card"]');

    // Click on the first asset card
    await page.click('[data-testid="asset-card"]');

    // Wait for the asset detail page to load
    await page.waitForSelector('h1');

    // Check that asset information is displayed
    await expect(page.locator('h1')).toBeVisible();

    // Check that price information is displayed
    await expect(page.locator('text=Price')).toBeVisible();

    // Check that chart section is displayed
    await expect(page.locator('text=Price Chart')).toBeVisible();

    // Check that time period buttons are displayed
    await expect(page.locator('button', { hasText: '7D' })).toBeVisible();
    await expect(page.locator('button', { hasText: '1M' })).toBeVisible();

    // Check that refresh button is displayed
    await expect(page.locator('button', { hasText: 'Refresh Data' })).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    // Click on the Sign Up link
    await page.click('text=Sign Up');

    // Wait for the sign up page to load
    await expect(page).toHaveURL(/.*\/signup/);

    // Fill in the sign up form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="passwordConfirm"]', 'password123');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect after successful signup
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Check that user is logged in
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('should login and logout', async ({ page }) => {
    // Create a test user first
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Login Test User');
    await page.fill('input[name="email"]', `login${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="passwordConfirm"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect after successful signup
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Logout
    await page.click('text=Logout');

    // Wait for redirect after logout
    await expect(page).toHaveURL(/.*\/login/);

    // Login with the same credentials
    await page.fill('input[name="email"]', `login${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect after successful login
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Check that user is logged in
    await expect(page.locator('text=Login Test User')).toBeVisible();
  });

  test('should add and remove assets from watchlist', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to the market page
    await page.click('text=Market');

    // Wait for assets to load
    await page.waitForSelector('[data-testid="asset-card"]');

    // Click on the first asset card
    await page.click('[data-testid="asset-card"]');

    // Wait for the asset detail page to load
    await page.waitForSelector('button', { hasText: /Add to Watchlist|Remove from Watchlist/ });

    // Check initial watchlist state
    const initialButtonText = await page.locator('button', { hasText: /Add to Watchlist|Remove from Watchlist/ }).textContent();

    // Toggle watchlist
    await page.click('button', { hasText: /Add to Watchlist|Remove from Watchlist/ });

    // Wait for button text to change
    await page.waitForFunction((initialText) => {
      const button = document.querySelector('button:has-text("Add to Watchlist"), button:has-text("Remove from Watchlist")');
      return button && button.textContent !== initialText;
    }, initialButtonText);

    // Toggle watchlist again
    await page.click('button', { hasText: /Add to Watchlist|Remove from Watchlist/ });

    // Wait for button text to change back
    await page.waitForFunction((initialText) => {
      const button = document.querySelector('button:has-text("Add to Watchlist"), button:has-text("Remove from Watchlist")');
      return button && button.textContent === initialText;
    }, initialButtonText);
  });

  test('should update user profile', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to the profile page
    await page.click('text=Profile');

    // Wait for the profile page to load
    await expect(page).toHaveURL(/.*\/profile/);

    // Update profile information
    await page.fill('input[name="name"]', 'Updated Name');

    // Submit the form
    await page.click('button', { hasText: 'Update Profile' });

    // Wait for success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // Check that name was updated
    await expect(page.locator('text=Updated Name')).toBeVisible();
  });
});
