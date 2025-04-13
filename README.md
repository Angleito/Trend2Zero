# Trend2Zero CLI

## Overview

Trend2Zero CLI is a comprehensive command-line interface for managing and interacting with the Trend2Zero project. It provides easy-to-use commands for building, testing, deploying, and managing your application.

## Prerequisites

- Node.js (>=18.0.0)
- npm

## Installation

### Global Installation
```bash
npm install -g .
```

### Local Project Installation
```bash
npm install
```

## Commands

### Build Commands
```bash
# Standard build
trend2zero build

# Build with bundle analysis
trend2zero build --analyze

# Analyze build performance
trend2zero build --performance
```

### Cache Management
```bash
# Clear build cache
trend2zero cache --clear

# Analyze cache performance
trend2zero cache --analyze

# Validate cache
trend2zero cache --validate

# Show cache metrics
trend2zero cache --metrics

# Prune cache
trend2zero cache --prune
```

### Testing
```bash
# Run all tests
trend2zero test

# Run unit tests
trend2zero test --unit

# Run end-to-end tests
trend2zero test --e2e

# Run visual tests
trend2zero test --visual

# Generate test coverage report
trend2zero test --coverage

# Run tests in watch mode
trend2zero test --watch
```

### Continuous Build Monitoring
```bash
# Run continuous build monitoring
npm run monitor:build
```

Continuous monitoring helps track:
- Build consistency
- Visual regressions
- Console and page errors
- Build stability validation

The monitoring system:
- Starts the development server
- Runs Playwright tests to monitor the build
- Captures and logs any inconsistencies or errors
- Generates detailed reports in the `tests/` directory

### Deployment
```bash
# Deploy to staging
trend2zero deploy

# Deploy to production
trend2zero deploy --production
```

### Development
```bash
# Start development server
trend2zero dev
```

### Performance
```bash
# Run performance tests
trend2zero performance
```

## Cryptocurrency Data Providers

Trend2Zero uses multiple cryptocurrency data providers for enhanced reliability:

### Integrated Services
- **CoinMarketCap API**: Primary data source for cryptocurrency prices and information
- **CoinGecko API**: Secondary data source for load balancing and fallback support

### Load Balancing Features
- Automatic request distribution between CoinMarketCap and CoinGecko
- Rate limit detection and provider switching
- Fallback mechanisms when primary provider fails
- Configurable provider weights via environment variables

### Configuration
Set up your API keys in the `.env` file:
```bash
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
COINGECKO_API_KEY=your_coingecko_api_key_here # Optional for free tier
```

Additional configuration options:
```bash
# Provider weights (higher number = more requests)
COINMARKETCAP_WEIGHT=7
COINGECKO_WEIGHT=3

# Rate limiting settings
RATE_LIMIT_RESET_INTERVAL=60000 # milliseconds
```

### Benefits
- Increased system reliability
- Improved handling of rate limits
- Better distribution of API requests
- Enhanced data availability

## Contributing

Please read the `CONTRIBUTING.md` file for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the terms specified in the `LICENSE` file.