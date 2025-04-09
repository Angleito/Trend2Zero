# Metal Price API Integration Guide

## Overview
This service provides integration with Metal Price API to fetch real-time and historical prices for precious metals.

## Supported Metals
- Gold (XAU)
- Silver (XAG)
- Platinum (XPT)

## Configuration
1. Sign up at [MetalPriceAPI](https://metalpriceapi.com)
2. Add to `.env` file:
   ```
   METAL_PRICE_API_KEY=your_api_key_here
   ```

## Features
- Current metal prices
- Historical metal prices
- Metal price conversion
- Fallback mechanisms for API failures

## Usage Examples
```javascript
const metalPriceService = require('./metalPriceService');

// Get current metal prices
const prices = await metalPriceService.getCurrentPrices(['XAU', 'XAG']);

// Get historical price
const historicalPrice = await metalPriceService.getHistoricalPrices('XAU', '2023-01-01');

// Convert metal prices
const convertedAmount = await metalPriceService.convertMetalPrice(100, 'XAU', 'XAG');
```

## Best Practices
- Cache API responses
- Implement error handling
- Use fallback prices during API failures
- Secure API key with environment variables

## Error Handling
- Service provides fallback prices if API request fails
- Logs detailed error information
- Gracefully handles network or API issues

## Rate Limits
- Check MetalPriceAPI documentation for specific rate limits
- Implement caching to reduce API calls
- Recommended: Cache results for 5 minutes

## Limitations
- Prices are relative to USD
- Historical data availability may vary
- Fallback prices are static estimates