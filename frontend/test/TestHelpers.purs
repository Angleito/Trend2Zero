module Test.TestHelpers where

import Prelude

import Data.Argonaut (Json, encodeJson, decodeJson, jsonEmptyObject, (.:), (:=), (~>))
import Data.Argonaut.Core (stringify)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..), fromMaybe)
import Data.DateTime (DateTime)
import Data.DateTime.Instant (Instant)
import Data.JSDate as JSDate
import Data.Int (round, toNumber) as Int
import Data.Number (fromString) as Number
import Effect (Effect)
import Effect.Aff (Aff, delay, Milliseconds(..))
import Effect.Class (liftEffect)
import Effect.Unsafe (unsafePerformEffect)
import Test.Spec.Assertions (shouldEqual, shouldNotEqual, shouldSatisfy, fail)
import Test.QuickCheck (class Arbitrary, arbitrary, Gen, quickCheck, Result)
import Test.QuickCheck.Gen (elements, frequency, sized, resize, listOf, chooseInt)
import Data.Array (take, filter, elem, length, all)
import Data.String as String
import Data.Traversable (for)
import Types

-- Test Data Generators
-- ====================

-- Generate valid asset symbols
genSymbol :: Gen String
genSymbol = elements ["BTC", "ETH", "AAPL", "GOOGL", "GOLD", "SILVER", "MSFT", "TSLA", "SPY", "QQQ"]

-- Generate realistic price ranges based on asset category
genPrice :: AssetCategory -> Gen Number
genPrice Crypto = do
  n <- chooseInt 1 100000
  pure $ Int.toNumber n / 100.0
genPrice Stock = do
  n <- chooseInt 100 5000
  pure $ Int.toNumber n / 10.0
genPrice Metal = do
  n <- chooseInt 1000 200000
  pure $ Int.toNumber n / 100.0

-- Generate percentage changes
genPercentChange :: Gen Number
genPercentChange = frequency
  [ { weight: 70.0, gen: do
        n <- chooseInt (-500) 500
        pure $ Int.toNumber n / 100.0
    }
  , { weight: 20.0, gen: do
        n <- chooseInt (-1000) 1000
        pure $ Int.toNumber n / 100.0
    }
  , { weight: 10.0, gen: do
        n <- chooseInt (-2000) 2000
        pure $ Int.toNumber n / 100.0
    }
  ]

-- Generate volumes based on asset type
genVolume :: AssetCategory -> Gen Number
genVolume Crypto = do
  n <- chooseInt 1000000 1000000000
  pure $ Int.toNumber n
genVolume Stock = do
  n <- chooseInt 100000 100000000
  pure $ Int.toNumber n
genVolume Metal = do
  n <- chooseInt 10000 10000000
  pure $ Int.toNumber n

-- Arbitrary Instances
-- ===================

instance arbitraryAssetCategory :: Arbitrary AssetCategory where
  arbitrary = elements [Metal, Stock, Crypto]

instance arbitraryOrderDirection :: Arbitrary OrderDirection where
  arbitrary = elements [Asc, Desc]

genAssetPrice :: Gen AssetPrice
genAssetPrice = do
  symbol <- genSymbol
  name <- frequency
    [ { weight: 80.0, gen: Just <$> arbitrary }
    , { weight: 20.0, gen: pure Nothing }
    ]
  category <- arbitrary
  price <- genPrice category
  priceInUSD <- frequency
    [ { weight: 70.0, gen: Just <$> genPrice category }
    , { weight: 30.0, gen: pure Nothing }
    ]
  priceInBTC <- frequency
    [ { weight: 50.0, gen: Just <$> do
          n <- chooseInt 1 100000
          pure $ Int.toNumber n / 10000000.0
      }
    , { weight: 50.0, gen: pure Nothing }
    ]
  changePercent <- genPercentChange
  let change = price * (changePercent / 100.0)
  lastUpdated <- frequency
    [ { weight: 80.0, gen: Just <$> pure "2024-01-01T00:00:00Z" }
    , { weight: 20.0, gen: pure Nothing }
    ]
  type_ <- frequency
    [ { weight: 50.0, gen: Just <$> elements ["crypto", "stock", "metal"] }
    , { weight: 50.0, gen: pure Nothing }
    ]
  pure { symbol, name, price, priceInUSD, priceInBTC, change, changePercent, lastUpdated, type: type_ }

