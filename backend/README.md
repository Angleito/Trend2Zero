# Trend2Zero Backend

## Overview
This backend service provides market data collection, historical data storage, and API endpoints for the Trend2Zero application.

## Features
- Daily market data collection
- Historical price tracking
- MongoDB-based data storage
- Scheduled data retrieval jobs

## Project Structure
```
backend/
├── src/
│   ├── controllers/
│   ├── jobs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── package.json
└── README.md
```

## Setup and Installation

### Prerequisites
- Node.js (v14+)
- MongoDB

### Environment Variables
Create a `.env` file with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/trend2zero
PORT=3001
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### Installation
```bash
npm install
```

### Running the Server
- Development: `npm run dev`
- Production: `npm start`

## API Endpoints

### Historical Data
- `GET /api/historical-data/:symbol` - Retrieve historical data for a specific symbol
- `GET /api/historical-data?symbols=BTC,ETH` - Retrieve data for multiple symbols
- `GET /api/historical-data?category=Crypto` - Retrieve data by asset category

## Data Collection
A scheduled job runs daily at midnight to collect and store market data for various assets.

## Logging
Utilizes Winston for comprehensive logging of server activities and errors.

## Testing
Run tests with: `npm test`
