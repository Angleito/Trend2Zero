module Types where

import Prelude

import Data.Argonaut (class DecodeJson, class EncodeJson, Json, decodeJson, encodeJson, jsonEmptyObject, (.:), (.:?), (:=), (~>))
import Data.Argonaut.Decode.Error (JsonDecodeError(..))
import Data.Either (Either(..), note)
import Data.Maybe (Maybe(..), fromMaybe, maybe, fromJust)
import Data.DateTime (DateTime)
import Data.DateTime.Instant (Instant, unInstant)
import Data.Int (round, toNumber) as Int
import Data.Number (fromString) as Number
import Partial.Unsafe (unsafePartial)
import Data.JSDate as JSDate
import Effect.Unsafe (unsafePerformEffect)

-- Asset Categories as Sum Type
data AssetCategory = Metal | Stock | Crypto

derive instance eqAssetCategory :: Eq AssetCategory
derive instance ordAssetCategory :: Ord AssetCategory

instance showAssetCategory :: Show AssetCategory where
  show Metal = "Metal"
  show Stock = "Stock"
  show Crypto = "Crypto"

instance encodeJsonAssetCategory :: EncodeJson AssetCategory where
  encodeJson Metal = encodeJson "metal"
  encodeJson Stock = encodeJson "stocks"
  encodeJson Crypto = encodeJson "crypto"

instance decodeJsonAssetCategory :: DecodeJson AssetCategory where
  decodeJson json = do
    str <- decodeJson json
    case str of
      "metal" -> pure Metal
      "stocks" -> pure Stock
      "crypto" -> pure Crypto
      _ -> Left $ TypeMismatch ("Invalid asset category: " <> str)

-- Order Direction
data OrderDirection = Asc | Desc

derive instance eqOrderDirection :: Eq OrderDirection
derive instance ordOrderDirection :: Ord OrderDirection

instance showOrderDirection :: Show OrderDirection where
  show Asc = "Asc"
  show Desc = "Desc"

instance encodeJsonOrderDirection :: EncodeJson OrderDirection where
  encodeJson Asc = encodeJson "asc"
  encodeJson Desc = encodeJson "desc"

instance decodeJsonOrderDirection :: DecodeJson OrderDirection where
  decodeJson json = do
    str <- decodeJson json
    case str of
      "asc" -> pure Asc
      "desc" -> pure Desc
      _ -> Left $ TypeMismatch ("Invalid order direction: " <> str)

-- Market Data Options
type MarketDataOptions =
  { category :: Maybe AssetCategory
  , limit :: Maybe Int
  , page :: Maybe Int
  , search :: Maybe String
  , sort :: Maybe String
  , order :: Maybe OrderDirection
  }

-- Asset Price
type AssetPrice =
  { symbol :: String
  , name :: Maybe String
  , price :: Number
  , priceInUSD :: Maybe Number
  , priceInBTC :: Maybe Number
  , change :: Number
  , changePercent :: Number
  , lastUpdated :: Maybe String
  , type :: Maybe String
  }

-- Error Response
type ErrorResponse =
  { error :: String
  , status :: Maybe Int
  }

-- Historical Data Point
type HistoricalDataPoint =
  { timestamp :: Int
  , date :: DateTime
  , price :: Number
  , value :: Number
  , open :: Number
  , high :: Number
  , low :: Number
  , close :: Number
  , volume :: Number
  }

-- Asset Data
type AssetData =
  { symbol :: String
  , name :: Maybe String
  , price :: Number
  , priceInUSD :: Maybe Number
  , priceInBTC :: Maybe Number
  , change :: Number
  , changePercent :: Number
  , change24h :: Maybe Number
  , volume24h :: Maybe Number
  , marketCap :: Maybe Number
  , category :: Maybe AssetCategory
  , lastUpdated :: Maybe String
  }

-- Market Asset
type MarketAsset =
  { symbol :: String
  , name :: String
  , price :: Number
  , priceInUSD :: Maybe Number
  , priceInBTC :: Maybe Number
  , change :: Number
  , changePercent :: Number
  , change24h :: Maybe Number
  , volume24h :: Maybe Number
  , marketCap :: Maybe Number
  , category :: Maybe AssetCategory
  , type :: Maybe String
  , lastUpdated :: String
  }

-- Market Data
type MarketData =
  { assets :: Array MarketAsset
  , total :: Int
  , page :: Int
  , limit :: Int
  }

-- Market Overview
type MarketOverview =
  { totalMarketCap :: Number
  , totalVolume :: Number
  , totalAssets :: Int
  , topMovers :: Array MarketAsset
  , recentlyAdded :: Array MarketAsset
  }

