{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE DeriveAnyClass #-}

module Services.MarketDataTypes
    ( AssetPrice(..)
    , HistoricalDataPoint(..)
    , DataSource(..)
    , MarketAsset(..)
    , MarketOverview(..)
    , ListOptions(..)
    ) where

import Data.Aeson
import Data.Text (Text)
import Data.Time
import GHC.Generics

-- | Data source indicator
data DataSource = CoinGecko | AlphaVantage | MetalPrice | Mixed
    deriving (Show, Eq, Generic)

instance ToJSON DataSource
instance FromJSON DataSource

-- | Asset price information
data AssetPrice = AssetPrice
    { apSymbol :: Text
    , apName :: Text
    , apType :: Text
    , apPrice :: Double
    , apPriceInUSD :: Double
    , apPriceInBTC :: Double
    , apChange :: Double
    , apChangePercent :: Double
    , apVolume24h :: Maybe Double
    , apMarketCap :: Maybe Double
    , apLastUpdated :: UTCTime
    , apSource :: DataSource
    } deriving (Show, Eq, Generic)

instance ToJSON AssetPrice where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

instance FromJSON AssetPrice where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

-- | Historical data point
data HistoricalDataPoint = HistoricalDataPoint
    { hdTimestamp :: Integer
    , hdDate :: UTCTime
    , hdPrice :: Double
    , hdVolume :: Maybe Double
    , hdMarketCap :: Maybe Double
    } deriving (Show, Eq, Generic)

instance ToJSON HistoricalDataPoint where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

instance FromJSON HistoricalDataPoint where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

-- | Market asset representation
data MarketAsset = MarketAsset
    { maId :: Text
    , maSymbol :: Text
    , maName :: Text
    , maType :: Text
    , maPrice :: Double
    , maPriceInBTC :: Double
    , maChange24h :: Double
    , maVolume24h :: Double
    , maMarketCap :: Double
    , maRank :: Int
    , maSource :: DataSource
    } deriving (Show, Eq, Generic)

instance ToJSON MarketAsset where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

instance FromJSON MarketAsset where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

-- | Market overview data
data MarketOverview = MarketOverview
    { moTotalMarketCap :: Double
    , moTotalVolume :: Double
    , moBTCDominance :: Double
    , moActiveAssets :: Int
    , moTopGainers :: [AssetPrice]
    , moTopLosers :: [AssetPrice]
    } deriving (Show, Eq, Generic)

instance ToJSON MarketOverview where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

instance FromJSON MarketOverview where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

-- | List options for API queries
data ListOptions = ListOptions
    { loLimit :: Int
    , loOffset :: Int
    , loSort :: Text
    , loOrder :: Text
    } deriving (Show, Eq)