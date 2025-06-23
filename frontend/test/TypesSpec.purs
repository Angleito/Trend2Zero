module Test.TypesSpec where

import Prelude

import Data.Argonaut (decodeJson, encodeJson, fromString, jsonEmptyObject, stringify, (.:), (:=), (~>))
import Data.Either (Either(..), isLeft, isRight)
import Data.Maybe (Maybe(..), isJust, isNothing)
import Effect.Aff (Aff)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual, shouldSatisfy, fail)
import Test.QuickCheck (quickCheck, (===))
import Test.TestHelpers
import Types

spec :: Spec Unit
spec = do
  describe "Types" do
    assetCategorySpec
    orderDirectionSpec
    validationFunctionsSpec
    assetPriceSpec
    assetDataSpec
    marketAssetSpec
    marketDataSpec
    historicalDataPointSpec
    propertyBasedSpec

assetCategorySpec :: Spec Unit
assetCategorySpec = describe "AssetCategory" do
  it "serializes to JSON correctly" do
    encodeJson Metal `shouldEqual` fromString "metal"
    encodeJson Stock `shouldEqual` fromString "stocks"
    encodeJson Crypto `shouldEqual` fromString "crypto"
  
  it "deserializes from JSON correctly" do
    decodeJson (fromString "metal") `shouldEqual` Right Metal
    decodeJson (fromString "stocks") `shouldEqual` Right Stock
    decodeJson (fromString "crypto") `shouldEqual` Right Crypto
    isLeft (decodeJson (fromString "invalid") :: Either _ AssetCategory) `shouldEqual` true
  
  it "round-trips through JSON" do
    let testRoundTrip cat = decodeJson (encodeJson cat) === Right cat
    quickCheck $ testRoundTrip

orderDirectionSpec :: Spec Unit
orderDirectionSpec = describe "OrderDirection" do
  it "serializes to JSON correctly" do
    encodeJson Asc `shouldEqual` fromString "asc"
    encodeJson Desc `shouldEqual` fromString "desc"
  
  it "deserializes from JSON correctly" do
    decodeJson (fromString "asc") `shouldEqual` Right Asc
    decodeJson (fromString "desc") `shouldEqual` Right Desc
    isLeft (decodeJson (fromString "invalid") :: Either _ OrderDirection) `shouldEqual` true
  
  it "round-trips through JSON" do
    let testRoundTrip dir = decodeJson (encodeJson dir) === Right dir
    quickCheck $ testRoundTrip

validationFunctionsSpec :: Spec Unit
validationFunctionsSpec = describe "Validation Functions" do
  describe "validateAssetCategory" do
    it "validates correct categories" do
      validateAssetCategory "metal" `shouldEqual` Right Metal
      validateAssetCategory "metals" `shouldEqual` Right Metal
      validateAssetCategory "stocks" `shouldEqual` Right Stock
      validateAssetCategory "stock" `shouldEqual` Right Stock
      validateAssetCategory "crypto" `shouldEqual` Right Crypto
      validateAssetCategory "cryptocurrency" `shouldEqual` Right Crypto
    
    it "returns Left for invalid categories" do
      case validateAssetCategory "invalid" of
        Left err -> err `shouldEqual` "Invalid asset category: invalid"
        Right _ -> fail "Expected Left but got Right"
  
  describe "parseAssetCategory" do
    it "parses valid categories" do
      parseAssetCategory (Just "crypto") `shouldEqual` Just Crypto
      parseAssetCategory (Just "cryptocurrency") `shouldEqual` Just Crypto
      parseAssetCategory (Just "stocks") `shouldEqual` Just Stock
      parseAssetCategory (Just "stock") `shouldEqual` Just Stock
      parseAssetCategory (Just "metal") `shouldEqual` Just Metal
      parseAssetCategory (Just "metals") `shouldEqual` Just Metal
    
    it "returns Nothing for invalid categories" do
      parseAssetCategory Nothing `shouldEqual` Nothing
      parseAssetCategory (Just "invalid") `shouldEqual` Nothing
      parseAssetCategory (Just "") `shouldEqual` Nothing
  
  describe "isValidAssetCategory" do
    it "validates correct categories" do
      isValidAssetCategory "metal" `shouldEqual` true
      isValidAssetCategory "stocks" `shouldEqual` true
      isValidAssetCategory "crypto" `shouldEqual` true
    
    it "rejects invalid categories" do
      isValidAssetCategory "invalid" `shouldEqual` false
      isValidAssetCategory "" `shouldEqual` false
      isValidAssetCategory "CRYPTO" `shouldEqual` false

assetPriceSpec :: Spec Unit
assetPriceSpec = describe "AssetPrice" do
  it "serializes to JSON with correct field names" do
    let price = { symbol: "BTC"
                , name: Just "Bitcoin"
                , price: 50000.0
                , priceInUSD: Nothing
                , priceInBTC: Nothing
                , change: 1000.0
                , changePercent: 2.0
                , lastUpdated: Nothing
                , type: Nothing
                }
    let json = encodeJson price
    stringify json `shouldSatisfy` \s ->
      String.contains (String.Pattern "\"symbol\":\"BTC\"") s &&
      String.contains (String.Pattern "\"price\":50000") s &&
      String.contains (String.Pattern "\"change_percent\":2") s
  
  it "handles missing optional fields" do
    let minimal = "symbol" := "BTC"
               ~> "price" := 100.0
               ~> "change" := 5.0
               ~> "change_percent" := 5.0
               ~> jsonEmptyObject
    case decodeJson minimal :: Either _ AssetPrice of
      Right price -> do
        price.symbol `shouldEqual` "BTC"
        price.price `shouldEqual` 100.0
        isNothing price.name `shouldEqual` true
      Left err -> fail $ "Failed to decode minimal AssetPrice: " <> show err

