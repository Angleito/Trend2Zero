module Test.MockAPI where

import Prelude

import Affjax (Response)
import Affjax.ResponseFormat as ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut (Json, jsonEmptyObject, stringify, (.:), (:=), (~>))
import Data.Either (Either(..))
import Data.Maybe (Maybe(..))
import Data.String as String
import Data.Array (find)
import Effect.Aff (Aff)
import Effect.Aff.Class (class MonadAff, liftAff)
import Types
import Test.TestHelpers

-- Mock API Response Type
type MockResponse =
  { status :: StatusCode
  , body :: Json
  }

-- Mock API Configuration
type MockApiConfig =
  { endpoints :: Array MockEndpoint
  , defaultDelay :: Number -- milliseconds
  , simulateErrors :: Boolean
  }

type MockEndpoint =
  { method :: String
  , path :: String
  , response :: MockResponse
  , delay :: Maybe Number
  }

-- Default mock configuration
defaultMockConfig :: MockApiConfig
defaultMockConfig =
  { endpoints: defaultMockEndpoints
  , defaultDelay: 10.0
  , simulateErrors: false
  }

-- Default mock endpoints matching the backend API
defaultMockEndpoints :: Array MockEndpoint
defaultMockEndpoints =
  [ -- Health endpoint
    { method: "GET"
    , path: "/api/v1/health"
    , response: { status: StatusCode 200, body: mockHealthResponse }
    , delay: Nothing
    }
    
  -- Market data endpoints
  , { method: "GET"
    , path: "/api/v1/market/assets"
    , response: { status: StatusCode 200, body: mockMarketDataResponse }
    , delay: Nothing
    }
  
  , { method: "GET"
    , path: "/api/v1/market/assets/BTC"
    , response: { status: StatusCode 200, body: mockBitcoinAssetResponse }
    , delay: Nothing
    }
  
  , { method: "GET"
    , path: "/api/v1/market/overview"
    , response: { status: StatusCode 200, body: mockMarketOverviewResponse }
    , delay: Nothing
    }
  
  , { method: "GET"
    , path: "/api/v1/market/historical/BTC"
    , response: { status: StatusCode 200, body: mockHistoricalDataResponse }
    , delay: Nothing
    }
  
  -- Watchlist endpoints
  , { method: "GET"
    , path: "/api/v1/watchlist"
    , response: { status: StatusCode 200, body: mockWatchlistResponse }
    , delay: Nothing
    }
  
  , { method: "POST"
    , path: "/api/v1/watchlist"
    , response: { status: StatusCode 204, body: jsonEmptyObject }
    , delay: Nothing
    }
  
  , { method: "DELETE"
    , path: "/api/v1/watchlist/BTC"
    , response: { status: StatusCode 204, body: jsonEmptyObject }
    , delay: Nothing
    }
  ]

-- Mock response data
mockHealthResponse :: Json
mockHealthResponse = 
  "status" := "ok"
  ~> "timestamp" := "2024-01-01T00:00:00Z"
  ~> "version" := "1.0.0"
  ~> jsonEmptyObject

mockMarketDataResponse :: Json
mockMarketDataResponse = mockApiResponse $ generateMockMarketData 20

mockBitcoinAssetResponse :: Json
mockBitcoinAssetResponse = mockApiResponse $ assetDataToMarketAsset sampleBitcoin

mockMarketOverviewResponse :: Json
mockMarketOverviewResponse = mockApiResponse
  { totalMarketCap: 2000000000000.0
  , totalVolume: 100000000000.0
  , totalAssets: 10000
  , topMovers: [assetDataToMarketAsset sampleBitcoin, assetDataToMarketAsset sampleApple]
  , recentlyAdded: [assetDataToMarketAsset sampleGold]
  }

mockHistoricalDataResponse :: Json
mockHistoricalDataResponse = mockApiResponse $ generateMockHistoricalData 7

mockWatchlistResponse :: Json
mockWatchlistResponse = mockApiResponse
  { data:
    { watchlist:
      [ { assetSymbol: "BTC", assetType: "crypto", dateAdded: "2024-01-01T00:00:00Z" }
      , { assetSymbol: "AAPL", assetType: "stock", dateAdded: "2024-01-01T00:00:00Z" }
      , { assetSymbol: "GOLD", assetType: "metal", dateAdded: "2024-01-01T00:00:00Z" }
      ]
    }
  }

-- Generate mock historical data
generateMockHistoricalData :: Int -> Array HistoricalDataPoint
generateMockHistoricalData days = map generateDataPoint (0 .. (days - 1))
  where
    basePrice = 50000.0
    baseTime = 1704067200 -- 2024-01-01 00:00:00 UTC
    
    generateDataPoint :: Int -> HistoricalDataPoint
    generateDataPoint dayOffset =
      let timestamp = baseTime - (dayOffset * 86400)
          variation = sin (Int.toNumber dayOffset / 10.0) * 0.05 + 1.0
          price = basePrice * variation
          jsDate = JSDate.fromTime (Int.toNumber timestamp * 1000.0)
          date = JSDate.toDateTime jsDate # fromMaybe (unsafePerformEffect JSDate.now >>= JSDate.toDateTime >>> fromMaybe (unsafePartial $ fromJust Nothing))
      in { timestamp
         , date
         , price
         , value: price
         , open: price * 0.99
         , high: price * 1.02
         , low: price * 0.98
         , close: price * 1.01
         , volume: 1000000.0 * variation
         }

