# Trend2Zero API Documentation

This document provides comprehensive documentation for the Trend2Zero API, which offers access to cryptocurrency, stock, and precious metal market data.

## Base URL

```
https://api.trend2zero.com/api
```

For local development:

```
http://localhost:5000/api
```

## Authentication

Most endpoints are publicly accessible, but some require authentication. Authentication is handled using JSON Web Tokens (JWT).

### Authentication Headers

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Register a new user

```
POST /users/signup
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

**Response:**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a001c8e8d1a",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "active": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Login

```
POST /users/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a001c8e8d1a",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "active": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Logout

```
GET /users/logout
```

**Response:**

```json
{
  "status": "success"
}
```

## Market Data Endpoints

### Get All Assets

Retrieve a list of all assets with optional filtering, sorting, and pagination.

```
GET /market-data/assets
```

**Query Parameters:**

| Parameter | Type   | Description                                                |
|-----------|--------|------------------------------------------------------------|
| type      | string | Filter by asset type (Cryptocurrency, Stocks, Precious Metal) |
| sort      | string | Sort field(s), comma-separated (e.g., "popularity,-name")  |
| page      | number | Page number for pagination (default: 1)                    |
| limit     | number | Number of results per page (default: 20)                   |
| fields    | string | Fields to include, comma-separated (e.g., "name,symbol")   |

**Response:**

```json
{
  "status": "success",
  "results": 2,
  "data": {
    "assets": [
      {
        "_id": "60c72b2f9b1d8a001c8e8d1a",
        "symbol": "BTC",
        "name": "Bitcoin",
        "type": "Cryptocurrency",
        "currentData": {
          "priceInUSD": 50000,
          "priceInBTC": 1,
          "change24h": 5,
          "lastUpdated": "2023-01-01T00:00:00.000Z"
        }
      },
      {
        "_id": "60c72b2f9b1d8a001c8e8d1b",
        "symbol": "ETH",
        "name": "Ethereum",
        "type": "Cryptocurrency",
        "currentData": {
          "priceInUSD": 3000,
          "priceInBTC": 0.06,
          "change24h": 3,
          "lastUpdated": "2023-01-01T00:00:00.000Z"
        }
      }
    ]
  }
}
```

### Get Asset by Symbol

Retrieve detailed information about a specific asset by its symbol.

```
GET /market-data/assets/:symbol
```

**URL Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| symbol    | string | Asset symbol (e.g., "BTC", "AAPL", "XAU")  |

**Response:**

```json
{
  "status": "success",
  "data": {
    "asset": {
      "_id": "60c72b2f9b1d8a001c8e8d1a",
      "symbol": "BTC",
      "name": "Bitcoin",
      "type": "Cryptocurrency",
      "currentData": {
        "priceInUSD": 50000,
        "priceInBTC": 1,
        "change24h": 5,
        "lastUpdated": "2023-01-01T00:00:00.000Z"
      },
      "returns": {
        "ytd": 20,
        "oneYear": 50,
        "threeYear": 150,
        "fiveYear": 500,
        "max": 1200
      }
    }
  }
}
```

### Get Asset Price

Retrieve the current price of an asset in both USD and BTC.

```
GET /market-data/price/:symbol
```

**URL Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| symbol    | string | Asset symbol (e.g., "BTC", "AAPL", "XAU")  |

**Response:**

