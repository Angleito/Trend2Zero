module API.MarketData
  ( getPopularAssets
  , getMarketOverview
  , getAssetPrice
  , getHistoricalData
  , searchAssets
  , marketDataConfig
  ) where

import Prelude

import API.Client (APIConfig, APIError(..), APIResult, RequestOptions, defaultConfig, get)
import API.Types (AssetPrice, HistoricalDataPoint, MarketAsset, MarketOverview)
import Affjax.RequestHeader (RequestHeader(..))
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Data.String as String
import Effect.Aff (Aff)
import URI.Extra.QueryPairs (QueryPairs, Key(..), Value(..), keyFromString, valueFromString, print) as QP

-- Market Data API Configuration
marketDataConfig :: APIConfig
marketDataConfig = defaultConfig
  { baseUrl = "/api/market-data"
  }

-- Default request options for market data endpoints
defaultRequestOptions :: RequestOptions
defaultRequestOptions =
  { headers: []
  , timeout: Nothing
  , withCredentials: false
  , retry: Nothing
  }

-- Helper to build query string
buildQueryString :: Array (QP.Key /\ QP.Value) -> String
buildQueryString [] = ""
buildQueryString pairs = "?" <> QP.print pairs

-- Get Popular Assets
getPopularAssets :: Int -> Aff (APIResult (Array MarketAsset))
getPopularAssets limit = do
  let queryParams = [ QP.keyFromString "limit" /\ QP.valueFromString (show limit) ]
      path = "/popular" <> buildQueryString queryParams
  
  result <- get marketDataConfig path defaultRequestOptions
  
  case result of
    Left err -> pure $ Left err
    Right assets -> pure $ Right assets

-- Get Market Overview
getMarketOverview :: Aff (APIResult MarketOverview)
getMarketOverview = do
  result <- get marketDataConfig "/overview" defaultRequestOptions
  
  case result of
    Left err -> pure $ Left err
    Right overview -> pure $ Right overview

-- Get Asset Price
getAssetPrice :: String -> Aff (APIResult AssetPrice)
getAssetPrice symbol = do
  let path = "/price/" <> symbol
  
  result <- get marketDataConfig path defaultRequestOptions
  
  case result of
    Left err -> pure $ Left err
    Right price -> pure $ Right price

-- Get Historical Data
getHistoricalData :: String -> Int -> Aff (APIResult (Array HistoricalDataPoint))
getHistoricalData symbol days = do
  let queryParams = [ QP.keyFromString "days" /\ QP.valueFromString (show days) ]
      path = "/historical/" <> symbol <> buildQueryString queryParams
  
  result <- get marketDataConfig path defaultRequestOptions
  
  case result of
    Left err -> pure $ Left err
    Right history -> pure $ Right history

-- Search Assets
searchAssets :: String -> Aff (APIResult (Array MarketAsset))
searchAssets query = do
  let queryParams = [ QP.keyFromString "q" /\ QP.valueFromString query ]
      path = "/search" <> buildQueryString queryParams
  
  result <- get marketDataConfig path defaultRequestOptions
  
  case result of
    Left err -> pure $ Left err
    Right assets -> pure $ Right assets

-- Additional helper functions for error handling and data transformation

-- Convert API errors to user-friendly messages
apiErrorToMessage :: APIError -> String
apiErrorToMessage (NetworkError msg) = "Network error: " <> msg
apiErrorToMessage (DecodeError msg) = "Invalid data format: " <> msg
apiErrorToMessage (ServerError code msg) = "Server error (" <> show code <> "): " <> msg
apiErrorToMessage (AuthError msg) = "Authentication error: " <> msg
apiErrorToMessage TimeoutError = "Request timed out. Please try again."
apiErrorToMessage (UnknownError msg) = "An unknown error occurred: " <> msg

-- Retry wrapper specifically for market data requests
retryMarketDataRequest :: forall a. Aff (APIResult a) -> Aff (APIResult a)
retryMarketDataRequest request = do
  result <- request
  case result of
    Left (ServerError code _) | code >= 500 -> request -- Retry once on server errors
    _ -> pure result

-- Cached request helper (for demonstration - actual caching would require more infrastructure)
type CacheKey = String
type CacheEntry a = { timestamp :: Number, data :: a }

-- In a real implementation, you'd have a proper cache store
-- This is just to show the pattern
cachedRequest :: forall a. String -> Aff (APIResult a) -> Aff (APIResult a)
cachedRequest key request = request -- Simplified - no actual caching

-- Batch request helper for multiple assets
getMultipleAssetPrices :: Array String -> Aff (APIResult (Array AssetPrice))
getMultipleAssetPrices symbols = do
  -- In a real API, you might have a batch endpoint
  -- For now, we'd need to make individual requests
  pure $ Left $ UnknownError "Batch requests not yet implemented"

-- Enhanced search with filters
searchAssetsWithFilters :: 
  { query :: String
  , category :: Maybe String
  , minPrice :: Maybe Number
  , maxPrice :: Maybe Number
  } -> Aff (APIResult (Array MarketAsset))
searchAssetsWithFilters filters = do
  let baseParams = [ QP.keyFromString "q" /\ QP.valueFromString filters.query ]
      categoryParam = case filters.category of
                        Just cat -> [ QP.keyFromString "category" /\ QP.valueFromString cat ]
                        Nothing -> []
      minPriceParam = case filters.minPrice of
                        Just price -> [ QP.keyFromString "minPrice" /\ QP.valueFromString (show price) ]
                        Nothing -> []
      maxPriceParam = case filters.maxPrice of
                        Just price -> [ QP.keyFromString "maxPrice" /\ QP.valueFromString (show price) ]
                        Nothing -> []
      
      allParams = baseParams <> categoryParam <> minPriceParam <> maxPriceParam
      path = "/search" <> buildQueryString allParams
  
  result <- get marketDataConfig path defaultRequestOptions
  
  case result of
    Left err -> pure $ Left err
    Right assets -> pure $ Right assets