-- Watchlist Item
type WatchlistItem =
  { assetSymbol :: String
  , assetType :: String
  , dateAdded :: String
  }

-- Watchlist Response
type WatchlistResponse =
  { data :: { watchlist :: Array WatchlistItem }
  }

-- JSON Encoding/Decoding instances
instance encodeJsonAssetPrice :: EncodeJson AssetPrice where
  encodeJson r = 
    "symbol" := r.symbol
    ~> "name" := r.name
    ~> "price" := r.price
    ~> "priceInUSD" := r.priceInUSD
    ~> "priceInBTC" := r.priceInBTC
    ~> "change" := r.change
    ~> "changePercent" := r.changePercent
    ~> "lastUpdated" := r.lastUpdated
    ~> "type" := r.type
    ~> jsonEmptyObject

instance decodeJsonAssetPrice :: DecodeJson AssetPrice where
  decodeJson json = do
    obj <- decodeJson json
    symbol <- obj .: "symbol"
    name <- obj .:? "name"
    price <- obj .: "price"
    priceInUSD <- obj .:? "priceInUSD"
    priceInBTC <- obj .:? "priceInBTC"
    change <- obj .: "change"
    changePercent <- obj .: "changePercent"
    lastUpdated <- obj .:? "lastUpdated"
    type_ <- obj .:? "type"
    pure { symbol, name, price, priceInUSD, priceInBTC, change, changePercent, lastUpdated, type: type_ }

-- Validation functions using Either
validateAssetCategory :: String -> Either String AssetCategory
validateAssetCategory str = case str of
  "metal" -> Right Metal
  "metals" -> Right Metal
  "stocks" -> Right Stock
  "stock" -> Right Stock  
  "crypto" -> Right Crypto
  "cryptocurrency" -> Right Crypto
  _ -> Left $ "Invalid asset category: " <> str

-- Parse asset category with Maybe
parseAssetCategory :: Maybe String -> Maybe AssetCategory
parseAssetCategory Nothing = Nothing
parseAssetCategory (Just str) = case str of
  "crypto" -> Just Crypto
  "cryptocurrency" -> Just Crypto
  "stocks" -> Just Stock
  "stock" -> Just Stock
  "metals" -> Just Metal
  "metal" -> Just Metal
  _ -> Nothing

-- Check if valid asset category
isValidAssetCategory :: String -> Boolean
isValidAssetCategory str = case validateAssetCategory str of
  Right _ -> true
  Left _ -> false

-- Create default asset
createDefaultAsset :: String -> AssetData
createDefaultAsset symbol =
  { symbol: symbol
  , name: Just symbol
  , price: 0.0
  , priceInUSD: Nothing
  , priceInBTC: Nothing
  , change: 0.0
  , changePercent: 0.0
  , change24h: Just 0.0
  , volume24h: Just 0.0
  , marketCap: Just 0.0
  , category: Nothing
  , lastUpdated: Nothing
  }

-- Normalize historical data point
normalizeHistoricalDataPoint :: Json -> Either JsonDecodeError HistoricalDataPoint
normalizeHistoricalDataPoint json = do
  obj <- decodeJson json
  -- Try to get timestamp from either "timestamp" or "time" field
  timestamp <- (obj .: "timestamp") <|> (obj .: "time")
  -- Convert timestamp to DateTime
  let milliseconds = Int.toNumber timestamp * 1000.0
      jsDate = JSDate.fromTime milliseconds
      date = JSDate.toDateTime jsDate # fromMaybe (unsafePerformEffect JSDate.now >>= JSDate.toDateTime >>> fromMaybe (unsafePartial $ fromJust Nothing))
  price <- obj .: "price"
  -- Get optional fields with defaults
  value <- obj .:? "value" >>= pure <<< fromMaybe price
  open <- obj .:? "open" >>= pure <<< fromMaybe price
  high <- obj .:? "high" >>= pure <<< fromMaybe price
  low <- obj .:? "low" >>= pure <<< fromMaybe price
  close <- obj .:? "close" >>= pure <<< fromMaybe price
  volume <- obj .:? "volume" >>= pure <<< fromMaybe 0.0
  pure { timestamp, date, price, value, open, high, low, close, volume }

-- Alternative operator for Either JsonDecodeError
infixr 3 orElse as <|>
orElse :: forall a. Either JsonDecodeError a -> Either JsonDecodeError a -> Either JsonDecodeError a
orElse (Right x) _ = Right x
orElse _ y = y