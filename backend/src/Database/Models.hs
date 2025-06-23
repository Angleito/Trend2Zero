{-# LANGUAGE EmptyDataDecls             #-}
{-# LANGUAGE FlexibleContexts           #-}
{-# LANGUAGE GADTs                      #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE MultiParamTypeClasses      #-}
{-# LANGUAGE OverloadedStrings          #-}
{-# LANGUAGE QuasiQuotes                #-}
{-# LANGUAGE TemplateHaskell            #-}
{-# LANGUAGE TypeFamilies               #-}
{-# LANGUAGE DerivingStrategies         #-}
{-# LANGUAGE StandaloneDeriving         #-}
{-# LANGUAGE UndecidableInstances       #-}
{-# LANGUAGE DataKinds                  #-}
{-# LANGUAGE FlexibleInstances          #-}

module Database.Models where

import Database.Persist.TH
import Data.Text (Text)
import Data.Time (UTCTime)

share [mkPersist sqlSettings, mkMigrate "migrateAll"] [persistLowerCase|
Asset
    symbol Text
    name Text Maybe
    category Text
    lastPrice Double Maybe
    lastUpdated UTCTime
    UniqueSymbol symbol
    deriving Show Eq

PriceHistory
    assetId AssetId
    timestamp UTCTime
    open Double
    high Double
    low Double
    close Double
    volume Double
    deriving Show Eq

WatchlistEntry
    userId Text
    assetId AssetId
    dateAdded UTCTime
    UniqueUserAsset userId assetId
    deriving Show Eq

MarketSnapshot
    timestamp UTCTime
    totalMarketCap Double
    totalVolume Double
    totalAssets Int
    deriving Show Eq

User
    email Text
    username Text
    passwordHash Text
    createdAt UTCTime
    lastLogin UTCTime Maybe
    UniqueEmail email
    UniqueUsername username
    deriving Show Eq

ApiKey
    userId UserId
    key Text
    name Text
    createdAt UTCTime
    lastUsed UTCTime Maybe
    expiresAt UTCTime Maybe
    UniqueKey key
    deriving Show Eq
|]