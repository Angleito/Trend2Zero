{-# LANGUAGE OverloadedStrings #-}

module Models
    ( -- * Re-exports from Models.Asset
      module Models.Asset
      -- * Re-exports from Models.User
    , module Models.User
      -- * Re-exports from Models.Watchlist (with qualified exports for conflicting functions)
    , Watchlist(..), WatchlistId, Alert(..), AlertId, WatchlistTag(..), WatchlistTagId
    , AlertCondition(..)
    , addAlert, removeAlert, triggerAlert
    , addWatchlistTags, removeWatchlistTags  -- Qualified function names
    , getByType, getActiveAlerts, getByTags, getWatchlistTags, createWatchlistItem
      -- * Re-exports from Models.Portfolio (with qualified exports for conflicting functions)
    , Portfolio(..), PortfolioId, PortfolioTag(..), PortfolioTagId
    , PortfolioAssetType(..)
    , totalValue, updatePosition
    , addPortfolioTags, removePortfolioTags  -- Qualified function names
    , getTotalValue, getPositionsByType, getTopPositions, createPosition, getPortfolioTags
      -- * Unified migration
    , migrateAll
    ) where

import Models.Asset
import Models.User
import Models.Watchlist hiding (addTags, removeTags)
import qualified Models.Watchlist as W
import Models.Portfolio hiding (addTags, removeTags)
import qualified Models.Portfolio as P

import Database.Persist.Sql (runMigration, SqlBackend, SqlPersistT)
import Control.Monad.IO.Class (MonadIO)
import Control.Monad.Trans.Reader (ReaderT)
import Data.Text (Text)

-- Import the individual migration functions
import Models.Asset (migrateAsset)
import Models.User (migrateUser)
import Models.Watchlist (migrateWatchlist)
import Models.Portfolio (migratePortfolio)

-- | Qualified exports to resolve naming conflicts

-- | Add tags to a watchlist item (qualified export)
addWatchlistTags :: MonadIO m => WatchlistId -> [Text] -> SqlPersistT m ()
addWatchlistTags = W.addTags

-- | Remove tags from a watchlist item (qualified export)
removeWatchlistTags :: MonadIO m => WatchlistId -> [Text] -> SqlPersistT m ()
removeWatchlistTags = W.removeTags

-- | Add tags to a portfolio position (qualified export)
addPortfolioTags :: MonadIO m => PortfolioId -> [Text] -> SqlPersistT m ()
addPortfolioTags = P.addTags

-- | Remove tags from a portfolio position (qualified export)
removePortfolioTags :: MonadIO m => PortfolioId -> [Text] -> SqlPersistT m ()
removePortfolioTags = P.removeTags

-- | Run all migrations in the correct order
migrateAll :: MonadIO m => ReaderT SqlBackend m ()
migrateAll = do
    -- Run migrations in dependency order
    runMigration migrateUser      -- User has no dependencies
    runMigration migrateAsset     -- Asset has no dependencies
    runMigration migrateWatchlist -- Watchlist depends on User and uses AssetType
    runMigration migratePortfolio -- Portfolio depends on User