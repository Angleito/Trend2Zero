module API.Types
  ( AssetCategory(..)
  , MarketDataOptions
  , AssetPrice
  , ErrorResponse
  , HistoricalDataPoint
  , AssetData
  , MarketAsset
  , MarketData
  , MarketOverview
  , WatchlistItem
  , WatchlistResponse
  , assetCategoryToString
  , stringToAssetCategory
  , parseAssetCategory
  , createDefaultAsset
  , normalizeHistoricalDataPoint
  ) where

import Prelude

import Data.Argonaut (class DecodeJson, class EncodeJson, decodeJson, encodeJson, (.:), (.:?), (:=), (~>), jsonEmptyObject)
import Data.Argonaut.Decode.Error (JsonDecodeError)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..), fromMaybe)
import Data.String as String
import Data.DateTime (DateTime)
import Data.DateTime.Instant (instant, toDateTime)
import Data.Time.Duration (Milliseconds(..))
import Data.Number (fromString) as Number

-- Asset Category ADT
data AssetCategory
  = Metal
  | Stock
  | Crypto

derive instance eqAssetCategory :: Eq AssetCategory
derive instance ordAssetCategory :: Ord AssetCategory

instance showAssetCategory :: Show AssetCategory where
  show Metal = "metal"
  show Stock = "stocks"
  show Crypto = "crypto"

instance encodeJsonAssetCategory :: EncodeJson AssetCategory where
  encodeJson = encodeJson <<< assetCategoryToString

instance decodeJsonAssetCategory :: DecodeJson AssetCategory where
  decodeJson json = do
    str <- decodeJson json
    case stringToAssetCategory str of
      Just cat -> Right cat
      Nothing -> Left $ TypeMismatch $ "Invalid asset category: " <> str

assetCategoryToString :: AssetCategory -> String
assetCategoryToString Metal = "metal"
assetCategoryToString Stock = "stocks"
assetCategoryToString Crypto = "crypto"

stringToAssetCategory :: String -> Maybe AssetCategory
stringToAssetCategory "metal" = Just Metal
stringToAssetCategory "stocks" = Just Stock
stringToAssetCategory "crypto" = Just Crypto
stringToAssetCategory _ = Nothing

parseAssetCategory :: String -> Maybe AssetCategory
parseAssetCategory str = 
  let normalized = String.toLower str
  in case normalized of
    "crypto" -> Just Crypto
    "cryptocurrency" -> Just Crypto
    "stocks" -> Just Stock
    "stock" -> Just Stock
    "metals" -> Just Metal
    "metal" -> Just Metal
    _ -> Nothing

