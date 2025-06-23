module Test.PropertySpec where

import Prelude

import Data.Array (all, filter, length, nub, sort)
import Data.Either (Either(..), isRight)
import Data.Maybe (Maybe(..), isJust, isNothing)
import Data.String as String
import Data.Traversable (for_)
import Effect.Aff (Aff)
import Test.QuickCheck (class Arbitrary, Gen, Result, arbitrary, quickCheck, (===))
import Test.QuickCheck.Gen (arrayOf, chooseInt, elements, frequency, suchThat)
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual, shouldSatisfy)
import Test.TestHelpers
import Types

spec :: Spec Unit
spec = describe "Property-based Tests" do
  dataIntegritySpec
  transformationSpec
  validationSpec
  businessLogicSpec
  serializationSpec

dataIntegritySpec :: Spec Unit
dataIntegritySpec = describe "Data Integrity Properties" do
  it "all asset categories are valid" do
    quickCheck \(_ :: Unit) -> 
      let categories = [Metal, Stock, Crypto]
      in length categories === length (nub categories)
  
  it "asset data maintains internal consistency" do
    quickCheck $ forAll genAssetData \asset ->
      -- Price consistency
      (asset.price >= 0.0) &&
      -- Change consistency (within reasonable bounds)
      (abs asset.change <= asset.price * 10.0) &&
      -- Market cap should be positive if present
      (maybe true (_ >= 0.0) asset.marketCap) &&
      -- Volume should be positive if present
      (maybe true (_ >= 0.0) asset.volume24h)
  
  it "market data respects constraints" do
    quickCheck $ forAll genMarketData \marketData ->
      -- Assets count should not exceed limit
      (length marketData.assets <= marketData.limit) &&
      -- Page should be positive
      (marketData.page > 0) &&
      -- Total should be at least as large as current page
      (marketData.total >= length marketData.assets)
  
  it "historical data maintains OHLC relationships" do
    quickCheck $ forAll genHistoricalDataPoint \hdp ->
      -- Low <= Open, Close <= High
      (hdp.low <= hdp.open) &&
      (hdp.low <= hdp.close) &&
      (hdp.open <= hdp.high) &&
      (hdp.close <= hdp.high) &&
      -- Low <= High (always)
      (hdp.low <= hdp.high) &&
      -- Volume is non-negative
      (hdp.volume >= 0.0)

transformationSpec :: Spec Unit
transformationSpec = describe "Data Transformation Properties" do
  it "assetDataToMarketAsset preserves key fields" do
    quickCheck $ forAll genAssetData \assetData ->
      let marketAsset = assetDataToMarketAsset assetData
      in (marketAsset.symbol === assetData.symbol) &&
         (marketAsset.price === assetData.price) &&
         (marketAsset.change === assetData.change) &&
         (marketAsset.changePercent === assetData.changePercent) &&
         (marketAsset.category === assetData.category)
  
  it "category to type conversion is consistent" do
    quickCheck \(cat :: AssetCategory) ->
      let typeStr = case cat of
            Crypto -> "crypto"
            Stock -> "stock"
            Metal -> "metal"
          marketAsset = assetDataToMarketAsset 
            { symbol: "TEST"
            , name: Just "Test"
            , price: 100.0
            , priceInUSD: Just 100.0
            , priceInBTC: Nothing
            , change: 0.0
            , changePercent: 0.0
            , change24h: Nothing
            , volume24h: Nothing
            , marketCap: Nothing
            , category: Just cat
            , lastUpdated: Nothing
            }
      in marketAsset.type === Just typeStr
  
  it "price formatting preserves sign" do
    quickCheck $ forAll genPercentChange \change ->
      let formatted = formatChange change
      in if change > 0.0 
         then String.contains (String.Pattern "+") formatted
         else if change < 0.0 
              then String.contains (String.Pattern "-") formatted
              else String.contains (String.Pattern "+0.00") formatted

validationSpec :: Spec Unit
validationSpec = describe "Validation Properties" do
  it "validateAssetCategory accepts all valid inputs" do
    quickCheck $ forAll genValidCategoryString \str ->
      isRight (validateAssetCategory str)
  
  it "validateAssetCategory rejects invalid inputs" do
    quickCheck $ forAll (genInvalidString `suchThat` \s -> not (isValidAssetCategory s)) \str ->
      case validateAssetCategory str of
        Left err -> String.contains (String.Pattern "Invalid asset category:") err
        Right _ -> false
  
  it "parseAssetCategory is consistent with validateAssetCategory" do
    quickCheck $ forAll arbitrary \(str :: String) ->
      case validateAssetCategory str of
        Right cat -> parseAssetCategory (Just str) === Just cat
        Left _ -> parseAssetCategory (Just str) === Nothing
  
  it "isValidAssetCategory matches validateAssetCategory" do
    quickCheck $ forAll arbitrary \(str :: String) ->
      isValidAssetCategory str === isRight (validateAssetCategory str)

