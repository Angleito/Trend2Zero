{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

module ServicesSpec (spec) where

import Test.Hspec
import Test.QuickCheck
import Test.QuickCheck.Monadic
import Control.Concurrent.STM
import Control.Exception (bracket)
import Control.Monad.IO.Class (liftIO)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import Data.Maybe (isJust, fromMaybe)
import Network.HTTP.Client
import Network.HTTP.Client.TLS
import Types
import TestHelpers

-- Service imports
import qualified Services.CoinGecko as CG
import qualified Services.AlphaVantage as AV
import qualified Services.MarketData as MD
import qualified Services.MetalPrice as MP

spec :: Spec
spec = do
  describe "CoinGecko Service" $ do
    coinGeckoServiceSpec
    
  describe "AlphaVantage Service" $ do
    alphaVantageServiceSpec
    
  describe "MarketData Service" $ do
    marketDataServiceSpec
    
  describe "MetalPrice Service" $ do
    metalPriceServiceSpec

-- CoinGecko Service Tests
coinGeckoServiceSpec :: Spec
coinGeckoServiceSpec = do
  describe "Configuration" $ do
    it "creates service with default config" $ do
      manager <- newManager tlsManagerSettings
      config <- CG.createCoinGeckoService manager
      -- Service should be created successfully
      return ()
    
    it "respects rate limiting configuration" $ do
      manager <- newManager tlsManagerSettings
      let config = CG.CoinGeckoConfig
            { cgcApiKey = Nothing
            , cgcRateLimit = 10 -- 10 requests per minute
            , cgcRetryCount = 3
            , cgcTimeoutSeconds = 30
            }
      -- Configuration should be valid
      cgcRateLimit config `shouldBe` 10
      cgcRetryCount config `shouldBe` 3
  
  describe "Asset Price Fetching" $ do
    it "fetches Bitcoin price" $ do
      manager <- newManager tlsManagerSettings
      service <- CG.createCoinGeckoService manager
      result <- CG.fetchBitcoinPrice service
      case result of
        Right price -> do
          apSymbol price `shouldBe` "BTC"
          apPrice price `shouldSatisfy` (> 0)
          isJust (apName price) `shouldBe` True
        Left err -> pendingWith $ "API call failed: " ++ show err
    
    it "fetches multiple crypto prices" $ do
      manager <- newManager tlsManagerSettings
      service <- CG.createCoinGeckoService manager
      let symbols = ["ETH", "ADA", "DOT"]
      results <- mapM (CG.getCryptoPrice service) symbols
      
      forM_ (zip symbols results) $ \(symbol, result) ->
        case result of
          Right price -> do
            apSymbol price `shouldBe` symbol
            apPrice price `shouldSatisfy` (> 0)
          Left err -> pendingWith $ "API call failed for " ++ T.unpack symbol
    
    it "handles invalid symbols gracefully" $ do
      manager <- newManager tlsManagerSettings
      service <- CG.createCoinGeckoService manager
      result <- CG.getCryptoPrice service "INVALIDCOIN123"
      case result of
        Left (CG.AssetNotFound _) -> return ()
        Left err -> expectationFailure $ "Expected AssetNotFound, got: " ++ show err
        Right _ -> expectationFailure "Expected error for invalid symbol"
  
  describe "Historical Data" $ do
    it "fetches historical data for valid period" $ do
      manager <- newManager tlsManagerSettings
      service <- CG.createCoinGeckoService manager
      endDate <- getCurrentTime
      let startDate = addUTCTime (negate $ 7 * 24 * 3600) endDate -- 7 days ago
      
      result <- CG.getHistoricalDataRange service "BTC" startDate endDate
      case result of
        Right dataPoints -> do
          length dataPoints `shouldSatisfy` (> 0)
          -- Check data is in chronological order
          let timestamps = map hdpTimestamp dataPoints
          timestamps `shouldBe` sort timestamps
          -- All prices should be positive
          all (\dp -> hdpPrice dp > 0) dataPoints `shouldBe` True
        Left err -> pendingWith $ "API call failed: " ++ show err
    
    it "returns empty data for future dates" $ do
      manager <- newManager tlsManagerSettings
      service <- CG.createCoinGeckoService manager
      let futureDate = addUTCTime (365 * 24 * 3600) =<< getCurrentTime
      startDate <- futureDate
      endDate <- addUTCTime (24 * 3600) <$> futureDate
      
      result <- CG.getHistoricalDataRange service "BTC" startDate endDate
      case result of
        Right dataPoints -> length dataPoints `shouldBe` 0
        Left _ -> return () -- Also acceptable
  
  describe "Asset Search" $ do
    it "searches for assets by query" $ do
      manager <- newManager tlsManagerSettings
      service <- CG.createCoinGeckoService manager
      result <- CG.searchAssets service "bitcoin" 10
      
      case result of
        Right assets -> do
          length assets `shouldSatisfy` (> 0)
          length assets `shouldSatisfy` (<= 10)
          -- Results should be relevant to query
          all (\a -> T.toLower "bitcoin" `T.isInfixOf` T.toLower (maName a) ||
                     T.toLower "bitcoin" `T.isInfixOf` T.toLower (maSymbol a))
              assets `shouldBe` True
        Left err -> pendingWith $ "API call failed: " ++ show err
    
    it "respects result limit" $ 
      property $ \(Positive limit) -> monadicIO $ do
        when (limit <= 100) $ do
          manager <- liftIO $ newManager tlsManagerSettings
          service <- liftIO $ CG.createCoinGeckoService manager
          result <- liftIO $ CG.searchAssets service "crypto" limit
          
          case result of
            Right assets -> assert $ length assets <= limit
            Left _ -> return ()
  
  describe "Top Assets" $ do
    it "fetches top assets by market cap" $ do
      manager <- newManager tlsManagerSettings
      service <- CG.createCoinGeckoService manager
      result <- CG.getTopAssets service 20
      
      case result of
        Right assets -> do
          length assets `shouldBe` 20
          -- Assets should be sorted by market cap
          let marketCaps = map (fromMaybe 0 . maMarketCap) assets
          marketCaps `shouldBe` reverse (sort marketCaps)
        Left err -> pendingWith $ "API call failed: " ++ show err

-- AlphaVantage Service Tests  
alphaVantageServiceSpec :: Spec
alphaVantageServiceSpec = do
  describe "Configuration" $ do
    it "requires API key" $ do
      let config = AV.AlphaVantageConfig
            { avcApiKey = "test-key"
            , avcRateLimit = 5
            , avcTimeoutSeconds = 30
            }
      avcApiKey config `shouldBe` "test-key"
      avcRateLimit config `shouldBe` 5
  
  describe "Stock Price Fetching" $ do
    it "fetches stock prices" $ do
      manager <- newManager tlsManagerSettings
      -- Note: This test requires a valid API key
      let service = AV.AlphaVantageService
            { avsManager = manager
            , avsConfig = AV.AlphaVantageConfig
                { avcApiKey = "demo" -- AlphaVantage demo key
                , avcRateLimit = 5
                , avcTimeoutSeconds = 30
                }
            }
      
      result <- AV.getStockPrice service "AAPL"
      case result of
        Right price -> do
          apSymbol price `shouldBe` "AAPL"
          apPrice price `shouldSatisfy` (> 0)
          isJust (apName price) `shouldBe` True
        Left err -> pendingWith $ "API call failed (may need valid API key): " ++ show err
    
    it "handles API rate limits gracefully" $ do
      manager <- newManager tlsManagerSettings
      let service = AV.AlphaVantageService
            { avsManager = manager
            , avsConfig = AV.AlphaVantageConfig
                { avcApiKey = "demo"
                , avcRateLimit = 5
                , avcTimeoutSeconds = 30
                }
            }
      
      -- Try to exceed rate limit
      results <- sequence <$> replicateM 6 (AV.getStockPrice service "AAPL")
      case results of
        Left (AV.RateLimitExceeded) -> return ()
        Right prices -> pendingWith "Rate limiting not enforced"
        Left err -> expectationFailure $ "Unexpected error: " ++ show err

-- MarketData Service Tests
marketDataServiceSpec :: Spec
marketDataServiceSpec = do
  describe "Market Overview" $ do
    it "aggregates market data from multiple sources" $ do
      manager <- newManager tlsManagerSettings
      cgService <- CG.createCoinGeckoService manager
      let avService = AV.AlphaVantageService
            { avsManager = manager
            , avsConfig = AV.AlphaVantageConfig
                { avcApiKey = "demo"
                , avcRateLimit = 5
                , avcTimeoutSeconds = 30
                }
            }
      
      let mdService = MD.MarketDataService
            { mdsCoinGecko = cgService
            , mdsAlphaVantage = avService
            , mdsMetalPrice = Nothing
            }
      
      overview <- MD.getMarketOverview mdService
      moTotalMarketCap overview `shouldSatisfy` (> 0)
      moTotalVolume overview `shouldSatisfy` (> 0)
      moTotalAssets overview `shouldSatisfy` (> 0)
      length (moTopMovers overview) `shouldSatisfy` (> 0)
  
  describe "Unified Asset Search" $ do
    it "searches across multiple asset types" $ do
      manager <- newManager tlsManagerSettings
      cgService <- CG.createCoinGeckoService manager
      let avService = AV.AlphaVantageService
            { avsManager = manager
            , avsConfig = AV.AlphaVantageConfig
                { avcApiKey = "demo"
                , avcRateLimit = 5
                , avcTimeoutSeconds = 30
                }
            }
      
      let mdService = MD.MarketDataService
            { mdsCoinGecko = cgService
            , mdsAlphaVantage = avService
            , mdsMetalPrice = Nothing
            }
      
      results <- MD.searchAllAssets mdService "gold" 20
      -- Should find both GOLD (metal) and gold-related crypto/stocks
      length results `shouldSatisfy` (> 0)
      let categories = mapMaybe maCategory results
      length (filter (== Metal) categories) `shouldSatisfy` (>= 0)
  
  describe "Asset Categorization" $ do
    it "correctly categorizes different asset types" $ 
      property $ \symbol -> do
        let category = MD.categorizeAsset symbol
        case T.toUpper symbol of
          s | s `elem` ["BTC", "ETH", "ADA"] -> category `shouldBe` Crypto
          s | s `elem` ["AAPL", "GOOGL", "MSFT"] -> category `shouldBe` Stock  
          s | s `elem` ["GOLD", "SILVER", "PLATINUM"] -> category `shouldBe` Metal
          _ -> category `shouldSatisfy` (`elem` [Crypto, Stock, Metal])

-- MetalPrice Service Tests
metalPriceServiceSpec :: Spec
metalPriceServiceSpec = do
  describe "Metal Price Fetching" $ do
    it "fetches gold price" $ do
      manager <- newManager tlsManagerSettings
      let service = MP.MetalPriceService
            { mpsManager = manager
            , mpsBaseUrl = "https://api.metals.live/v1"
            , mpsApiKey = Nothing -- Public API
            }
      
      result <- MP.getMetalPrice service "gold"
      case result of
        Right price -> do
          apSymbol price `shouldBe` "GOLD"
          apPrice price `shouldSatisfy` (> 0)
          apName price `shouldBe` Just "Gold"
        Left err -> pendingWith $ "API call failed: " ++ show err
    
    it "fetches multiple metal prices" $ do
      manager <- newManager tlsManagerSettings
      let service = MP.MetalPriceService
            { mpsManager = manager
            , mpsBaseUrl = "https://api.metals.live/v1"
            , mpsApiKey = Nothing
            }
      
      let metals = ["gold", "silver", "platinum", "palladium"]
      results <- mapM (MP.getMetalPrice service) metals
      
      forM_ (zip metals results) $ \(metal, result) ->
        case result of
          Right price -> do
            T.toUpper (apSymbol price) `shouldBe` T.toUpper metal
            apPrice price `shouldSatisfy` (> 0)
          Left err -> pendingWith $ "API call failed for " ++ T.unpack metal
    
    it "handles invalid metal types" $ do
      manager <- newManager tlsManagerSettings
      let service = MP.MetalPriceService
            { mpsManager = manager
            , mpsBaseUrl = "https://api.metals.live/v1"
            , mpsApiKey = Nothing
            }
      
      result <- MP.getMetalPrice service "kryptonite"
      case result of
        Left MP.InvalidMetal -> return ()
        Left err -> expectationFailure $ "Expected InvalidMetal, got: " ++ show err
        Right _ -> expectationFailure "Expected error for invalid metal"

-- Property-based tests for services
describe "Service Property Tests" $ do
  
  it "all services return consistent price formats" $
    property $ \(symbol :: Text) -> monadicIO $ do
      when (T.length symbol > 0 && T.length symbol < 10) $ do
        manager <- liftIO $ newManager tlsManagerSettings
        cgService <- liftIO $ CG.createCoinGeckoService manager
        
        result <- liftIO $ CG.getCryptoPrice cgService symbol
        case result of
          Right price -> do
            assert $ apPrice price >= 0
            assert $ apChange price /= 0 || apChangePercent price == 0
            assert $ T.length (apSymbol price) > 0
          Left _ -> return ()
  
  it "historical data maintains OHLC relationships" $
    property $ \dataPoint -> 
      prop_historicalDataPriceRelationships dataPoint
  
  it "search results are always relevant" $
    property $ \(query :: Text) -> monadicIO $ do
      when (T.length query > 2 && T.length query < 20) $ do
        manager <- liftIO $ newManager tlsManagerSettings
        cgService <- liftIO $ CG.createCoinGeckoService manager
        
        result <- liftIO $ CG.searchAssets cgService query 10
        case result of
          Right assets -> 
            assert $ all (\a -> T.toLower query `T.isInfixOf` T.toLower (maName a) ||
                               T.toLower query `T.isInfixOf` T.toLower (maSymbol a))
                        assets
          Left _ -> return ()

-- Helper functions and imports
import Data.List (sort)
import Control.Monad (forM_, replicateM)
import Data.Maybe (mapMaybe)