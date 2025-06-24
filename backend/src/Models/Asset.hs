{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DerivingStrategies #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE QuasiQuotes #-}
{-# LANGUAGE StandaloneDeriving #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE UndecidableInstances #-}

module Models.Asset where

import Data.Text (Text)
import Data.Time (UTCTime, getCurrentTime)
import Database.Persist
import Database.Persist.Sql
import Database.Persist.TH
import Control.Monad.IO.Class (MonadIO, liftIO)

-- Asset Type Enumeration
data AssetType = Stock | Crypto | Commodity | Forex
  deriving stock (Show, Read, Eq, Ord)

derivePersistField "AssetType"

-- Define the Asset entity using Persistent Template Haskell
share [mkPersist sqlSettings, mkMigrate "migrateAsset"] [persistLowerCase|
Asset
    symbol Text
    name Text
    type AssetType
    description Text Maybe
    currentPrice Double
    marketCap Double Maybe
    volume24h Double Maybe
    change24h Double Maybe
    high24h Double Maybe
    low24h Double Maybe
    lastUpdated UTCTime default=CURRENT_TIME
    -- Metadata fields (flattened from the JavaScript object)
    exchange Text Maybe
    sector Text Maybe
    industry Text Maybe
    website Text Maybe
    logo Text Maybe
    createdAt UTCTime default=CURRENT_TIME
    updatedAt UTCTime default=CURRENT_TIME
    UniqueAssetSymbol symbol
    deriving Eq Show
|]

-- Virtual property calculations (equivalent to JavaScript virtual properties)
-- | Calculate price change as percentage
priceChangePercentage :: Asset -> Maybe Double
priceChangePercentage asset = do
    change <- assetChange24h asset
    let oldPrice = assetCurrentPrice asset - change
    if oldPrice /= 0
        then Just $ (change / oldPrice) * 100
        else Nothing

-- | Calculate 24h volatility
volatility24h :: Asset -> Maybe Double
volatility24h asset = do
    high <- assetHigh24h asset
    low <- assetLow24h asset
    if low /= 0
        then Just $ ((high - low) / low) * 100
        else Nothing

-- | Update asset price
updateAssetPrice :: MonadIO m => Key Asset -> Double -> SqlPersistT m ()
updateAssetPrice assetId newPrice = do
    maybeAsset <- get assetId
    case maybeAsset of
        Nothing -> return ()
        Just asset -> do
            currentTime <- liftIO getCurrentTime
            let oldPrice = assetCurrentPrice asset
                change = newPrice - oldPrice
            update assetId
                [ AssetCurrentPrice =. newPrice
                , AssetChange24h =. Just change
                , AssetLastUpdated =. currentTime
                , AssetUpdatedAt =. currentTime
                ]

-- | Update asset statistics
updateAssetStats :: MonadIO m => Key Asset -> [Update Asset] -> SqlPersistT m ()
updateAssetStats assetId updates = do
    currentTime <- liftIO getCurrentTime
    update assetId (updates ++ [AssetLastUpdated =. currentTime])

-- | Get top assets by market cap
getTopByMarketCap :: MonadIO m => Int -> SqlPersistT m [Entity Asset]
getTopByMarketCap limit = 
    selectList [] [Desc AssetMarketCap, LimitTo limit]

-- | Get top assets by volume
getTopByVolume :: MonadIO m => Int -> SqlPersistT m [Entity Asset]
getTopByVolume limit = 
    selectList [] [Desc AssetVolume24h, LimitTo limit]

-- | Get top gainers
getTopGainers :: MonadIO m => Int -> SqlPersistT m [Entity Asset]
getTopGainers limit = 
    selectList [] [Desc AssetChange24h, LimitTo limit]

-- | Get top losers
getTopLosers :: MonadIO m => Int -> SqlPersistT m [Entity Asset]
getTopLosers limit = 
    selectList [] [Asc AssetChange24h, LimitTo limit]

