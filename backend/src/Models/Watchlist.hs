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

module Models.Watchlist where

import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (UTCTime, getCurrentTime)
import Database.Persist
import Database.Persist.Sql
import Database.Persist.TH
import Models.User (UserId)
import Models.Asset (AssetType(..))

-- Alert Condition Enumeration
data AlertCondition = Above | Below
  deriving stock (Show, Read, Eq, Ord)

derivePersistField "AlertCondition"

-- Define the entities using Persistent Template Haskell
share [mkPersist sqlSettings, mkMigrate "migrateWatchlist"] [persistLowerCase|
Watchlist
    userId UserId
    symbol Text
    notes Text Maybe
    -- Metadata fields (flattened)
    assetType AssetType
    exchange Text Maybe
    addedAt UTCTime default=CURRENT_TIME
    createdAt UTCTime default=CURRENT_TIME
    updatedAt UTCTime default=CURRENT_TIME
    UniqueUserSymbol userId symbol
    deriving Eq Show

Alert
    watchlistId WatchlistId
    condition AlertCondition
    price Double
    active Bool default=True
    createdAt UTCTime default=CURRENT_TIME
    triggeredAt UTCTime Maybe
    deriving Eq Show

WatchlistTag
    watchlistId WatchlistId
    tag Text
    UniqueWatchlistTag watchlistId tag
    deriving Eq Show
|]

-- | Add an alert to a watchlist item
addAlert :: MonadIO m => Key Watchlist -> AlertCondition -> Double -> SqlPersistT m (Key Alert)
addAlert watchlistId condition price = do
    currentTime <- liftIO getCurrentTime
    insert $ Alert
        { alertWatchlistId = watchlistId
        , alertCondition = condition
        , alertPrice = price
        , alertActive = True
        , alertCreatedAt = currentTime
        , alertTriggeredAt = Nothing
        }

-- | Remove an alert
removeAlert :: MonadIO m => Key Alert -> SqlPersistT m ()
removeAlert = delete

-- | Trigger an alert
triggerAlert :: MonadIO m => Key Alert -> SqlPersistT m ()
triggerAlert alertId = do
    currentTime <- liftIO getCurrentTime
    update alertId
        [ AlertActive =. False
        , AlertTriggeredAt =. Just currentTime
        ]

-- | Add tags to a watchlist item
addTags :: MonadIO m => Key Watchlist -> [Text] -> SqlPersistT m ()
addTags watchlistId tags = do
    forM_ tags $ \tag -> do
        insertUnique $ WatchlistTag watchlistId tag
    return ()

-- | Remove tags from a watchlist item
removeTags :: MonadIO m => Key Watchlist -> [Text] -> SqlPersistT m ()
removeTags watchlistId tags = do
    deleteWhere [ WatchlistTagWatchlistId ==. watchlistId
                , WatchlistTagTag <-. tags
                ]

-- | Get watchlist items by type
getByType :: MonadIO m => Key User -> AssetType -> SqlPersistT m [Entity Watchlist]
getByType userId assetType = 
    selectList [ WatchlistUserId ==. userId
               , WatchlistAssetType ==. assetType
               ] [Desc WatchlistAddedAt]

-- | Get watchlist items with active alerts
getActiveAlerts :: MonadIO m => Key User -> SqlPersistT m [(Entity Watchlist, [Entity Alert])]
getActiveAlerts userId = do
    watchlists <- selectList [WatchlistUserId ==. userId] []
    forM watchlists $ \watchlist -> do
        alerts <- selectList [ AlertWatchlistId ==. entityKey watchlist
                             , AlertActive ==. True
                             ] []
        return (watchlist, alerts)

-- | Get watchlist items by tags
getByTags :: MonadIO m => Key User -> [Text] -> SqlPersistT m [Entity Watchlist]
getByTags userId tags = do
    -- First get watchlist IDs that have any of the specified tags
    taggedItems <- selectList [WatchlistTagTag <-. tags] []
    let watchlistIds = map (watchlistTagWatchlistId . entityVal) taggedItems
    
    -- Then get the actual watchlist items
    selectList [ WatchlistId <-. watchlistIds
               , WatchlistUserId ==. userId
               ] [Desc WatchlistAddedAt]

-- | Get all tags for a watchlist item
getWatchlistTags :: MonadIO m => Key Watchlist -> SqlPersistT m [Text]
getWatchlistTags watchlistId = do
    tags <- selectList [WatchlistTagWatchlistId ==. watchlistId] []
    return $ map (watchlistTagTag . entityVal) tags

-- | Create a new watchlist item with tags
createWatchlistItem :: MonadIO m => Key User -> Text -> AssetType -> Maybe Text -> [Text] -> SqlPersistT m (Maybe (Key Watchlist))
createWatchlistItem userId symbol assetType notes tags = do
    currentTime <- liftIO getCurrentTime
    maybeWatchlistId <- insertUnique $ Watchlist
        { watchlistUserId = userId
        , watchlistSymbol = T.toUpper symbol
        , watchlistNotes = notes
        , watchlistAssetType = assetType
        , watchlistExchange = Nothing
        , watchlistAddedAt = currentTime
        , watchlistCreatedAt = currentTime
        , watchlistUpdatedAt = currentTime
        }
    
    case maybeWatchlistId of
        Just watchlistId -> do
            addTags watchlistId tags
            return $ Just watchlistId
        Nothing -> return Nothing