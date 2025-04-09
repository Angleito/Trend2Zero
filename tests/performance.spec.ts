import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('measure page load times', async ({ page }) => {
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
      
      // Navigate to the page
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      
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
  
  test('measure time to first contentful paint', async ({ page }) => {
    // Enable performance metrics
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    
    // Navigate to the homepage
    await page.goto('http://localhost:3000');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Get performance metrics
    const performanceMetrics = await client.send('Performance.getMetrics');
    
    // Find first contentful paint metric
    const fcpMetric = performanceMetrics.metrics.find(m => m.name === 'FirstContentfulPaint');
    const fcp = fcpMetric ? fcpMetric.value : null;
    
    // Log the result
    if (fcp) {
      console.log(`First Contentful Paint: ${fcp}ms`);
      
      // Assert that FCP is within a reasonable time (adjust as needed)
      expect(fcp).toBeLessThan(2000); // 2 seconds max
    } else {
      console.log('First Contentful Paint metric not available');
    }
    
    // Take a screenshot for reference
    await page.screenshot({ 
      path: 'test-results/performance/fcp-homepage.png', 
      fullPage: true 
    });
  });
  
  test('measure time to interactive for dynamic pages', async ({ page }) => {
    // Navigate to the search page
    await page.goto('http://localhost:3000/search');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Start measuring
    const startTime = Date.now();
    
    // Interact with the search form
    await page.getByPlaceholder('Search posts and projects...').fill('test');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for search results or no results message
    await page.waitForSelector('text=/results found for|No results found for/', { state: 'visible' });
    
    // Calculate time to interactive
    const timeToInteractive = Date.now() - startTime;
    
    // Log the result
    console.log(`Time to interactive for search: ${timeToInteractive}ms`);
    
    // Assert that the interaction completes within a reasonable time (adjust as needed)
    expect(timeToInteractive).toBeLessThan(3000); // 3 seconds max
    
    // Take a screenshot for reference
    await page.screenshot({ 
      path: 'test-results/performance/search-interactive.png', 
      fullPage: true 
    });
  });
  
  test('measure scroll performance', async ({ page }) => {
    // Navigate to a page with lots of content
    await page.goto('http://localhost:3000/posts');
    
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
  
  test('measure image load times', async ({ page }) => {
    // Navigate to a page with images
    await page.goto('http://localhost:3000/projects');
    
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