genAssetData :: Gen AssetData
genAssetData = do
  symbol <- genSymbol
  name <- frequency
    [ { weight: 80.0, gen: Just <$> arbitrary }
    , { weight: 20.0, gen: pure Nothing }
    ]
  category <- frequency
    [ { weight: 80.0, gen: Just <$> arbitrary }
    , { weight: 20.0, gen: pure Nothing }
    ]
  price <- maybe (Int.toNumber <$> chooseInt 1 100000) genPrice category
  priceInUSD <- frequency
    [ { weight: 70.0, gen: Just <$> maybe (Int.toNumber <$> chooseInt 1 100000) genPrice category }
    , { weight: 30.0, gen: pure Nothing }
    ]
  priceInBTC <- frequency
    [ { weight: 50.0, gen: Just <$> do
          n <- chooseInt 1 100000
          pure $ Int.toNumber n / 10000000.0
      }
    , { weight: 50.0, gen: pure Nothing }
    ]
  changePercent <- genPercentChange
  let change = price * (changePercent / 100.0)
  change24h <- frequency
    [ { weight: 70.0, gen: Just <$> genPercentChange }
    , { weight: 30.0, gen: pure Nothing }
    ]
  volume24h <- frequency
    [ { weight: 70.0, gen: Just <$> maybe (Int.toNumber <$> chooseInt 1000 1000000000) genVolume category }
    , { weight: 30.0, gen: pure Nothing }
    ]
  marketCap <- frequency
    [ { weight: 70.0, gen: Just <$> do
          n <- chooseInt 1000000 1000000000
          pure $ Int.toNumber n
      }
    , { weight: 30.0, gen: pure Nothing }
    ]
  lastUpdated <- frequency
    [ { weight: 80.0, gen: Just <$> pure "2024-01-01T00:00:00Z" }
    , { weight: 20.0, gen: pure Nothing }
    ]
  pure { symbol, name, price, priceInUSD, priceInBTC, change, changePercent, change24h, volume24h, marketCap, category, lastUpdated }

-- Test Fixtures
-- =============

sampleBitcoin :: AssetData
sampleBitcoin =
  { symbol: "BTC"
  , name: Just "Bitcoin"
  , price: 50000.0
  , priceInUSD: Just 50000.0
  , priceInBTC: Just 1.0
  , change: 2500.0
  , changePercent: 5.0
  , change24h: Just 5.0
  , volume24h: Just 25000000000.0
  , marketCap: Just 1000000000000.0
  , category: Just Crypto
  , lastUpdated: Just "2024-01-01T00:00:00Z"
  }

sampleApple :: AssetData
sampleApple =
  { symbol: "AAPL"
  , name: Just "Apple Inc."
  , price: 180.0
  , priceInUSD: Just 180.0
  , priceInBTC: Just 0.0036
  , change: 2.5
  , changePercent: 1.4
  , change24h: Just 1.4
  , volume24h: Just 75000000.0
  , marketCap: Just 3000000000000.0
  , category: Just Stock
  , lastUpdated: Just "2024-01-01T00:00:00Z"
  }

sampleGold :: AssetData
sampleGold =
  { symbol: "GOLD"
  , name: Just "Gold"
  , price: 2050.0
  , priceInUSD: Just 2050.0
  , priceInBTC: Just 0.041
  , change: 10.0
  , changePercent: 0.49
  , change24h: Just 0.49
  , volume24h: Just 150000000.0
  , marketCap: Just 13000000000000.0
  , category: Just Metal
  , lastUpdated: Just "2024-01-01T00:00:00Z"
  }

-- Mock Data Generators
-- ====================

generateMockMarketData :: Int -> MarketData
generateMockMarketData limit =
  { assets: take limit mockAssets
  , total: length mockAssets
  , page: 1
  , limit: limit
  }
  where
    mockAssets = 
      [ assetDataToMarketAsset sampleBitcoin
      , assetDataToMarketAsset sampleApple
      , assetDataToMarketAsset sampleGold
      ] <> generateRandomAssets 97

    generateRandomAssets :: Int -> Array MarketAsset
    generateRandomAssets n = map generateRandomAsset (1 .. n)

    generateRandomAsset :: Int -> MarketAsset
    generateRandomAsset n =
      { symbol: "TEST" <> show n
      , name: "Test Asset " <> show n
      , price: Int.toNumber (n * 10)
      , priceInUSD: Just $ Int.toNumber (n * 10)
      , priceInBTC: Just $ Int.toNumber n * 0.0002
      , change: Int.toNumber (n `mod` 10) - 5.0
      , changePercent: (Int.toNumber (n `mod` 10) - 5.0) / 100.0
      , change24h: Just $ Int.toNumber (n `mod` 10) - 5.0
      , volume24h: Just $ Int.toNumber (n * 1000000)
      , marketCap: Just $ Int.toNumber (n * 100000000)
      , category: Just $ case n `mod` 3 of
          0 -> Crypto
          1 -> Stock
          _ -> Metal
      , type: Just $ case n `mod` 3 of
          0 -> "crypto"
          1 -> "stock"
          _ -> "metal"
      , lastUpdated: "2024-01-01T00:00:00Z"
      }

