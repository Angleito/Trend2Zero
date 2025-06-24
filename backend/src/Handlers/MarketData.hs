{-# LANGUAGE OverloadedStrings #-}

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

-- | Handler for getting asset by symbol (returns MarketAsset as per API)
assetBySymbolHandler :: String -> Handler MarketAsset
assetBySymbolHandler symbol = do
  liftIO $ putStrLn $ "[API] Fetching asset for: " ++ symbol
  
  currentTime <- liftIO getCurrentTime
  let timeStr = T.pack $ show currentTime
  
  -- Mock implementation - in production would call external services
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
    "ETH" -> return MarketAsset
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

-- | Handler for getting all assets with query parameters
allAssetsHandler :: Maybe String -> Maybe Int -> Maybe Int -> Maybe String -> Maybe String -> Maybe String -> Handler MarketData
allAssetsHandler mCategory mLimit mPage mSearch mSort mOrder = do
  liftIO $ putStrLn $ "[API] Fetching all assets with params: category=" ++ show mCategory ++ ", limit=" ++ show mLimit
  
  let limit = fromMaybe 10 mLimit
      page = fromMaybe 1 mPage
  
  assets <- popularAssetsHandler  -- Reuse popular assets for now
  
  return MarketData
    { mdAssets = assets
    , mdTotal = length assets
    , mdPage = page
    , mdLimit = limit
    }

-- | Handler for getting historical data with period parameter
historicalDataHandler :: String -> Maybe String -> Handler [HistoricalDataPoint]
historicalDataHandler symbol mPeriod = do
  let period = fromMaybe "7d" mPeriod
  liftIO $ putStrLn $ "[API] Fetching historical data for: " ++ symbol ++ ", period: " ++ period
  
  currentTime <- liftIO getCurrentTime
  
  -- Mock historical data points
  return 
    [ HistoricalDataPoint
        { hdTimestamp = 1735000000
        , hdDate = currentTime
        , hdPrice = 67000.0
        , hdValue = 67000.0
        , hdOpen = 66500.0
        , hdHigh = 67500.0
        , hdLow = 66000.0
        , hdClose = 67000.0
        , hdVolume = Just 1000000000
        }
    , HistoricalDataPoint
        { hdTimestamp = 1734900000
        , hdDate = currentTime
        , hdPrice = 66500.0
        , hdValue = 66500.0
        , hdOpen = 66000.0
        , hdHigh = 67000.0
        , hdLow = 65500.0
        , hdClose = 66500.0
        , hdVolume = Just 950000000
        }
    ]