{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE LambdaCase #-}

module Types where

import Data.Aeson
import Data.Aeson.Types (parseMaybe)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (UTCTime)
import GHC.Generics
import Control.Applicative ((<|>))
import Data.Vector (toList)

-- Asset Categories
data AssetCategory = Metal | Stock | Crypto
  deriving (Show, Eq, Ord, Generic)

instance ToJSON AssetCategory where
  toJSON Metal = String "metal"
  toJSON Stock = String "stocks"
  toJSON Crypto = String "crypto"

instance FromJSON AssetCategory where
  parseJSON = withText "AssetCategory" $ \case
    "metal" -> pure Metal
    "stocks" -> pure Stock
    "crypto" -> pure Crypto
    _ -> fail "Invalid asset category"

-- Market Data Options
data MarketDataOptions = MarketDataOptions
  { mdoCategory :: Maybe AssetCategory
  , mdoLimit :: Maybe Int
  , mdoPage :: Maybe Int
  , mdoSearch :: Maybe Text
  , mdoSort :: Maybe Text
  , mdoOrder :: Maybe OrderDirection
  } deriving (Show, Eq, Generic)

data OrderDirection = Asc | Desc
  deriving (Show, Eq, Generic)

instance ToJSON OrderDirection where
  toJSON Asc = String "asc"
  toJSON Desc = String "desc"

instance FromJSON OrderDirection where
  parseJSON = withText "OrderDirection" $ \case
    "asc" -> pure Asc
    "desc" -> pure Desc
    _ -> fail "Invalid order direction"

-- Asset Price
data AssetPrice = AssetPrice
  { apSymbol :: Text
  , apName :: Maybe Text
  , apPrice :: Double
  , apPriceInUSD :: Maybe Double
  , apPriceInBTC :: Maybe Double
  , apChange :: Double
  , apChangePercent :: Double
  , apLastUpdated :: Maybe Text
  , apType :: Maybe Text
  } deriving (Show, Eq, Generic)

instance ToJSON AssetPrice where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON AssetPrice where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

-- Health Status
data HealthStatus = HealthStatus
  { hsStatus :: Text
  } deriving (Show, Eq, Generic)

instance ToJSON HealthStatus where
  toJSON (HealthStatus status) = object ["status" .= status]

instance FromJSON HealthStatus where
  parseJSON = withObject "HealthStatus" $ \v -> 
    HealthStatus <$> v .: "status"

-- Error Response
data ErrorResponse = ErrorResponse
  { erError :: Text
  , erStatus :: Maybe Int
  } deriving (Show, Eq, Generic)

instance ToJSON ErrorResponse where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON ErrorResponse where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

-- Historical Data Point
data HistoricalDataPoint = HistoricalDataPoint
  { hdpTimestamp :: Integer
  , hdpDate :: UTCTime
  , hdpPrice :: Double
  , hdpValue :: Double
  , hdpOpen :: Double
  , hdpHigh :: Double
  , hdpLow :: Double
  , hdpClose :: Double
  , hdpVolume :: Double
  } deriving (Show, Eq, Generic)

instance ToJSON HistoricalDataPoint where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 3 }

instance FromJSON HistoricalDataPoint where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 3 }

-- Asset Data
data AssetData = AssetData
  { adSymbol :: Text
  , adName :: Maybe Text
  , adPrice :: Double
  , adPriceInUSD :: Maybe Double
  , adPriceInBTC :: Maybe Double
  , adChange :: Double
  , adChangePercent :: Double
  , adChange24h :: Maybe Double
  , adVolume24h :: Maybe Double
  , adMarketCap :: Maybe Double
  , adCategory :: Maybe AssetCategory
  , adLastUpdated :: Maybe Text
  } deriving (Show, Eq, Generic)

instance ToJSON AssetData where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON AssetData where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

-- Market Asset
data MarketAsset = MarketAsset
  { maSymbol :: Text
  , maName :: Text
  , maPrice :: Double
  , maPriceInUSD :: Maybe Double
  , maPriceInBTC :: Maybe Double
  , maChange :: Double
  , maChangePercent :: Double
  , maChange24h :: Maybe Double
  , maVolume24h :: Maybe Double
  , maMarketCap :: Maybe Double
  , maCategory :: Maybe AssetCategory
  , maType :: Maybe Text
  , maLastUpdated :: Text
  } deriving (Show, Eq, Generic)

instance ToJSON MarketAsset where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON MarketAsset where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

