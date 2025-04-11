# Using Mock Data in Trend2Zero

This document explains how to use the mock data feature in Trend2Zero to develop and test the application without valid API keys.

## Overview

Trend2Zero uses several external APIs to fetch market data:
- CoinMarketCap for cryptocurrency data
- Alpha Vantage for stocks data
- MetalPriceAPI for precious metals data

To facilitate development and testing without valid API keys, the application includes a mock data system that can be used as a fallback when API calls fail or when explicitly enabled.

## Configuration

Mock data is configured through environment variables in your `.env` or `.env.local` file:

```
# Mock data configuration
# Set to 'true' to use mock data when API calls fail or when keys are invalid
USE_MOCK_DATA=true
# Cache duration for mock data in minutes
MOCK_DATA_CACHE_MINUTES=60
```

## How It Works

The `ExternalApiService` class has been updated to use mock data in two scenarios:

1. **Proactive Mode**: When `USE_MOCK_DATA=true`, the service will immediately return mock data without attempting to call the external APIs.

2. **Fallback Mode**: When an API call fails (due to invalid keys, network issues, etc.) and `USE_MOCK_DATA=true`, the service will fall back to using mock data.

## Available Mock Data

The `MockDataService` provides the following mock data:

- Cryptocurrency list (Bitcoin, Ethereum, etc.)
- Stock list (Apple, Microsoft, etc.)
- Commodities list (Gold, Silver, etc.)
- Indices list (S&P 500, Dow Jones, etc.)
- Asset price data with random values
- Historical price data with random values

## Testing API Services

You can test the API services using the diagnostic endpoints:

- `/api/diagnostics/services-test` - Tests all external API services
- `/api/diagnostics/mongo-test` - Tests MongoDB connection

These endpoints will indicate whether they're using real or mock data in their responses.

## Development Workflow

1. **Local Development**: Set `USE_MOCK_DATA=true` in your `.env.local` file to use mock data during development.

2. **Testing with Real APIs**: Set `USE_MOCK_DATA=false` and provide valid API keys to test with real data.

3. **Production**: Always use real API keys in production and set `USE_MOCK_DATA=false`.

## Adding New Mock Data

If you need to add new mock data:

1. Update the `MockDataService` class in `lib/services/mockDataService.ts`
2. Add your new mock data methods
3. Update the corresponding methods in `ExternalApiService` to use your new mock data

## Troubleshooting

If you're experiencing issues with the mock data system:

1. Check that `USE_MOCK_DATA` is set to `true` in your environment variables
2. Verify that the `MockDataService` is properly instantiated in the `ExternalApiService`
3. Check the console logs for any error messages related to mock data
4. Use the diagnostic endpoints to test the services and see if mock data is being used

## Best Practices

- Always prefer real API data for production environments
- Use mock data only for development and testing purposes
- Keep mock data reasonably realistic to avoid UI/UX issues
- Update mock data periodically to reflect changes in the real data structure
