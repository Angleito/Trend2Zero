import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.skip('measure page load times', async ({ page }) => {
    // Define the pages to test
    const pagesToTest = [
      { url: '/', name: 'homepage' },
      { url: '/posts', name: 'posts-listing' },
      { url: '/projects', name: 'projects-listing' },
      { url: '/search', name: 'search' },
      { url: '/categories', name: 'categories' }
    ];

    // Visit each page and measure load times
    for (const pageInfo of pagesToTest) {
      // Start measuring
      const startTime = Date.now();

      // Navigate to the page using baseURL from config
      await page.goto(pageInfo.url);

      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Calculate load time
      const loadTime = Date.now() - startTime;

      // Log the result
      console.log(`Page load time for ${pageInfo.name}: ${loadTime}ms`);

      // Assert that the page loads within a reasonable time (adjust as needed)
      expect(loadTime).toBeLessThan(5000); // 5 seconds max

      // Take a screenshot for reference
      await page.screenshot({
        path: `test-results/performance/${pageInfo.name}-loaded.png`,
        fullPage: true
      });
    }
  });

  test.skip('measure time to first contentful paint (Chromium only)', async ({ page, browserName }) => {
    // Skip this test for non-Chromium browsers
    test.skip(browserName !== 'chromium', 'CDP is only available in Chromium');

    // Navigate to the homepage
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Simple performance check - measure navigation timing
    const timing = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
        load: navEntry.loadEventEnd - navEntry.startTime
      };
    });

    // Log the result
    console.log(`DOM Content Loaded: ${timing.domContentLoaded}ms`);
    console.log(`Page Load: ${timing.load}ms`);

    // Assert that page loads within a reasonable time
    expect(timing.domContentLoaded).toBeLessThan(3000); // 3 seconds max

    // Take a screenshot for reference
    await page.screenshot({
      path: 'test-results/performance/page-load-timing.png'
    });
  });

  test.skip('measure time to interactive for dynamic pages', async ({ page }) => {
    // Navigate to the search page
    await page.goto('/search');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Start measuring
    const startTime = Date.now();

    // Try to find a search input with a more flexible selector
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i]').first();
    const searchButton = page.getByRole('button').filter({ hasText: /search/i }).first();

    // Check if we found the search elements
    const hasSearchInput = await searchInput.count() > 0;
    const hasSearchButton = await searchButton.count() > 0;

    if (hasSearchInput) {
      // Fill the search input
      await searchInput.fill('test');

      if (hasSearchButton) {
        // Click the search button
        await searchButton.click();

        // Wait for some indication of results
        await page.waitForTimeout(1000);
      } else {
        // Press Enter if no button found
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
      }

      // Calculate time to interactive
      const timeToInteractive = Date.now() - startTime;

      // Log the result
      console.log(`Time to interactive for search: ${timeToInteractive}ms`);

      // Take a screenshot for reference
      await page.screenshot({
        path: 'test-results/performance/search-interactive.png'
      });
    } else {
      console.log('Search input not found, skipping test');
      test.skip();
    }
  });

  test.skip('measure scroll performance', async ({ page }) => {
    // Navigate to a page with lots of content
    await page.goto('/posts');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Start measuring
    const startTime = Date.now();

    // Perform a series of scrolls
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await page.waitForTimeout(300); // Wait a bit between scrolls
    }

    // Calculate scroll performance time
    const scrollTime = Date.now() - startTime;

    // Log the result
    console.log(`Scroll performance time: ${scrollTime}ms`);

    // Assert that scrolling is smooth (adjust as needed)
    expect(scrollTime).toBeLessThan(3000); // 3 seconds max for 5 scrolls

    // Take a screenshot for reference
    await page.screenshot({
      path: 'test-results/performance/scroll-performance.png',
      fullPage: true
    });
  });

  test.skip('measure image load times', async ({ page }) => {
    // Navigate to a page with images
    await page.goto('/projects');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Get all image elements
    const images = await page.locator('img').all();

    // Log the number of images
    console.log(`Number of images on projects page: ${images.length}`);

    // Check if images are loaded
    for (const image of images) {
      // Check if the image is in the viewport
      const isVisible = await image.isVisible();

      if (isVisible) {
        // Check if the image has loaded successfully
        const isLoaded = await page.evaluate(async (imgLocator) => {
          const img = document.querySelector(imgLocator);
          if (!img || !(img instanceof HTMLImageElement)) {
            return false;
          }
          if (!img.complete) {
            return false;
          }
          if (img.naturalWidth === 0) {
            return false;
          }
          return true;
        }, await image.evaluate(node => {
          // Create a unique selector for this image
          return `img[src="${node.getAttribute('src')}"]`;
        }));

        expect(isLoaded).toBeTruthy();
      }
    }

    // Take a screenshot for reference
    await page.screenshot({
      path: 'test-results/performance/image-loading.png',
      fullPage: true
    });
  });
});