```json
{
  "status": "success",
  "data": {
    "symbol": "BTC",
    "name": "Bitcoin",
    "type": "Cryptocurrency",
    "priceInBTC": 1,
    "priceInUSD": 50000,
    "returns": {
      "ytd": 20,
      "oneYear": 50,
      "threeYear": 150,
      "fiveYear": 500,
      "max": 1200
    },
    "lastUpdated": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get Historical Data

Retrieve historical price data for an asset.

```
GET /market-data/historical/:symbol
```

**URL Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| symbol    | string | Asset symbol (e.g., "BTC", "AAPL", "XAU")  |

**Query Parameters:**

| Parameter | Type   | Description                                                |
|-----------|--------|------------------------------------------------------------|
| timeframe | string | Time interval (daily, weekly, monthly) (default: daily)    |
| currency  | string | Currency for prices (USD, BTC) (default: USD)              |
| days      | number | Number of days of historical data (default: 30)            |

**Response:**

```json
{
  "status": "success",
  "results": 30,
  "data": {
    "symbol": "BTC",
    "timeframe": "daily",
    "currency": "USD",
    "dataPoints": [
      {
        "date": "2023-01-01T00:00:00.000Z",
        "price": 50000,
        "volume": 25000000000
      },
      {
        "date": "2022-12-31T00:00:00.000Z",
        "price": 49500,
        "volume": 24000000000
      },
      // ... more data points
    ]
  }
}
```

### Search Assets

Search for assets by name or symbol.

```
GET /market-data/assets/search
```

**Query Parameters:**

| Parameter | Type   | Description                                                |
|-----------|--------|------------------------------------------------------------|
| query     | string | Search query (required)                                    |
| type      | string | Asset type to search (crypto, stock, metal, all) (default: all) |
| limit     | number | Maximum number of results to return (default: 10)          |

**Response:**

```json
{
  "status": "success",
  "results": 3,
  "data": {
    "assets": [
      {
        "symbol": "BTC",
        "name": "Bitcoin",
        "type": "Cryptocurrency",
        "assetType": "crypto",
        "priceInUSD": 50000,
        "priceInBTC": 1
      },
      {
        "symbol": "BCH",
        "name": "Bitcoin Cash",
        "type": "Cryptocurrency",
        "assetType": "crypto",
        "priceInUSD": 500,
        "priceInBTC": 0.01
      },
      {
        "symbol": "BTCM",
        "name": "Bitcoin Miner",
        "type": "Stocks",
        "assetType": "stock",
        "priceInUSD": 10,
        "priceInBTC": 0.0002
      }
    ]
  }
}
```

### Get Popular Assets

Retrieve a list of popular assets across all asset types.

```
GET /market-data/assets/popular
```

**Query Parameters:**

| Parameter | Type   | Description                                                |
|-----------|--------|------------------------------------------------------------|
| limit     | number | Maximum number of results to return (default: 10)          |

**Response:**

```json
{
  "status": "success",
  "results": 5,
  "data": {
    "assets": [
      {
        "symbol": "BTC",
        "name": "Bitcoin",
        "type": "Cryptocurrency",
        "assetType": "crypto",
        "priceInUSD": 50000,
        "priceInBTC": 1
      },
      {
        "symbol": "ETH",
        "name": "Ethereum",
        "type": "Cryptocurrency",
        "assetType": "crypto",
        "priceInUSD": 3000,
        "priceInBTC": 0.06
      },
      {
        "symbol": "AAPL",
        "name": "Apple Inc",
        "type": "Stocks",
        "assetType": "stock",
        "priceInUSD": 150,
        "priceInBTC": 0.003
      },
      {
        "symbol": "XAU",
        "name": "Gold",
        "type": "Precious Metal",
        "assetType": "metal",
        "priceInUSD": 1800,
        "priceInBTC": 0.036
      },
      {
        "symbol": "XAG",
        "name": "Silver",
        "type": "Precious Metal",
        "assetType": "metal",
        "priceInUSD": 22,
        "priceInBTC": 0.00044
      }
    ]
  }
}
```

### Get Assets by Type

Retrieve assets of a specific type.

```
GET /market-data/assets/type/:type
```

**URL Parameters:**

| Parameter | Type   | Description                                                |
|-----------|--------|------------------------------------------------------------|
| type      | string | Asset type (Cryptocurrency, Stocks, Precious Metal, Commodities, Indices) |

**Query Parameters:**

| Parameter | Type   | Description                                                |
|-----------|--------|------------------------------------------------------------|
| limit     | number | Maximum number of results to return (default: 20)          |

**Response:**

```json
{
  "status": "success",
  "results": 2,
  "data": {
    "assets": [
      {
        "symbol": "BTC",
        "name": "Bitcoin",
        "type": "Cryptocurrency",
        "assetType": "crypto",
        "priceInUSD": 50000,
        "priceInBTC": 1
      },
      {
        "symbol": "ETH",
        "name": "Ethereum",
        "type": "Cryptocurrency",
        "assetType": "crypto",
        "priceInUSD": 3000,
        "priceInBTC": 0.06
      }
    ]
  }
}
```

## User Endpoints

### Get Current User

Retrieve information about the currently authenticated user.

```
GET /users/me
```

**Authentication Required:** Yes

**Response:**

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a001c8e8d1a",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "watchlist": [
        {
          "assetSymbol": "BTC",
          "assetType": "Cryptocurrency",
          "dateAdded": "2023-01-01T00:00:00.000Z"
        },
        {
          "assetSymbol": "AAPL",
          "assetType": "Stocks",
          "dateAdded": "2023-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Update User Information

Update the current user's information.

```
PATCH /users/updateMe
```

**Authentication Required:** Yes

**Request Body:**

```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a001c8e8d1a",
      "name": "John Smith",
      "email": "johnsmith@example.com",
      "role": "user",
      "active": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Update Password

