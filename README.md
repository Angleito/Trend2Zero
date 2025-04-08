# Trend2Zero

## Bitcoin-Native Global Asset Tracker

### Project Overview
A revolutionary platform demonstrating how global assets trend when priced in Bitcoin.

### Key Features
- 🌐 Multi-Asset Tracking
  - Stocks
  - Commodities
  - Indices
  - Metals
  - Cryptocurrencies

- 📊 Bitcoin-Native Pricing
  - Real-time asset valuation in BTC
  - Comprehensive returns analysis
  - Interactive visualizations

### Technical Highlights
- **MERN Stack Architecture**:
  - MongoDB for database
  - Express for backend API
  - React (Next.js 14.2) for frontend
  - Node.js for server runtime
- CoinGecko and Alpha Vantage API Integration
- Highcharts and Lightweight Charts for visualization
- Responsive Dark Theme Design
- Playwright for browser testing
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

#### Backend Setup
```bash
git clone https://github.com/yourusername/Trend2Zero.git
cd Trend2Zero/backend
npm install

# Create .env file from example
cp .env.example .env

# Start the backend server
npm run dev
```

#### Frontend Setup
```bash
# Open a new terminal
cd Trend2Zero
npm install

# Create .env.local file from example
cp .env.example .env.local

# Start the frontend development server
npm run dev
```

### Environment Variables

#### Backend Environment Variables
Update the `.env` file in the backend directory with your MongoDB connection string and other settings. The application works with mock data by default, so API keys are optional.

#### Frontend Environment Variables
Update the `.env.local` file in the root directory to point to your backend API URL.

### Security Features
- **Server-side API Proxies**: All external API calls are proxied through secure server-side routes
- **API Key Protection**: API keys are stored server-side only and never exposed to clients
- **Rate Limiting**: Prevents abuse through configurable rate limiting
- **Input Validation**: All user inputs are validated and sanitized
- **CSRF Protection**: Requests are validated based on origin
- **Content Security Policy**: Restricts resource loading to trusted sources
- **Secure Headers**: Implements best practices for security headers

## Project Documentation
- `project-architecture.md`: Technical architecture overview
- `design-principles.md`: UI/UX design guidelines
- `architectural-specification.md`: Detailed system specifications

## Contributing
We welcome contributions! Please see `CONTRIBUTING.md`

## License
MIT License