-- Market Data Options
type MarketDataOptions =
  { category :: Maybe AssetCategory
  , limit :: Maybe Int
  , page :: Maybe Int
  , search :: Maybe String
  , sort :: Maybe String
  , order :: Maybe String
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

-- Error Response
type ErrorResponse =
  { error :: String
  , status :: Maybe Int
  }

instance decodeJsonErrorResponse :: DecodeJson ErrorResponse where
  decodeJson json = do
    obj <- decodeJson json
    error <- obj .: "error"
    status <- obj .:? "status"
    pure { error, status }

-- Historical Data Point
type HistoricalDataPoint =
  { timestamp :: Number
  , date :: DateTime
  , price :: Number
  , value :: Number
  , open :: Number
  , high :: Number
  , low :: Number
  , close :: Number
  , volume :: Number
  }

instance decodeJsonHistoricalDataPoint :: DecodeJson HistoricalDataPoint where
  decodeJson json = do
    obj <- decodeJson json
    timestamp <- obj .: "timestamp"
    price <- obj .: "price"
    value <- obj .: "value"
    open <- obj .: "open"
    high <- obj .: "high"
    low <- obj .: "low"
    close <- obj .: "close"
    volume <- obj .: "volume"
    let date = case instant (Milliseconds timestamp) of
                 Just i -> toDateTime i
                 Nothing -> toDateTime $ fromMaybe bottom $ instant (Milliseconds 0.0)
    pure { timestamp, date, price, value, open, high, low, close, volume }

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

instance decodeJsonMarketAsset :: DecodeJson MarketAsset where
  decodeJson json = do
    obj <- decodeJson json
    symbol <- obj .: "symbol"
    name <- obj .: "name"
    price <- obj .: "price"
    priceInUSD <- obj .:? "priceInUSD"
    priceInBTC <- obj .:? "priceInBTC"
    change <- obj .: "change"
    changePercent <- obj .: "changePercent"
    change24h <- obj .:? "change24h"
    volume24h <- obj .:? "volume24h"
    marketCap <- obj .:? "marketCap"
    categoryStr <- obj .:? "category"
    let category = categoryStr >>= stringToAssetCategory
    type_ <- obj .:? "type"
    lastUpdated <- obj .: "lastUpdated"
    pure { symbol, name, price, priceInUSD, priceInBTC, change, changePercent, change24h, volume24h, marketCap, category, type: type_, lastUpdated }

instance encodeJsonMarketAsset :: EncodeJson MarketAsset where
  encodeJson r = 
    "symbol" := r.symbol
    ~> "name" := r.name
    ~> "price" := r.price
    ~> "priceInUSD" := r.priceInUSD
    ~> "priceInBTC" := r.priceInBTC
    ~> "change" := r.change
    ~> "changePercent" := r.changePercent
    ~> "change24h" := r.change24h
    ~> "volume24h" := r.volume24h
    ~> "marketCap" := r.marketCap
    ~> "category" := (assetCategoryToString <$> r.category)
    ~> "type" := r.type
    ~> "lastUpdated" := r.lastUpdated
    ~> jsonEmptyObject

-- Market Data
type MarketData =
  { assets :: Array MarketAsset
  , total :: Int
  , page :: Int
  , limit :: Int
  }

instance decodeJsonMarketData :: DecodeJson MarketData where
  decodeJson json = do
    obj <- decodeJson json
    assets <- obj .: "assets"
    total <- obj .: "total"
    page <- obj .: "page"
    limit <- obj .: "limit"
    pure { assets, total, page, limit }

-- Market Overview
type MarketOverview =
  { totalMarketCap :: Number
  , totalVolume :: Number
  , totalAssets :: Int
  , topMovers :: Array MarketAsset
  , recentlyAdded :: Array MarketAsset
  }

instance decodeJsonMarketOverview :: DecodeJson MarketOverview where
  decodeJson json = do
    obj <- decodeJson json
    totalMarketCap <- obj .: "totalMarketCap"
    totalVolume <- obj .: "totalVolume"
    totalAssets <- obj .: "totalAssets"
    topMovers <- obj .: "topMovers"
    recentlyAdded <- obj .: "recentlyAdded"
    pure { totalMarketCap, totalVolume, totalAssets, topMovers, recentlyAdded }

-- Watchlist Types
type WatchlistItem =
  { assetSymbol :: String
  , assetType :: String
  , dateAdded :: String
  }

instance decodeJsonWatchlistItem :: DecodeJson WatchlistItem where
  decodeJson json = do
    obj <- decodeJson json
    assetSymbol <- obj .: "assetSymbol"
    assetType <- obj .: "assetType"
    dateAdded <- obj .: "dateAdded"
    pure { assetSymbol, assetType, dateAdded }

type WatchlistResponse =
  { data :: { watchlist :: Array WatchlistItem } }

instance decodeJsonWatchlistResponse :: DecodeJson WatchlistResponse where
  decodeJson json = do
    obj <- decodeJson json
    dataObj <- obj .: "data"
    watchlist <- dataObj .: "watchlist"
    pure { data: { watchlist } }

-- Helper Functions
createDefaultAsset :: String -> MarketAsset
createDefaultAsset symbol =
  { symbol
  , name: symbol
  , price: 0.0
  , priceInUSD: Nothing
  , priceInBTC: Nothing
  , change: 0.0
  , changePercent: 0.0
  , change24h: Nothing
  , volume24h: Nothing
  , marketCap: Nothing
  , category: Nothing
  , type: Nothing
  , lastUpdated: ""
  }

normalizeHistoricalDataPoint :: forall r. 
  { timestamp :: Maybe Number
  , time :: Maybe Number
  , date :: Maybe DateTime
  , price :: Maybe Number
  , value :: Maybe Number
  , open :: Maybe Number
  , high :: Maybe Number
  , low :: Maybe Number
  , close :: Maybe Number
  , volume :: Maybe Number
  | r 
  } -> HistoricalDataPoint
normalizeHistoricalDataPoint data_ =
  let timestamp = fromMaybe 0.0 $ data_.timestamp <|> data_.time
      price = fromMaybe 0.0 data_.price
      value = fromMaybe price data_.value
      date = fromMaybe (toDateTime $ fromMaybe bottom $ instant (Milliseconds timestamp)) data_.date
  in { timestamp
     , date
     , price
     , value
     , open: fromMaybe price data_.open
     , high: fromMaybe price data_.high
     , low: fromMaybe price data_.low
     , close: fromMaybe price data_.close
     , volume: fromMaybe 0.0 data_.volume
     }