Update the current user's password.

```
PATCH /users/updateMyPassword
```

**Authentication Required:** Yes

**Request Body:**

```json
{
  "passwordCurrent": "password123",
  "password": "newpassword456",
  "passwordConfirm": "newpassword456"
}
```

**Response:**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a001c8e8d1a",
      "name": "John Smith",
      "email": "johnsmith@example.com",
      "role": "user",
      "active": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Delete User Account

Deactivate the current user's account.

```
DELETE /users/deleteMe
```

**Authentication Required:** Yes

**Response:**

```json
{
  "status": "success",
  "data": null
}
```

## Watchlist Endpoints

### Get User Watchlist

Retrieve the current user's watchlist.

```
GET /users/watchlist
```

**Authentication Required:** Yes

**Response:**

```json
{
  "status": "success",
  "results": 2,
  "data": {
    "watchlist": [
      {
        "assetSymbol": "BTC",
        "assetType": "Cryptocurrency",
        "dateAdded": "2023-01-01T00:00:00.000Z",
        "asset": {
          "symbol": "BTC",
          "name": "Bitcoin",
          "currentData": {
            "priceInUSD": 50000,
            "priceInBTC": 1,
            "change24h": 5
          }
        }
      },
      {
        "assetSymbol": "AAPL",
        "assetType": "Stocks",
        "dateAdded": "2023-01-01T00:00:00.000Z",
        "asset": {
          "symbol": "AAPL",
          "name": "Apple Inc",
          "currentData": {
            "priceInUSD": 150,
            "priceInBTC": 0.003,
            "change24h": 1
          }
        }
      }
    ]
  }
}
```

### Add Asset to Watchlist

Add an asset to the current user's watchlist.

```
POST /users/watchlist
```

**Authentication Required:** Yes

**Request Body:**

```json
{
  "assetSymbol": "ETH",
  "assetType": "Cryptocurrency"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "watchlist": [
      {
        "assetSymbol": "BTC",
        "assetType": "Cryptocurrency",
        "dateAdded": "2023-01-01T00:00:00.000Z"
      },
      {
        "assetSymbol": "AAPL",
        "assetType": "Stocks",
        "dateAdded": "2023-01-01T00:00:00.000Z"
      },
      {
        "assetSymbol": "ETH",
        "assetType": "Cryptocurrency",
        "dateAdded": "2023-01-02T00:00:00.000Z"
      }
    ]
  }
}
```

### Remove Asset from Watchlist

Remove an asset from the current user's watchlist.

```
DELETE /users/watchlist/:assetSymbol
```

**URL Parameters:**

| Parameter   | Type   | Description                                |
|-------------|--------|--------------------------------------------|
| assetSymbol | string | Asset symbol to remove (e.g., "BTC")       |

**Authentication Required:** Yes

**Response:**

```json
{
  "status": "success",
  "data": {
    "watchlist": [
      {
        "assetSymbol": "AAPL",
        "assetType": "Stocks",
        "dateAdded": "2023-01-01T00:00:00.000Z"
      },
      {
        "assetSymbol": "ETH",
        "assetType": "Cryptocurrency",
        "dateAdded": "2023-01-02T00:00:00.000Z"
      }
    ]
  }
}
```

## Error Handling

The API uses consistent error responses across all endpoints.

### Error Response Format

```json
{
  "status": "fail",
  "message": "Error message describing what went wrong"
}
```

### Common Error Codes

| Status Code | Description                                                |
|-------------|------------------------------------------------------------|
| 400         | Bad Request - Invalid input parameters                     |
| 401         | Unauthorized - Authentication required or token invalid    |
| 403         | Forbidden - User does not have permission                  |
| 404         | Not Found - Resource not found                             |
| 429         | Too Many Requests - Rate limit exceeded                    |
| 500         | Internal Server Error - Something went wrong on the server |

## Rate Limiting

The API implements rate limiting to prevent abuse. By default, clients are limited to 100 requests per minute. If you exceed this limit, you will receive a 429 Too Many Requests response.

## Data Sources

The API uses the following data sources:

- **Cryptocurrency Data**: CoinMarketCap API
- **Stock Market Data**: Alpha Vantage API
- **Precious Metals Data**: MetalPriceAPI

## API Versioning

The current API version is v1. The version is included in the base URL.

```
https://api.trend2zero.com/api/v1
```

Future versions will be available at `/api/v2`, `/api/v3`, etc.
