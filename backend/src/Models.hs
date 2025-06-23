{-# LANGUAGE OverloadedStrings #-}

module Models
    ( -- * Re-exports from all model modules
      module Models.Asset
    , module Models.User
    , module Models.Watchlist
    , module Models.Portfolio
      -- * Unified migration
    , migrateAll
    ) where

import Models.Asset
import Models.User
import Models.Watchlist
import Models.Portfolio

import Database.Persist.Sql (runMigration)
import Control.Monad.IO.Class (MonadIO)
import Control.Monad.Trans.Reader (ReaderT)

-- | Run all migrations in the correct order
migrateAll :: MonadIO m => ReaderT SqlBackend m ()
migrateAll = do
    -- Run migrations in dependency order
    runMigration migrateUser      -- User has no dependencies
    runMigration migrateAsset     -- Asset has no dependencies
    runMigration migrateWatchlist -- Watchlist depends on User and uses AssetType
    runMigration migratePortfolio -- Portfolio depends on User