businessLogicSpec :: Spec Unit
businessLogicSpec = describe "Business Logic Properties" do
  it "price changes are calculated correctly" do
    quickCheck $ forAll genAssetWithPositivePrice \asset ->
      let expectedChangePercent = (asset.change / asset.price) * 100.0
          tolerance = 0.01
      in abs (asset.changePercent - expectedChangePercent) < tolerance
  
  it "market overview aggregations are consistent" do
    quickCheck $ forAll genMarketOverview \overview ->
      -- Total market cap should be positive
      (overview.totalMarketCap > 0.0) &&
      -- Total volume should be positive
      (overview.totalVolume > 0.0) &&
      -- Asset count should match movers
      (overview.totalAssets >= length overview.topMovers)
  
  it "watchlist items have valid asset types" do
    quickCheck $ forAll genWatchlistItem \item ->
      item.assetType `elem` ["crypto", "stock", "metal"]
  
  it "historical data is chronologically ordered" do
    quickCheck $ forAll (arrayOf genHistoricalDataPoint) \dataPoints ->
      let timestamps = map _.timestamp dataPoints
          sorted = sort timestamps
      in timestamps === sorted

serializationSpec :: Spec Unit  
serializationSpec = describe "Serialization Properties" do
  it "AssetCategory round-trips through JSON" do
    quickCheck \(cat :: AssetCategory) ->
      decodeJson (encodeJson cat) === Right cat
  
  it "OrderDirection round-trips through JSON" do
    quickCheck \(dir :: OrderDirection) ->
      decodeJson (encodeJson dir) === Right dir
  
  it "AssetPrice preserves all fields through JSON" do
    quickCheck $ forAll genAssetPrice \price ->
      case decodeJson (encodeJson price) of
        Right decoded -> 
          (decoded.symbol === price.symbol) &&
          (decoded.price === price.price) &&
          (decoded.change === price.change) &&
          (decoded.changePercent === price.changePercent)
        Left _ -> false
  
  it "Optional fields remain optional through JSON" do
    quickCheck $ forAll genAssetData \asset ->
      case decodeJson (encodeJson asset) of
        Right decoded ->
          -- Check that None values stay None and Some values stay Some
          (isJust asset.name === isJust decoded.name) &&
          (isJust asset.priceInUSD === isJust decoded.priceInUSD) &&
          (isJust asset.category === isJust decoded.category)
        Left _ -> false

-- Custom generators for property tests
genValidCategoryString :: Gen String
genValidCategoryString = elements 
  ["crypto", "cryptocurrency", "stock", "stocks", "metal", "metals"]

genInvalidString :: Gen String
genInvalidString = frequency
  [ { weight: 1.0, gen: pure "" }
  , { weight: 1.0, gen: pure "invalid" }
  , { weight: 1.0, gen: pure "CRYPTO" } -- Wrong case
  , { weight: 1.0, gen: arbitrary `suchThat` \s -> String.length s > 20 }
  ]

genAssetWithPositivePrice :: Gen AssetData
genAssetWithPositivePrice = genAssetData `suchThat` \a -> a.price > 0.0

genMarketData :: Gen MarketData
genMarketData = do
  limit <- chooseInt 10 100
  page <- chooseInt 1 10
  total <- chooseInt 100 1000
  numAssets <- chooseInt 0 (min limit 20)
  assets <- arrayOf numAssets (assetDataToMarketAsset <$> genAssetData)
  pure { assets, total, page, limit }

genMarketOverview :: Gen MarketOverview
genMarketOverview = do
  totalMarketCap <- (_ * 1000000000.0) <$> Int.toNumber <$> chooseInt 100 10000
  totalVolume <- (_ * 1000000.0) <$> Int.toNumber <$> chooseInt 100 10000
  totalAssets <- chooseInt 100 10000
  numMovers <- chooseInt 5 20
  topMovers <- arrayOf numMovers (assetDataToMarketAsset <$> genAssetData)
  numRecent <- chooseInt 0 10
  recentlyAdded <- arrayOf numRecent (assetDataToMarketAsset <$> genAssetData)
  pure { totalMarketCap, totalVolume, totalAssets, topMovers, recentlyAdded }

genWatchlistItem :: Gen WatchlistItem
genWatchlistItem = do
  symbol <- genSymbol
  assetType <- elements ["crypto", "stock", "metal"]
  pure { assetSymbol: symbol, assetType, dateAdded: "2024-01-01T00:00:00Z" }

genHistoricalDataPoint :: Gen HistoricalDataPoint
genHistoricalDataPoint = do
  timestamp <- chooseInt 1000000000 2000000000
  basePrice <- (_ / 100.0) <$> Int.toNumber <$> chooseInt 100 1000000
  variation <- (_ / 100.0) <$> Int.toNumber <$> chooseInt 95 105
  
  let price = basePrice
      open = basePrice * variation
      high = basePrice * (variation + 0.05)
      low = basePrice * (variation - 0.05)
      close = basePrice * (variation + 0.01)
      
  volume <- (_ * 1000.0) <$> Int.toNumber <$> chooseInt 100 1000000
  
  -- Create a dummy date (would need proper date handling in real code)
  let date = unsafePerformEffect $ do
        jsDate <- JSDate.fromTime (Int.toNumber timestamp * 1000.0)
        JSDate.toDateTime jsDate # fromMaybe (unsafePartial $ fromJust Nothing)
  
  pure { timestamp, date, price, value: price, open, high, low, close, volume }

-- Helper function for formatting
formatChange :: Number -> String
formatChange change =
  (if change >= 0.0 then "+" else "") <> toStringWith (fixed 2) change <> "%"

-- Additional imports for property tests
import Test.QuickCheck (forAll)
import Data.Number.Format (fixed, toStringWith)
import Data.Argonaut (decodeJson, encodeJson)
import Data.JSDate as JSDate
import Effect.Unsafe (unsafePerformEffect)
import Data.Int as Int
import Partial.Unsafe (unsafePartial)
import Data.Maybe (fromJust)