-- Market Data
data MarketData = MarketData
  { mdAssets :: [MarketAsset]
  , mdTotal :: Int
  , mdPage :: Int
  , mdLimit :: Int
  } deriving (Show, Eq, Generic)

instance ToJSON MarketData where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON MarketData where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

-- Market Overview
data MarketOverview = MarketOverview
  { moTotalMarketCap :: Double
  , moTotalVolume :: Double
  , moTotalAssets :: Int
  , moTopMovers :: [MarketAsset]
  , moRecentlyAdded :: [MarketAsset]
  } deriving (Show, Eq, Generic)

instance ToJSON MarketOverview where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON MarketOverview where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

-- Watchlist Item
data WatchlistItem = WatchlistItem
  { wiAssetSymbol :: Text
  , wiAssetType :: Text
  , wiDateAdded :: Text
  } deriving (Show, Eq, Generic)

instance ToJSON WatchlistItem where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON WatchlistItem where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

-- Watchlist Response
data WatchlistResponse = WatchlistResponse
  { wrData :: WatchlistData
  } deriving (Show, Eq, Generic)

newtype WatchlistData = WatchlistData
  { wdWatchlist :: [WatchlistItem]
  } deriving (Show, Eq, Generic)

instance ToJSON WatchlistResponse where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON WatchlistResponse where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance ToJSON WatchlistData where
  toJSON = genericToJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

instance FromJSON WatchlistData where
  parseJSON = genericParseJSON defaultOptions { fieldLabelModifier = camelTo2 '_' . drop 2 }

-- Validation functions using Either for better error handling
validateAssetCategory :: Text -> Either Text AssetCategory
validateAssetCategory t = case t of
  "metal"          -> Right Metal
  "metals"         -> Right Metal
  "stocks"         -> Right Stock
  "stock"          -> Right Stock
  "crypto"         -> Right Crypto
  "cryptocurrency" -> Right Crypto
  _                -> Left $ "Invalid asset category: " <> t

-- Original utility functions preserved for compatibility
isValidAssetCategory :: Text -> Bool
isValidAssetCategory t = t `elem` ["metal", "stocks", "crypto"]

parseAssetCategory :: Maybe Text -> Maybe AssetCategory
parseAssetCategory Nothing = Nothing
parseAssetCategory (Just t) = case t of
  "crypto" -> Just Crypto
  "cryptocurrency" -> Just Crypto
  "stocks" -> Just Stock
  "stock" -> Just Stock
  "metals" -> Just Metal
  "metal" -> Just Metal
  _ -> Nothing

-- Safe parsing with Either
parseAssetCategorySafe :: Text -> Either Text AssetCategory
parseAssetCategorySafe = validateAssetCategory

-- Create default asset with pure function
createDefaultAsset :: Text -> AssetData
createDefaultAsset symbol = AssetData
  { adSymbol = symbol
  , adName = Just symbol
  , adPrice = 0
  , adPriceInUSD = Nothing
  , adPriceInBTC = Nothing
  , adChange = 0
  , adChangePercent = 0
  , adChange24h = Just 0
  , adVolume24h = Just 0
  , adMarketCap = Just 0
  , adCategory = Nothing
  , adLastUpdated = Nothing
  }

-- Normalize historical data point from various input formats
normalizeHistoricalDataPoint :: Value -> Either Text HistoricalDataPoint
normalizeHistoricalDataPoint val = case val of
  Object o -> do
    timestamp <- maybe (Left "Missing timestamp") Right $ 
                 parseMaybe (.: "timestamp") o <|> 
                 parseMaybe (.: "time") o
    let date = undefined -- Would need proper date parsing
    price <- maybe (Left "Missing price") Right $ parseMaybe (.: "price") o
    let value = maybe price id $ parseMaybe (.: "value") o
        open = maybe price id $ parseMaybe (.: "open") o
        high = maybe price id $ parseMaybe (.: "high") o
        low = maybe price id $ parseMaybe (.: "low") o
        close = maybe price id $ parseMaybe (.: "close") o
        volume = maybe 0 id $ parseMaybe (.: "volume") o
    Right $ HistoricalDataPoint timestamp date price value open high low close volume
  Array arr -> case toList arr of
    [Number ts, Number p] -> 
      let timestamp = round ts
          price = realToFrac p
      in Right $ HistoricalDataPoint timestamp undefined price price price price price price 0
    _ -> Left "Invalid array format for historical data point"
  _ -> Left "Invalid format for historical data point"