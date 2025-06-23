{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE DataKinds #-}

module APISpec (spec) where

import Test.Hspec
import Test.QuickCheck
import Network.Wai
import Network.Wai.Test
import Servant
import Data.Aeson
import qualified Data.ByteString.Lazy as LBS
import qualified Data.Text as T
import Types
import TestHelpers
import Server (app)
import Data.Maybe (fromMaybe)
import Control.Monad (forM_)

spec :: Spec
spec = with (return app) $ do
  
  describe "Health API" $ do
    it "GET /health returns 200 OK" $ do
      get "/health" `shouldRespondWith` 200
    
    it "GET /health returns correct JSON structure" $ do
      response <- get "/health"
      let body = simpleBody response
      case decode body of
        Just (obj :: Object) -> do
          case parseMaybe (.: "status") obj of
            Just (status :: String) -> status `shouldBe` "ok"
            Nothing -> expectationFailure "Missing status field"
        Nothing -> expectationFailure "Invalid JSON response"
  
  describe "Crypto API" $ do
    it "GET /crypto/bitcoin-price returns 200 OK" $ do
      get "/crypto/bitcoin-price" `shouldRespondWith` 200
    
    it "GET /crypto/bitcoin-price returns valid AssetPrice" $ do
      response <- get "/crypto/bitcoin-price"
      let body = simpleBody response
      case decode body :: Maybe AssetPrice of
        Just price -> do
          apSymbol price `shouldBe` "BTC"
          apPrice price `shouldSatisfy` (> 0)
        Nothing -> expectationFailure "Failed to decode AssetPrice"
  
  describe "Market Data API - Overview" $ do
    it "GET /market-data/overview returns 200 OK" $ do
      get "/market-data/overview" `shouldRespondWith` 200
    
    it "GET /market-data/overview returns valid MarketOverview" $ do
      response <- get "/market-data/overview"
      let body = simpleBody response
      case decode body :: Maybe MarketOverview of
        Just overview -> do
          moTotalMarketCap overview `shouldSatisfy` (> 0)
          moTotalVolume overview `shouldSatisfy` (> 0)
          moTotalAssets overview `shouldSatisfy` (> 0)
          length (moTopMovers overview) `shouldSatisfy` (> 0)
        Nothing -> expectationFailure "Failed to decode MarketOverview"
  
  describe "Market Data API - Asset Price" $ do
    forM_ ["BTC", "ETH", "AAPL", "GOLD"] $ \symbol -> do
      it ("GET /market-data/price/" ++ T.unpack symbol ++ " returns valid price") $ do
        response <- get ("/market-data/price/" <> symbol)
        simpleStatus response `shouldBe` status200
        
        let body = simpleBody response
        case decode body :: Maybe AssetPrice of
          Just price -> do
            apSymbol price `shouldBe` symbol
            apPrice price `shouldSatisfy` (> 0)
          Nothing -> expectationFailure $ "Failed to decode AssetPrice for " ++ T.unpack symbol
    
    it "GET /market-data/price/INVALID returns 404" $ do
      get "/market-data/price/INVALID" `shouldRespondWith` 404
  
  describe "Market Data API - Search" $ do
    it "GET /market-data/search?q=bitcoin returns results" $ do
      response <- get "/market-data/search?q=bitcoin"
      simpleStatus response `shouldBe` status200
      
      let body = simpleBody response
      case decode body :: Maybe [MarketAsset] of
        Just assets -> do
          length assets `shouldSatisfy` (> 0)
          all (\a -> T.toLower (maSymbol a) `T.isInfixOf` "btc" || 
                     maybe False (T.toLower >>> (`T.isInfixOf` "bitcoin")) (Just $ maName a)) 
            assets `shouldBe` True
        Nothing -> expectationFailure "Failed to decode search results"
    
    it "GET /market-data/search?q=gold&limit=5 respects limit" $ do
      response <- get "/market-data/search?q=gold&limit=5"
      simpleStatus response `shouldBe` status200
      
      let body = simpleBody response
      case decode body :: Maybe [MarketAsset] of
        Just assets -> length assets `shouldSatisfy` (<= 5)
        Nothing -> expectationFailure "Failed to decode search results"
    
    it "GET /market-data/search without query returns 400" $ do
      get "/market-data/search" `shouldRespondWith` 400
  
  describe "Market Data API - Asset Details" $ do
    it "GET /market-data/asset/BTC returns detailed info" $ do
      response <- get "/market-data/asset/BTC"
      simpleStatus response `shouldBe` status200
      
      let body = simpleBody response
      case decode body :: Maybe MarketAsset of
        Just asset -> do
          maSymbol asset `shouldBe` "BTC"
          maName asset `shouldSatisfy` (T.isInfixOf "Bitcoin" . T.pack)
          maMarketCap asset `shouldSatisfy` maybe False (> 0)
          maVolume24h asset `shouldSatisfy` maybe False (> 0)
        Nothing -> expectationFailure "Failed to decode MarketAsset"
    
    it "GET /market-data/asset/NONEXISTENT returns 404" $ do
      get "/market-data/asset/NONEXISTENT" `shouldRespondWith` 404
  
  describe "Market Data API - Popular Assets" $ do
    it "GET /market-data/popular returns trending assets" $ do
      response <- get "/market-data/popular"
      simpleStatus response `shouldBe` status200
      
      let body = simpleBody response
      case decode body :: Maybe [MarketAsset] of
        Just assets -> do
          length assets `shouldSatisfy` (> 0)
          -- Popular assets should have volume
          all (\a -> maybe False (> 0) (maVolume24h a)) assets `shouldBe` True
        Nothing -> expectationFailure "Failed to decode popular assets"
  
  describe "Market Data API - All Assets" $ do
    it "GET /market-data/assets returns paginated data" $ do
      response <- get "/market-data/assets"
      simpleStatus response `shouldBe` status200
      
      let body = simpleBody response
      case decode body :: Maybe MarketData of
        Just marketData -> do
          mdTotal marketData `shouldSatisfy` (> 0)
          mdLimit marketData `shouldSatisfy` (> 0)
          mdPage marketData `shouldBe` 1
          length (mdAssets marketData) `shouldSatisfy` (<= mdLimit marketData)
        Nothing -> expectationFailure "Failed to decode MarketData"
    
    it "GET /market-data/assets?page=2&limit=20 handles pagination" $ do
      response <- get "/market-data/assets?page=2&limit=20"
      simpleStatus response `shouldBe` status200
      
      let body = simpleBody response
      case decode body :: Maybe MarketData of
        Just marketData -> do
          mdPage marketData `shouldBe` 2
          mdLimit marketData `shouldBe` 20
          length (mdAssets marketData) `shouldSatisfy` (<= 20)
        Nothing -> expectationFailure "Failed to decode MarketData"
  
  describe "Market Data API - Historical Data" $ do
    it "GET /market-data/historical/BTC returns time series data" $ do
      response <- get "/market-data/historical/BTC"
      simpleStatus response `shouldBe` status200
      
      let body = simpleBody response
      case decode body :: Maybe [HistoricalDataPoint] of
        Just dataPoints -> do
          length dataPoints `shouldSatisfy` (> 0)
          -- Check data points are in chronological order
          let timestamps = map hdpTimestamp dataPoints
          timestamps `shouldBe` reverse (sort timestamps)
          -- All prices should be positive
          all (\dp -> hdpPrice dp > 0) dataPoints `shouldBe` True
        Nothing -> expectationFailure "Failed to decode historical data"
    
    it "GET /market-data/historical/BTC?period=7d returns week of data" $ do
      response <- get "/market-data/historical/BTC?period=7d"
      simpleStatus response `shouldBe` status200
      
      let body = simpleBody response
      case decode body :: Maybe [HistoricalDataPoint] of
        Just dataPoints -> do
          -- Should have approximately 7 days of data
          length dataPoints `shouldSatisfy` (\n -> n >= 7 && n <= 8)
        Nothing -> expectationFailure "Failed to decode historical data"
  
  describe "Error Handling" $ do
    it "GET /nonexistent returns 404" $ do
      get "/nonexistent" `shouldRespondWith` 404
    
    it "POST to GET-only endpoint returns 405" $ do
      post "/health" "" `shouldRespondWith` 405
  
  describe "CORS Headers" $ do
    it "includes CORS headers in responses" $ do
      response <- get "/health"
      simpleHeaders response `shouldContain` [("Access-Control-Allow-Origin", "*")]
  
  describe "Content Type" $ do
    it "returns application/json content type" $ do
      response <- get "/health"
      simpleHeaders response `shouldContain` [("Content-Type", "application/json;charset=utf-8")]

-- Property-based tests for API responses
describe "Property-based API tests" $ do
  
  it "all asset prices have consistent change calculations" $ 
    property $ \(symbol :: Text) -> do
      when (T.length symbol > 0 && T.length symbol < 10) $ do
        response <- get ("/market-data/price/" <> symbol)
        when (simpleStatus response == status200) $ do
          let body = simpleBody response
          case decode body :: Maybe AssetPrice of
            Just price -> 
              prop_consistentPriceChanges (assetPriceToAssetData price) `shouldBe` True
            Nothing -> return ()
  
  it "search results are relevant to query" $
    property $ \(query :: Text) -> do
      when (T.length query > 2 && T.length query < 20) $ do
        response <- get ("/market-data/search?q=" <> query)
        when (simpleStatus response == status200) $ do
          let body = simpleBody response
          case decode body :: Maybe [MarketAsset] of
            Just assets ->
              all (\a -> T.toLower query `T.isInfixOf` T.toLower (maSymbol a) ||
                        T.toLower query `T.isInfixOf` T.toLower (maName a)) 
                assets `shouldBe` True
            Nothing -> return ()

-- Helper functions
import Data.List (sort)
import Control.Monad (when)
import Data.Aeson.Types (Object, parseMaybe, (.:))
import Network.HTTP.Types.Status

-- Convert AssetPrice to AssetData for property testing
assetPriceToAssetData :: AssetPrice -> AssetData
assetPriceToAssetData AssetPrice{..} = AssetData
  { adSymbol = apSymbol
  , adName = apName
  , adPrice = apPrice
  , adPriceInUSD = apPriceInUSD
  , adPriceInBTC = apPriceInBTC
  , adChange = apChange
  , adChangePercent = apChangePercent
  , adChange24h = Nothing
  , adVolume24h = Nothing
  , adMarketCap = Nothing
  , adCategory = Nothing
  , adLastUpdated = apLastUpdated
  }