{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module Handlers.MarketData where

import Control.Monad.IO.Class (liftIO)
import Data.Maybe (fromMaybe)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time.Clock (getCurrentTime)
import Servant
import Types

-- | Handler for market overview
marketOverviewHandler :: Handler MarketOverview
marketOverviewHandler = do
  liftIO $ putStrLn "[API Route] Fetching market overview"
  
  -- For now, return mock data
  -- In production, this would call external services
  currentTime <- liftIO getCurrentTime
  let timeStr = T.pack $ show currentTime
  
  return MarketOverview
    { moTotalMarketCap = 2.5e12  -- $2.5 trillion
    , moTotalVolume = 1.2e11     -- $120 billion
    , moTotalAssets = 1500
    , moTopMovers = 
        [ MarketAsset
            { maSymbol = "BTC"
            , maName = "Bitcoin"
            , maPrice = 67890.12
            , maPriceInUSD = Just 67890.12
            , maPriceInBTC = Just 1.0
            , maChange = 1234.56
            , maChangePercent = 1.85
            , maChange24h = Just 1234.56
            , maVolume24h = Just 25000000000
            , maMarketCap = Just 1.3e12
            , maCategory = Just Crypto
            , maType = Just "Cryptocurrency"
            , maLastUpdated = timeStr
            }
        , MarketAsset
            { maSymbol = "ETH"
            , maName = "Ethereum" 
            , maPrice = 3456.78
            , maPriceInUSD = Just 3456.78
            , maPriceInBTC = Just 0.0509
            , maChange = 89.12
            , maChangePercent = 2.65
            , maChange24h = Just 89.12
            , maVolume24h = Just 12000000000
            , maMarketCap = Just 4.2e11
            , maCategory = Just Crypto
            , maType = Just "Cryptocurrency"
            , maLastUpdated = timeStr
            }
        ]
    , moRecentlyAdded = []
    }

-- | Handler for getting asset price by symbol
assetPriceHandler :: String -> Handler AssetPrice
assetPriceHandler symbol = do
  liftIO $ putStrLn $ "[API] Fetching price for: " ++ symbol
  
  currentTime <- liftIO getCurrentTime
  let timeStr = T.pack $ show currentTime
  
  -- Mock implementation - in production would call external services
  case symbol of
    "BTC" -> return AssetPrice
      { apSymbol = "BTC"
      , apName = Just "Bitcoin"
      , apType = Just "Cryptocurrency"
      , apPrice = 67890.12
      , apChange = 1234.56
      , apChangePercent = 1.85
      , apPriceInBTC = Just 1
      , apPriceInUSD = Just 67890.12
      , apLastUpdated = Just timeStr
      }
    "ETH" -> return AssetPrice
      { apSymbol = "ETH"
      , apName = Just "Ethereum"
      , apType = Just "Cryptocurrency"
      , apPrice = 3456.78
      , apChange = 89.12
      , apChangePercent = 2.65
      , apPriceInBTC = Just 0.0509
      , apPriceInUSD = Just 3456.78
      , apLastUpdated = Just timeStr
      }
    _ -> throwError err404 { errBody = "Asset not found" }

-- | Handler for searching assets
searchAssetsHandler :: Maybe String -> Maybe Int -> Handler [MarketAsset]
searchAssetsHandler mQuery mLimit = do
  let query = fromMaybe "" mQuery
      limit = fromMaybe 10 mLimit
  
  liftIO $ putStrLn $ "[API] Searching assets with query: " ++ query ++ ", limit: " ++ show limit
  
  if null query
    then throwError err400 { errBody = "Search query is required" }
    else do
      currentTime <- liftIO getCurrentTime
      let timeStr = T.pack $ show currentTime
      
      -- Mock search results
      return 
        [ MarketAsset
            { maSymbol = "BTC"
            , maName = "Bitcoin"
            , maPrice = 67890.12
            , maPriceInUSD = Just 67890.12
            , maPriceInBTC = Just 1.0
            , maChange = 1234.56
            , maChangePercent = 1.85
            , maChange24h = Just 1234.56
            , maVolume24h = Just 25000000000
            , maMarketCap = Just 1.3e12
            , maCategory = Just Crypto
            , maType = Just "Cryptocurrency"
            , maLastUpdated = timeStr
            }
        ]

-- | Handler for getting asset details
assetDetailsHandler :: String -> Handler MarketAsset
assetDetailsHandler symbol = do
  liftIO $ putStrLn $ "[API] Fetching asset details for: " ++ symbol
  
  currentTime <- liftIO getCurrentTime
  let timeStr = T.pack $ show currentTime
  
  -- Mock implementation
  case symbol of
    "BTC" -> return MarketAsset
      { maSymbol = "BTC"
      , maName = "Bitcoin"
      , maPrice = 67890.12
      , maPriceInUSD = Just 67890.12
      , maPriceInBTC = Just 1.0
      , maChange = 1234.56
      , maChangePercent = 1.85
      , maChange24h = Just 1234.56
      , maVolume24h = Just 25000000000
      , maMarketCap = Just 1.3e12
      , maCategory = Just Crypto
      , maType = Just "Cryptocurrency"
      , maLastUpdated = timeStr
      }
    _ -> throwError err404 { errBody = "Asset not found" }

-- | Handler for getting popular assets
popularAssetsHandler :: Handler [MarketAsset]
popularAssetsHandler = do
  liftIO $ putStrLn "[API] Fetching popular assets"
  
  currentTime <- liftIO getCurrentTime
  let timeStr = T.pack $ show currentTime
  
  -- Return top assets
  return 
    [ MarketAsset
        { maSymbol = "BTC"
        , maName = "Bitcoin"
        , maPrice = 67890.12
        , maPriceInUSD = Just 67890.12
        , maPriceInBTC = Just 1.0
        , maChange = 1234.56
        , maChangePercent = 1.85
        , maChange24h = Just 1234.56
        , maVolume24h = Just 25000000000
        , maMarketCap = Just 1.3e12
        , maCategory = Just Crypto
        , maType = Just "Cryptocurrency"
        , maLastUpdated = timeStr
        }
    , MarketAsset
        { maSymbol = "ETH"
        , maName = "Ethereum"
        , maPrice = 3456.78
        , maPriceInUSD = Just 3456.78
        , maPriceInBTC = Just 0.0509
        , maChange = 89.12
        , maChangePercent = 2.65
        , maChange24h = Just 89.12
        , maVolume24h = Just 12000000000
        , maMarketCap = Just 4.2e11
        , maCategory = Just Crypto
        , maType = Just "Cryptocurrency"
        , maLastUpdated = timeStr
        }
    , MarketAsset
        { maSymbol = "GOLD"
        , maName = "Gold"
        , maPrice = 2045.30
        , maPriceInUSD = Just 2045.30
        , maPriceInBTC = Just 0.0301
        , maChange = 12.50
        , maChangePercent = 0.61
        , maChange24h = Just 12.50
        , maVolume24h = Just 5000000000
        , maMarketCap = Nothing
        , maCategory = Just Metal
        , maType = Just "Commodity"
        , maLastUpdated = timeStr
        }
    ]

-- | Handler for getting all assets with pagination
allAssetsHandler :: Handler MarketData
allAssetsHandler = do
  liftIO $ putStrLn "[API] Fetching all assets"
  
  assets <- popularAssetsHandler  -- Reuse popular assets for now
  
  return MarketData
    { mdAssets = assets
    , mdTotal = length assets
    , mdPage = 1
    , mdLimit = 10
    }

-- | Handler for getting historical data
historicalDataHandler :: String -> Handler [HistoricalDataPoint]
historicalDataHandler symbol = do
  liftIO $ putStrLn $ "[API] Fetching historical data for: " ++ symbol
  
  currentTime <- liftIO getCurrentTime
  
  -- Mock historical data points
  return 
    [ HistoricalDataPoint
        { hdpTimestamp = 1735000000
        , hdpDate = currentTime
        , hdpPrice = 67000.0
        , hdpValue = 67000.0
        , hdpOpen = 66500.0
        , hdpHigh = 67500.0
        , hdpLow = 66000.0
        , hdpClose = 67000.0
        , hdpVolume = 1000000000
        }
    , HistoricalDataPoint
        { hdpTimestamp = 1734900000
        , hdpDate = currentTime
        , hdpPrice = 66500.0
        , hdpValue = 66500.0
        , hdpOpen = 66000.0
        , hdpHigh = 67000.0
        , hdpLow = 65500.0
        , hdpClose = 66500.0
        , hdpVolume = 950000000
        }
    ]