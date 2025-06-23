{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE DeriveGeneric #-}

module TestHelpers where

import Test.Hspec
import Test.QuickCheck
import Data.Text (Text)
import qualified Data.Text as T
import Data.Aeson
import Data.Time
import Data.Time.Clock.POSIX
import Types
import Network.Wai.Test
import Servant.Client
import Network.HTTP.Client (Manager, newManager, defaultManagerSettings)
import Data.Maybe (fromMaybe)
import Control.Concurrent.STM
import qualified Data.Map.Strict as Map

-- Test Data Generators
-- ====================

-- Generate valid symbols
genSymbol :: Gen Text
genSymbol = elements ["BTC", "ETH", "AAPL", "GOOGL", "GOLD", "SILVER", "MSFT", "TSLA", "SPY", "QQQ"]

-- Generate realistic price ranges
genPrice :: AssetCategory -> Gen Double
genPrice Crypto = choose (0.01, 100000.0)
genPrice Stock = choose (1.0, 5000.0)
genPrice Metal = choose (10.0, 2000.0)

-- Generate percentage changes
genPercentChange :: Gen Double
genPercentChange = frequency
  [ (70, choose (-5.0, 5.0))      -- Normal daily movements
  , (20, choose (-10.0, 10.0))     -- Larger movements
  , (10, choose (-20.0, 20.0))     -- Extreme movements
  ]

-- Generate volumes based on asset type
genVolume :: AssetCategory -> Gen Double
genVolume Crypto = choose (1000000.0, 100000000000.0)
genVolume Stock = choose (100000.0, 10000000000.0)
genVolume Metal = choose (10000.0, 1000000000.0)

-- QuickCheck Arbitrary Instances
-- ==============================

instance Arbitrary AssetCategory where
  arbitrary = elements [Metal, Stock, Crypto]

instance Arbitrary OrderDirection where
  arbitrary = elements [Asc, Desc]

instance Arbitrary Text where
  arbitrary = T.pack <$> listOf1 (elements ['a'..'z'])

instance Arbitrary MarketDataOptions where
  arbitrary = do
    mdoCategory <- arbitrary
    mdoLimit <- elements [Nothing, Just 10, Just 50, Just 100]
    mdoPage <- elements [Nothing, Just 1, Just 2, Just 3]
    mdoSearch <- oneof [pure Nothing, Just <$> genSymbol]
    mdoSort <- elements [Nothing, Just "price", Just "change", Just "volume"]
    mdoOrder <- arbitrary
    return MarketDataOptions{..}

instance Arbitrary AssetPrice where
  arbitrary = do
    apSymbol <- genSymbol
    apName <- oneof [pure Nothing, Just <$> arbitrary]
    category <- arbitrary
    apPrice <- genPrice category
    apPriceInUSD <- oneof [pure Nothing, Just <$> genPrice category]
    apPriceInBTC <- oneof [pure Nothing, Just <$> choose (0.00001, 1.0)]
    percentChange <- genPercentChange
    let apChange = apPrice * (percentChange / 100.0)
        apChangePercent = percentChange
    apLastUpdated <- oneof [pure Nothing, Just . T.pack . show <$> arbitrary @UTCTime]
    apType <- oneof [pure Nothing, Just <$> elements ["crypto", "stock", "metal"]]
    return AssetPrice{..}

instance Arbitrary AssetData where
  arbitrary = do
    adSymbol <- genSymbol
    adName <- oneof [pure Nothing, Just <$> arbitrary]
    adCategory <- arbitrary
    adPrice <- maybe (choose (0.01, 100000.0)) genPrice adCategory
    adPriceInUSD <- oneof [pure Nothing, Just <$> maybe (choose (0.01, 100000.0)) genPrice adCategory]
    adPriceInBTC <- oneof [pure Nothing, Just <$> choose (0.00001, 1.0)]
    percentChange <- genPercentChange
    let adChange = adPrice * (percentChange / 100.0)
        adChangePercent = percentChange
    adChange24h <- oneof [pure Nothing, Just <$> genPercentChange]
    adVolume24h <- oneof [pure Nothing, Just <$> maybe (choose (1000.0, 1000000000.0)) genVolume adCategory]
    adMarketCap <- oneof [pure Nothing, Just <$> choose (1000000.0, 1000000000000.0)]
    adLastUpdated <- oneof [pure Nothing, Just . T.pack . show <$> arbitrary @UTCTime]
    return AssetData{..}

instance Arbitrary MarketAsset where
  arbitrary = do
    maSymbol <- genSymbol
    maName <- arbitrary
    maCategory <- arbitrary
    maPrice <- maybe (choose (0.01, 100000.0)) genPrice maCategory
    maPriceInUSD <- oneof [pure Nothing, Just <$> maybe (choose (0.01, 100000.0)) genPrice maCategory]
    maPriceInBTC <- oneof [pure Nothing, Just <$> choose (0.00001, 1.0)]
    percentChange <- genPercentChange
    let maChange = maPrice * (percentChange / 100.0)
        maChangePercent = percentChange
    maChange24h <- oneof [pure Nothing, Just <$> genPercentChange]
    maVolume24h <- oneof [pure Nothing, Just <$> maybe (choose (1000.0, 1000000000.0)) genVolume maCategory]
    maMarketCap <- oneof [pure Nothing, Just <$> choose (1000000.0, 1000000000000.0)]
    maType <- oneof [pure Nothing, Just <$> elements ["crypto", "stock", "metal"]]
    maLastUpdated <- T.pack . show <$> arbitrary @UTCTime
    return MarketAsset{..}

instance Arbitrary MarketData where
  arbitrary = do
    mdLimit <- elements [10, 20, 50, 100]
    mdPage <- elements [1, 2, 3]
    mdTotal <- choose (100, 10000)
    numAssets <- choose (1, min mdLimit 20)
    mdAssets <- vectorOf numAssets arbitrary
    return MarketData{..}

instance Arbitrary MarketOverview where
  arbitrary = do
    moTotalMarketCap <- choose (1000000000.0, 10000000000000.0)
    moTotalVolume <- choose (10000000.0, 1000000000000.0)
    moTotalAssets <- choose (100, 10000)
    moTopMovers <- vectorOf 10 arbitrary
    moRecentlyAdded <- vectorOf 5 arbitrary
    return MarketOverview{..}

instance Arbitrary WatchlistItem where
  arbitrary = do
    wiAssetSymbol <- genSymbol
    wiAssetType <- elements ["crypto", "stock", "metal"]
    wiDateAdded <- T.pack . show <$> arbitrary @UTCTime
    return WatchlistItem{..}

instance Arbitrary HistoricalDataPoint where
  arbitrary = do
    hdpTimestamp <- round . utcTimeToPOSIXSeconds <$> arbitrary @UTCTime
    hdpDate <- arbitrary
    basePrice <- choose (0.01, 100000.0)
    hdpPrice <- basePrice <$ pure ()
    hdpValue <- basePrice <$ pure ()
    variation <- choose (0.95, 1.05)
    hdpOpen <- pure $ basePrice * variation
    hdpHigh <- pure $ basePrice * (variation + 0.05)
    hdpLow <- pure $ basePrice * (variation - 0.05)
    hdpClose <- pure $ basePrice * choose (0.98, 1.02)
    hdpVolume <- choose (1000.0, 1000000000.0)
    return HistoricalDataPoint{..}

instance Arbitrary UTCTime where
  arbitrary = do
    -- Generate times within the last year
    daysAgo <- choose (0, 365)
    let seconds = daysAgo * 24 * 60 * 60
    currentTime <- pure $ UTCTime (fromGregorian 2024 1 1) 0
    return $ addUTCTime (negate seconds) currentTime

-- Test Fixtures
-- =============

-- Sample valid assets
sampleBitcoin :: AssetData
sampleBitcoin = AssetData
  { adSymbol = "BTC"
  , adName = Just "Bitcoin"
  , adPrice = 50000.0
  , adPriceInUSD = Just 50000.0
  , adPriceInBTC = Just 1.0
  , adChange = 2500.0
  , adChangePercent = 5.0
  , adChange24h = Just 5.0
  , adVolume24h = Just 25000000000.0
  , adMarketCap = Just 1000000000000.0
  , adCategory = Just Crypto
  , adLastUpdated = Just "2024-01-01T00:00:00Z"
  }

sampleApple :: AssetData
sampleApple = AssetData
  { adSymbol = "AAPL"
  , adName = Just "Apple Inc."
  , adPrice = 180.0
  , adPriceInUSD = Just 180.0
  , adPriceInBTC = Just 0.0036
  , adChange = 2.5
  , adChangePercent = 1.4
  , adChange24h = Just 1.4
  , adVolume24h = Just 75000000.0
  , adMarketCap = Just 3000000000000.0
  , adCategory = Just Stock
  , adLastUpdated = Just "2024-01-01T00:00:00Z"
  }

sampleGold :: AssetData
sampleGold = AssetData
  { adSymbol = "GOLD"
  , adName = Just "Gold"
  , adPrice = 2050.0
  , adPriceInUSD = Just 2050.0
  , adPriceInBTC = Just 0.041
  , adChange = 10.0
  , adChangePercent = 0.49
  , adChange24h = Just 0.49
  , adVolume24h = Just 150000000.0
  , adMarketCap = Just 13000000000000.0
  , adCategory = Just Metal
  , adLastUpdated = Just "2024-01-01T00:00:00Z"
  }

-- Mock Data Generators
-- ====================

-- Generate mock market data
generateMockMarketData :: Int -> MarketData
generateMockMarketData limit = MarketData
  { mdAssets = take limit mockAssets
  , mdTotal = length mockAssets
  , mdPage = 1
  , mdLimit = limit
  }
  where
    mockAssets = 
      [ assetDataToMarketAsset sampleBitcoin
      , assetDataToMarketAsset sampleApple
      , assetDataToMarketAsset sampleGold
      ] ++ map generateRandomAsset [1..97]

    generateRandomAsset n = MarketAsset
      { maSymbol = "TEST" <> T.pack (show n)
      , maName = "Test Asset " <> T.pack (show n)
      , maPrice = fromIntegral n * 10.0
      , maPriceInUSD = Just $ fromIntegral n * 10.0
      , maPriceInBTC = Just $ fromIntegral n * 0.0002
      , maChange = fromIntegral (n `mod` 10) - 5.0
      , maChangePercent = (fromIntegral (n `mod` 10) - 5.0) / 100.0
      , maChange24h = Just $ fromIntegral (n `mod` 10) - 5.0
      , maVolume24h = Just $ fromIntegral n * 1000000.0
      , maMarketCap = Just $ fromIntegral n * 100000000.0
      , maCategory = Just $ case n `mod` 3 of
          0 -> Crypto
          1 -> Stock
          _ -> Metal
      , maType = Just $ case n `mod` 3 of
          0 -> "crypto"
          1 -> "stock"
          _ -> "metal"
      , maLastUpdated = "2024-01-01T00:00:00Z"
      }

-- Convert AssetData to MarketAsset
assetDataToMarketAsset :: AssetData -> MarketAsset
assetDataToMarketAsset AssetData{..} = MarketAsset
  { maSymbol = adSymbol
  , maName = fromMaybe adSymbol adName
  , maPrice = adPrice
  , maPriceInUSD = adPriceInUSD
  , maPriceInBTC = adPriceInBTC
  , maChange = adChange
  , maChangePercent = adChangePercent
  , maChange24h = adChange24h
  , maVolume24h = adVolume24h
  , maMarketCap = adMarketCap
  , maCategory = adCategory
  , maType = categoryToType <$> adCategory
  , maLastUpdated = fromMaybe "2024-01-01T00:00:00Z" adLastUpdated
  }
  where
    categoryToType Crypto = "crypto"
    categoryToType Stock = "stock"
    categoryToType Metal = "metal"

-- Generate mock historical data
generateMockHistoricalData :: Text -> Int -> [HistoricalDataPoint]
generateMockHistoricalData symbol days = 
  [ generateDataPoint i | i <- [0..days-1] ]
  where
    basePrice = case symbol of
      "BTC" -> 50000.0
      "AAPL" -> 180.0
      "GOLD" -> 2050.0
      _ -> 100.0
    
    generateDataPoint dayOffset = 
      let timestamp = round $ utcTimeToPOSIXSeconds $ 
                     addUTCTime (fromIntegral $ -dayOffset * 86400) baseTime
          date = addUTCTime (fromIntegral $ -dayOffset * 86400) baseTime
          variation = sin (fromIntegral dayOffset / 10.0) * 0.05 + 1.0
          price = basePrice * variation
      in HistoricalDataPoint
         { hdpTimestamp = timestamp
         , hdpDate = date
         , hdpPrice = price
         , hdpValue = price
         , hdpOpen = price * 0.99
         , hdpHigh = price * 1.02
         , hdpLow = price * 0.98
         , hdpClose = price * 1.01
         , hdpVolume = 1000000.0 * variation
         }
    
    baseTime = UTCTime (fromGregorian 2024 1 1) 0

-- Test Server Helpers
-- ===================

-- Create a test cache
createTestCache :: IO (TVar (Map.Map Text Value))
createTestCache = atomically $ newTVar Map.empty

-- JSON Response Helpers
-- =====================

shouldReturnJSON :: (ToJSON a, FromJSON a, Eq a, Show a) => 
                    SResponse -> a -> Expectation
shouldReturnJSON response expected = do
  simpleBody response `shouldBe` encode expected
  let decoded = decode (simpleBody response)
  decoded `shouldBe` Just expected

-- Validation Test Helpers
-- =======================

-- Property: All generated assets should have valid categories
prop_validAssetCategories :: AssetData -> Bool
prop_validAssetCategories AssetData{..} =
  case adCategory of
    Nothing -> True
    Just cat -> cat `elem` [Metal, Stock, Crypto]

-- Property: Price changes should be consistent
prop_consistentPriceChanges :: AssetData -> Bool
prop_consistentPriceChanges AssetData{..} =
  abs (adChangePercent - (adChange / adPrice * 100.0)) < 0.01

-- Property: All prices should be positive
prop_positivePrices :: AssetData -> Bool
prop_positivePrices AssetData{..} =
  adPrice > 0 &&
  maybe True (> 0) adPriceInUSD &&
  maybe True (> 0) adPriceInBTC &&
  maybe True (>= 0) adVolume24h &&
  maybe True (>= 0) adMarketCap

-- Test Environment Setup
-- ======================

data TestEnv = TestEnv
  { testManager :: Manager
  , testBaseUrl :: BaseUrl
  , testCache :: TVar (Map.Map Text Value)
  }

setupTestEnv :: IO TestEnv
setupTestEnv = do
  testManager <- newManager defaultManagerSettings
  let testBaseUrl = BaseUrl Http "localhost" 8080 ""
  testCache <- createTestCache
  return TestEnv{..}

-- Common Test Patterns
-- ====================

-- Test that an endpoint returns valid JSON
testJSONEndpoint :: (FromJSON a, ToJSON a, Eq a, Show a) => 
                    String -> IO SResponse -> a -> Spec
testJSONEndpoint description getResponse expected =
  it description $ do
    response <- getResponse
    response `shouldReturnJSON` expected

-- Test that an endpoint handles errors correctly
testErrorHandling :: String -> IO SResponse -> Int -> Text -> Spec
testErrorHandling description getResponse statusCode errorMsg =
  it description $ do
    response <- getResponse
    simpleStatus response `shouldBe` mkStatus statusCode (T.unpack errorMsg)

-- Time Helpers
-- ============

-- Get current time as formatted string
getCurrentTimeString :: IO Text
getCurrentTimeString = do
  now <- getCurrentTime
  return $ T.pack $ formatTime defaultTimeLocale "%Y-%m-%dT%H:%M:%SZ" now

-- Add test delay to ensure different timestamps
testDelay :: IO ()
testDelay = threadDelay 1000 -- 1ms delay

-- Thread delay import (add at top if not present)
import Control.Concurrent (threadDelay)

-- HTTP Status helpers (add at top with imports)
import Network.HTTP.Types.Status (mkStatus)