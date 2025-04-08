# Trend2Zero Backend

This is the backend server for the Trend2Zero application, built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **RESTful API**: Provides endpoints for asset data, user management, and more
- **MongoDB Integration**: Stores asset data, user information, and historical prices
- **Authentication**: JWT-based authentication for secure user access
- **Security**: Implements best practices for API security
- **Rate Limiting**: Prevents abuse through configurable rate limiting
- **Error Handling**: Comprehensive error handling and logging

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Helmet**: Security headers
- **Winston**: Logging

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Trend2Zero.git
   cd Trend2Zero/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication Endpoints

- `POST /api/users/signup`: Register a new user
- `POST /api/users/login`: Login a user
- `GET /api/users/logout`: Logout a user

### User Endpoints

- `GET /api/users/me`: Get current user
- `PATCH /api/users/updateMe`: Update user profile
- `DELETE /api/users/deleteMe`: Delete user account
- `PATCH /api/users/updateMyPassword`: Update user password

### Watchlist Endpoints

- `GET /api/users/watchlist`: Get user watchlist
- `POST /api/users/watchlist`: Add asset to watchlist
- `DELETE /api/users/watchlist/:assetSymbol`: Remove asset from watchlist

### Market Data Endpoints

- `GET /api/market-data/assets`: Get all assets
- `GET /api/market-data/assets/popular`: Get popular assets
- `GET /api/market-data/assets/search`: Search assets
- `GET /api/market-data/assets/type/:type`: Get assets by type
- `GET /api/market-data/assets/:symbol`: Get asset by symbol
- `GET /api/market-data/price/:symbol`: Get asset price in BTC
- `GET /api/market-data/historical/:symbol`: Get historical data for an asset

## Security Features

- **Server-side API Proxies**: All external API calls are proxied through secure server-side routes
- **API Key Protection**: API keys are stored server-side only and never exposed to clients
- **Rate Limiting**: Prevents abuse through configurable rate limiting
- **Input Validation**: All user inputs are validated and sanitized
- **CSRF Protection**: Requests are validated based on origin
- **Password Hashing**: User passwords are securely hashed with bcrypt
- **JWT Authentication**: Secure authentication with JSON Web Tokens
- **Secure Headers**: Implements best practices for security headers

## Development

### Folder Structure

```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration
│   └── server.js       # Entry point
├── .env.example        # Environment variables example
├── package.json        # Dependencies and scripts
└── README.md           # Documentation
```

### Running Tests

```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