-- Mock HTTP client for testing
class MonadAff m <= MockHttp m where
  mockRequest :: forall a. 
    { method :: String
    , url :: String
    , headers :: Array { key :: String, value :: String }
    , body :: Maybe Json
    } -> m (Response Json)

-- Mock implementation
newtype MockHttpT m a = MockHttpT (MockApiConfig -> m a)

derive newtype instance functorMockHttpT :: Functor m => Functor (MockHttpT m)
derive newtype instance applyMockHttpT :: Apply m => Apply (MockHttpT m)
derive newtype instance applicativeMockHttpT :: Applicative m => Applicative (MockHttpT m)
derive newtype instance bindMockHttpT :: Bind m => Bind (MockHttpT m)
derive newtype instance monadMockHttpT :: Monad m => Monad (MockHttpT m)
derive newtype instance monadAffMockHttpT :: MonadAff m => MonadAff (MockHttpT m)

instance mockHttpMockHttpT :: MonadAff m => MockHttp (MockHttpT m) where
  mockRequest req = MockHttpT \config -> liftAff do
    -- Extract path from URL
    let path = extractPath req.url
    
    -- Find matching endpoint
    case findEndpoint req.method path config.endpoints of
      Just endpoint -> do
        -- Simulate delay if configured
        let delayMs = fromMaybe config.defaultDelay endpoint.delay
        when (delayMs > 0.0) $ delay (Milliseconds delayMs)
        
        -- Return mock response
        pure { status: endpoint.response.status
             , statusText: statusText endpoint.response.status
             , headers: []
             , body: endpoint.response.body
             }
      
      Nothing -> 
        -- Return 404 if no endpoint matches
        pure { status: StatusCode 404
             , statusText: "Not Found"
             , headers: []
             , body: mockApiError "Endpoint not found"
             }

-- Helper functions
extractPath :: String -> String
extractPath url =
  -- Simple extraction - in real implementation would use proper URL parsing
  case String.indexOf (String.Pattern "://") url of
    Nothing -> url
    Just protocolEnd ->
      let withoutProtocol = String.drop (protocolEnd + 3) url
      in case String.indexOf (String.Pattern "/") withoutProtocol of
        Nothing -> "/"
        Just pathStart -> String.drop pathStart withoutProtocol

findEndpoint :: String -> String -> Array MockEndpoint -> Maybe MockEndpoint
findEndpoint method path = find \endpoint ->
  endpoint.method == method && endpoint.path == path

statusText :: StatusCode -> String
statusText (StatusCode 200) = "OK"
statusText (StatusCode 204) = "No Content"
statusText (StatusCode 400) = "Bad Request"
statusText (StatusCode 404) = "Not Found"
statusText (StatusCode 500) = "Internal Server Error"
statusText _ = "Unknown"

-- Run mock HTTP operations
runMockHttp :: forall m a. MockHttpT m a -> MockApiConfig -> m a
runMockHttp (MockHttpT f) = f

-- Convenience function to run with default config
runMockHttpDefault :: forall m a. MockHttpT m a -> m a
runMockHttpDefault action = runMockHttp action defaultMockConfig

-- Test utilities for creating custom mock responses
createMockEndpoint :: String -> String -> Json -> MockEndpoint
createMockEndpoint method path body =
  { method
  , path
  , response: { status: StatusCode 200, body }
  , delay: Nothing
  }

createErrorEndpoint :: String -> String -> Int -> String -> MockEndpoint
createErrorEndpoint method path statusCode errorMsg =
  { method
  , path
  , response: { status: StatusCode statusCode, body: mockApiError errorMsg }
  , delay: Nothing
  }

-- Mock WebSocket for real-time data
type MockWebSocketConfig =
  { url :: String
  , messages :: Array { delay :: Number, data :: Json }
  , simulateDisconnect :: Boolean
  }

mockWebSocket :: MockWebSocketConfig -> Aff Unit
mockWebSocket config = do
  -- Simulate WebSocket connection and message delivery
  traverse_ sendMessage config.messages
  where
    sendMessage { delay: d, data } = do
      delay (Milliseconds d)
      -- In real implementation, would trigger WebSocket message handlers

-- Import required modules
import Effect.Aff (delay, Milliseconds(..))
import Data.Traversable (traverse_)
import Control.Monad (when)
import Data.JSDate as JSDate
import Effect.Unsafe (unsafePerformEffect)
import Data.Int as Int
import Partial.Unsafe (unsafePartial)
import Data.Maybe (fromJust)