-- Convert AssetData to MarketAsset
assetDataToMarketAsset :: AssetData -> MarketAsset
assetDataToMarketAsset asset =
  { symbol: asset.symbol
  , name: fromMaybe asset.symbol asset.name
  , price: asset.price
  , priceInUSD: asset.priceInUSD
  , priceInBTC: asset.priceInBTC
  , change: asset.change
  , changePercent: asset.changePercent
  , change24h: asset.change24h
  , volume24h: asset.volume24h
  , marketCap: asset.marketCap
  , category: asset.category
  , type: categoryToType <$> asset.category
  , lastUpdated: fromMaybe "2024-01-01T00:00:00Z" asset.lastUpdated
  }
  where
    categoryToType :: AssetCategory -> String
    categoryToType Crypto = "crypto"
    categoryToType Stock = "stock"
    categoryToType Metal = "metal"

-- JSON Test Helpers
-- =================

shouldDecodeAs :: forall a. DecodeJson a => Eq a => Show a => Json -> a -> Aff Unit
shouldDecodeAs json expected = case decodeJson json of
  Right actual -> actual `shouldEqual` expected
  Left err -> fail $ "Failed to decode JSON: " <> show err

shouldEncodeAs :: forall a. EncodeJson a => a -> Json -> Aff Unit
shouldEncodeAs value expected = encodeJson value `shouldEqual` expected

-- Property Test Helpers
-- =====================

-- Check that all generated assets have valid categories
prop_validAssetCategories :: AssetData -> Boolean
prop_validAssetCategories asset =
  case asset.category of
    Nothing -> true
    Just cat -> cat `elem` [Metal, Stock, Crypto]

-- Check that price changes are consistent
prop_consistentPriceChanges :: AssetData -> Boolean
prop_consistentPriceChanges asset =
  let expectedChangePercent = (asset.change / asset.price) * 100.0
      tolerance = 0.01
  in abs (asset.changePercent - expectedChangePercent) < tolerance

-- Check that all prices are positive
prop_positivePrices :: AssetData -> Boolean
prop_positivePrices asset =
  asset.price > 0.0 &&
  fromMaybe true (\p -> p > 0.0) asset.priceInUSD &&
  fromMaybe true (\p -> p > 0.0) asset.priceInBTC &&
  fromMaybe true (\v -> v >= 0.0) asset.volume24h &&
  fromMaybe true (\m -> m >= 0.0) asset.marketCap

-- Mock API Response Helpers
-- =========================

mockApiResponse :: forall a. EncodeJson a => a -> Json
mockApiResponse = encodeJson

mockApiError :: String -> Json
mockApiError message = 
  "error" := message
  ~> "status" := 400
  ~> jsonEmptyObject

-- Async Test Helpers
-- ==================

-- Delay helper for testing async operations
testDelay :: Aff Unit
testDelay = delay (Milliseconds 10.0)

-- Run an action with timeout
withTimeout :: forall a. Milliseconds -> Aff a -> Aff (Maybe a)
withTimeout (Milliseconds ms) action = do
  -- This is a simplified version - in real tests you'd use proper race conditions
  result <- action
  pure (Just result)

-- Component Test Helpers
-- ======================

-- Create a test environment for Halogen components
type TestEnv =
  { apiBaseUrl :: String
  , mockResponses :: Array { path :: String, response :: Json }
  }

defaultTestEnv :: TestEnv
defaultTestEnv =
  { apiBaseUrl: "http://localhost:8080/api/v1"
  , mockResponses: []
  }

-- Helper to create mock API responses for testing
withMockApi :: forall a. Array { path :: String, response :: Json } -> Aff a -> Aff a
withMockApi mocks action = do
  -- In a real implementation, this would set up mock HTTP responses
  action

-- Range helper
infixl 8 range as ..
range :: Int -> Int -> Array Int
range start end = if start > end then [] else [start] <> range (start + 1) end

-- Absolute value helper
abs :: Number -> Number
abs n = if n < 0.0 then -n else n