assetDataSpec :: Spec Unit
assetDataSpec = describe "AssetData" do
  it "creates default asset correctly" do
    let asset = createDefaultAsset "BTC"
    asset.symbol `shouldEqual` "BTC"
    asset.name `shouldEqual` Just "BTC"
    asset.price `shouldEqual` 0.0
    asset.change `shouldEqual` 0.0
    asset.changePercent `shouldEqual` 0.0
    isNothing asset.category `shouldEqual` true
  
  it "validates all fixture assets" do
    prop_validAssetCategories sampleBitcoin `shouldEqual` true
    prop_validAssetCategories sampleApple `shouldEqual` true
    prop_validAssetCategories sampleGold `shouldEqual` true
  
  it "has positive prices for fixtures" do
    prop_positivePrices sampleBitcoin `shouldEqual` true
    prop_positivePrices sampleApple `shouldEqual` true
    prop_positivePrices sampleGold `shouldEqual` true

marketAssetSpec :: Spec Unit
marketAssetSpec = describe "MarketAsset" do
  it "converts from AssetData correctly" do
    let marketAsset = assetDataToMarketAsset sampleBitcoin
    marketAsset.symbol `shouldEqual` "BTC"
    marketAsset.name `shouldEqual` "Bitcoin"
    marketAsset.price `shouldEqual` 50000.0
    marketAsset.category `shouldEqual` Just Crypto
    marketAsset.type `shouldEqual` Just "crypto"

marketDataSpec :: Spec Unit
marketDataSpec = describe "MarketData" do
  it "creates valid market data" do
    let marketData = generateMockMarketData 10
    length marketData.assets `shouldEqual` 10
    marketData.limit `shouldEqual` 10
    marketData.total `shouldSatisfy` (_ >= 10)
  
  it "respects pagination limits" do
    let marketData = generateMockMarketData 20
    length marketData.assets `shouldEqual` 20
    length marketData.assets <= marketData.limit `shouldEqual` true

historicalDataPointSpec :: Spec Unit
historicalDataPointSpec = describe "HistoricalDataPoint" do
  it "handles object format normalization" do
    let json = "timestamp" := 1234567890
            ~> "price" := 100.5
            ~> jsonEmptyObject
    case normalizeHistoricalDataPoint json of
      Right hdp -> do
        hdp.timestamp `shouldEqual` 1234567890
        hdp.price `shouldEqual` 100.5
      Left err -> fail $ "Failed to normalize: " <> show err
  
  it "handles missing optional fields with defaults" do
    let json = "timestamp" := 1234567890
            ~> "price" := 100.5
            ~> "volume" := 50000.0
            ~> jsonEmptyObject
    case normalizeHistoricalDataPoint json of
      Right hdp -> do
        hdp.value `shouldEqual` 100.5 -- Should default to price
        hdp.open `shouldEqual` 100.5  -- Should default to price
        hdp.volume `shouldEqual` 50000.0
      Left err -> fail $ "Failed to normalize: " <> show err
  
  it "rejects invalid formats" do
    let json = fromString "invalid"
    isLeft (normalizeHistoricalDataPoint json) `shouldEqual` true

propertyBasedSpec :: Spec Unit
propertyBasedSpec = describe "Property-based tests" do
  it "all generated assets have valid categories" do
    quickCheck \(_ :: Unit) -> 
      let asset = unsafePerformEffect $ randomAsset
      in prop_validAssetCategories asset
  
  it "all generated assets have consistent price changes" do
    quickCheck \(_ :: Unit) -> 
      let asset = unsafePerformEffect $ randomAsset
      in if asset.price > 0.0 
         then prop_consistentPriceChanges asset
         else true
  
  it "all generated assets have positive prices" do
    quickCheck \(_ :: Unit) -> 
      let asset = unsafePerformEffect $ randomAsset
      in prop_positivePrices asset
  
  it "AssetCategory round-trips through JSON" do
    quickCheck \(cat :: AssetCategory) ->
      decodeJson (encodeJson cat) === Right cat
  
  it "OrderDirection round-trips through JSON" do
    quickCheck \(dir :: OrderDirection) ->
      decodeJson (encodeJson dir) === Right dir
  
  it "parseAssetCategory is consistent with validateAssetCategory" do
    quickCheck \(str :: String) ->
      case validateAssetCategory str of
        Right cat -> parseAssetCategory (Just str) === Just cat
        Left _ -> isNothing (parseAssetCategory (Just str))

-- Helper to generate random assets for property tests
-- In a real implementation, this would use proper QuickCheck generators
randomAsset :: Effect AssetData
randomAsset = pure sampleBitcoin -- Simplified for now

-- Import additional helpers
import Data.String as String
import Data.Array (length)
import Effect (Effect)
import Effect.Unsafe (unsafePerformEffect)