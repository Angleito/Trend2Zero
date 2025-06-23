{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

module TypesSpec (spec) where

import Test.Hspec
import Test.QuickCheck
import Test.QuickCheck.Instances.Text ()
import Data.Aeson
import Types
import TestHelpers
import Data.Text (Text)
import qualified Data.Text as T
import Data.Maybe (isJust, isNothing)

spec :: Spec
spec = do
  describe "AssetCategory" $ do
    it "serializes to JSON correctly" $ do
      encode Metal `shouldBe` "\"metal\""
      encode Stock `shouldBe` "\"stocks\""
      encode Crypto `shouldBe` "\"crypto\""
    
    it "deserializes from JSON correctly" $ do
      decode "\"metal\"" `shouldBe` Just Metal
      decode "\"stocks\"" `shouldBe` Just Stock
      decode "\"crypto\"" `shouldBe` Just Crypto
      decode "\"invalid\"" `shouldBe` (Nothing :: Maybe AssetCategory)
    
    it "round-trips through JSON" $ property prop_assetCategoryRoundTrip
  
  describe "OrderDirection" $ do
    it "serializes to JSON correctly" $ do
      encode Asc `shouldBe` "\"asc\""
      encode Desc `shouldBe` "\"desc\""
    
    it "deserializes from JSON correctly" $ do
      decode "\"asc\"" `shouldBe` Just Asc
      decode "\"desc\"" `shouldBe` Just Desc
      decode "\"invalid\"" `shouldBe` (Nothing :: Maybe OrderDirection)
    
    it "round-trips through JSON" $ property prop_orderDirectionRoundTrip
  
  describe "parseAssetCategory" $ do
    it "parses valid categories" $ do
      parseAssetCategory (Just "crypto") `shouldBe` Just Crypto
      parseAssetCategory (Just "cryptocurrency") `shouldBe` Just Crypto
      parseAssetCategory (Just "stocks") `shouldBe` Just Stock
      parseAssetCategory (Just "stock") `shouldBe` Just Stock
      parseAssetCategory (Just "metal") `shouldBe` Just Metal
      parseAssetCategory (Just "metals") `shouldBe` Just Metal
    
    it "returns Nothing for invalid categories" $ do
      parseAssetCategory Nothing `shouldBe` Nothing
      parseAssetCategory (Just "invalid") `shouldBe` Nothing
      parseAssetCategory (Just "") `shouldBe` Nothing
    
    it "is consistent with validateAssetCategory" $ 
      property prop_parseAssetCategoryConsistent
  
  describe "validateAssetCategory" $ do
    it "validates correct categories" $ do
      validateAssetCategory "metal" `shouldBe` Right Metal
      validateAssetCategory "metals" `shouldBe` Right Metal
      validateAssetCategory "stocks" `shouldBe` Right Stock
      validateAssetCategory "stock" `shouldBe` Right Stock
      validateAssetCategory "crypto" `shouldBe` Right Crypto
      validateAssetCategory "cryptocurrency" `shouldBe` Right Crypto
    
    it "returns Left for invalid categories" $ do
      case validateAssetCategory "invalid" of
        Left err -> err `shouldBe` "Invalid asset category: invalid"
        Right _ -> expectationFailure "Expected Left but got Right"
    
    it "handles edge cases" $ property prop_validateAssetCategoryEdgeCases
  
  describe "isValidAssetCategory" $ do
    it "validates correct categories" $ do
      isValidAssetCategory "metal" `shouldBe` True
      isValidAssetCategory "stocks" `shouldBe` True
      isValidAssetCategory "crypto" `shouldBe` True
    
    it "rejects invalid categories" $ do
      isValidAssetCategory "invalid" `shouldBe` False
      isValidAssetCategory "" `shouldBe` False
      isValidAssetCategory "CRYPTO" `shouldBe` False
  
  describe "createDefaultAsset" $ do
    it "creates an asset with default values" $ do
      let asset = createDefaultAsset "BTC"
      adSymbol asset `shouldBe` "BTC"
      adName asset `shouldBe` Just "BTC"
      adPrice asset `shouldBe` 0
      adChange asset `shouldBe` 0
      adChangePercent asset `shouldBe` 0
      adCategory asset `shouldBe` Nothing
    
    it "creates valid assets for any symbol" $ 
      property prop_createDefaultAssetValid
  
  describe "AssetPrice" $ do
    it "serializes to JSON with correct field names" $ do
      let price = AssetPrice "BTC" (Just "Bitcoin") 50000 Nothing Nothing 1000 2.0 Nothing Nothing
      let json = encode price
      json `shouldContain` "\"symbol\":\"BTC\""
      json `shouldContain` "\"price\":50000"
      json `shouldContain` "\"change_percent\":2"
    
    it "round-trips through JSON" $ property prop_assetPriceRoundTrip
    
    it "handles missing optional fields" $ do
      let minimal = object ["symbol" .= ("BTC" :: Text), "price" .= (100 :: Double), 
                           "change" .= (5 :: Double), "change_percent" .= (5 :: Double)]
      case decode (encode minimal) :: Maybe AssetPrice of
        Just price -> do
          apSymbol price `shouldBe` "BTC"
          apPrice price `shouldBe` 100
          apName price `shouldBe` Nothing
        Nothing -> expectationFailure "Failed to decode minimal AssetPrice"
  
  describe "AssetData" $ do
    it "maintains price consistency" $ property prop_assetDataPriceConsistency
    
    it "round-trips through JSON" $ property prop_assetDataRoundTrip
    
    it "validates all generated assets" $ property prop_validAssetCategories
    
    it "has positive prices" $ property prop_positivePrices
  
  describe "MarketAsset" $ do
    it "round-trips through JSON" $ property prop_marketAssetRoundTrip
    
    it "converts from AssetData correctly" $ do
      let marketAsset = assetDataToMarketAsset sampleBitcoin
      maSymbol marketAsset `shouldBe` "BTC"
      maName marketAsset `shouldBe` "Bitcoin"
      maPrice marketAsset `shouldBe` 50000.0
      maCategory marketAsset `shouldBe` Just Crypto
  
  describe "MarketData" $ do
    it "creates valid market data" $ do
      let marketData = generateMockMarketData 10
      length (mdAssets marketData) `shouldBe` 10
      mdLimit marketData `shouldBe` 10
      mdTotal marketData `shouldSatisfy` (>= 10)
    
    it "round-trips through JSON" $ property prop_marketDataRoundTrip
    
    it "respects pagination limits" $ property prop_marketDataPagination
  
  describe "HistoricalDataPoint" $ do
    it "generates valid historical data" $ do
      let history = generateMockHistoricalData "BTC" 7
      length history `shouldBe` 7
      all (\h -> hdpPrice h > 0) history `shouldBe` True
    
    it "round-trips through JSON" $ property prop_historicalDataRoundTrip
    
    it "maintains price relationships" $ property prop_historicalDataPriceRelationships
  
  describe "normalizeHistoricalDataPoint" $ do
    it "handles object format" $ do
      let json = object ["timestamp" .= (1234567890 :: Integer), "price" .= (100.5 :: Double)]
      case normalizeHistoricalDataPoint json of
        Right hdp -> do
          hdpTimestamp hdp `shouldBe` 1234567890
          hdpPrice hdp `shouldBe` 100.5
        Left err -> expectationFailure $ "Failed to normalize: " ++ T.unpack err
    
    it "handles array format" $ do
      let json = Array $ fromList [Number 1234567890, Number 100.5]
      case normalizeHistoricalDataPoint json of
        Right hdp -> do
          hdpTimestamp hdp `shouldBe` 1234567890
          hdpPrice hdp `shouldBe` 100.5
        Left err -> expectationFailure $ "Failed to normalize: " ++ T.unpack err
    
    it "rejects invalid formats" $ do
      let json = String "invalid"
      case normalizeHistoricalDataPoint json of
        Left _ -> return ()
        Right _ -> expectationFailure "Expected failure for invalid format"

-- Additional imports needed for the specs
import Data.Vector (fromList)

-- Property-based test definitions
prop_assetCategoryRoundTrip :: AssetCategory -> Bool
prop_assetCategoryRoundTrip cat = 
  decode (encode cat) == Just cat

prop_orderDirectionRoundTrip :: OrderDirection -> Bool
prop_orderDirectionRoundTrip dir =
  decode (encode dir) == Just dir

prop_parseAssetCategoryConsistent :: Text -> Bool
prop_parseAssetCategoryConsistent t =
  case validateAssetCategory t of
    Right cat -> parseAssetCategory (Just t) == Just cat
    Left _ -> isNothing (parseAssetCategory (Just t))

prop_validateAssetCategoryEdgeCases :: Text -> Property
prop_validateAssetCategoryEdgeCases t =
  T.length t > 0 ==> 
    case validateAssetCategory t of
      Right _ -> t `elem` ["metal", "metals", "stock", "stocks", "crypto", "cryptocurrency"]
      Left err -> T.isInfixOf "Invalid asset category:" err

prop_createDefaultAssetValid :: Text -> Property
prop_createDefaultAssetValid symbol =
  T.length symbol > 0 ==>
    let asset = createDefaultAsset symbol
    in adSymbol asset == symbol &&
       adName asset == Just symbol &&
       adPrice asset == 0 &&
       isNothing (adCategory asset)

prop_assetPriceRoundTrip :: AssetPrice -> Bool
prop_assetPriceRoundTrip price =
  decode (encode price) == Just price

prop_assetDataPriceConsistency :: AssetData -> Property
prop_assetDataPriceConsistency asset =
  adPrice asset > 0 ==>
    let expectedChangePercent = (adChange asset / adPrice asset) * 100
        tolerance = 0.01
    in abs (adChangePercent asset - expectedChangePercent) < tolerance

prop_assetDataRoundTrip :: AssetData -> Bool
prop_assetDataRoundTrip asset =
  decode (encode asset) == Just asset

prop_marketAssetRoundTrip :: MarketAsset -> Bool
prop_marketAssetRoundTrip asset =
  decode (encode asset) == Just asset

prop_marketDataRoundTrip :: MarketData -> Bool
prop_marketDataRoundTrip marketData =
  decode (encode marketData) == Just marketData

prop_marketDataPagination :: MarketData -> Bool
prop_marketDataPagination marketData =
  length (mdAssets marketData) <= mdLimit marketData

prop_historicalDataRoundTrip :: HistoricalDataPoint -> Bool
prop_historicalDataRoundTrip hdp =
  decode (encode hdp) == Just hdp

prop_historicalDataPriceRelationships :: HistoricalDataPoint -> Bool
prop_historicalDataPriceRelationships hdp =
  hdpLow hdp <= hdpOpen hdp &&
  hdpLow hdp <= hdpClose hdp &&
  hdpHigh hdp >= hdpOpen hdp &&
  hdpHigh hdp >= hdpClose hdp &&
  hdpLow hdp <= hdpHigh hdp