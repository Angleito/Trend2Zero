# Trend2Zero

## Project Overview
Trend2Zero is a comprehensive financial tracking and analysis application that provides real-time market data and insights.

## Key Features
- Real-time cryptocurrency and stock market tracking
- Advanced price analysis and historical data visualization
- Multi-asset portfolio management

## Technology Stack
- Next.js
- React
- TypeScript
- Node.js
- Tailwind CSS

## Data Sources
- Alpha Vantage API for stock market data
- CoinMarketCap API for cryptocurrency information

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Environment Configuration
   - For development: Copy `.env.example` to `.env` and fill in your API keys
   - For production: Create `.env.production` with production-specific configurations
4. Development Server: `npm run dev`

### Production Build
1. Set up environment variables in `.env.production`
2. Build the application: `npm run build`
3. Start the production server: `npm run start`

#### Environment Variable Management
- Use `.env.example` as a template for local development
- Create `.env.production` for production-specific settings
- Prefix client-side variables with `NEXT_PUBLIC_`
- Never commit sensitive API keys to version control

## API Integrations
- Stocks and ETFs (via Alpha Vantage API)
- Cryptocurrencies (via CoinMarketCap API)

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.