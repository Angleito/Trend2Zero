{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TypeFamilies #-}

module Database
    ( -- * Database configuration
      runDb
    , initializeDb
    , withDb
      -- * Connection pool
    , createDbPool
    , DbPool
    ) where

import Control.Monad.IO.Class (MonadIO, liftIO)
import Control.Monad.Logger (runStdoutLoggingT, LoggingT)
import Control.Monad.Trans.Reader (ReaderT)
import Control.Monad.Trans.Resource (ResourceT, runResourceT)
import Data.Pool (Pool)
import Database.Persist.Postgresql
import Database.Persist.Sql

import Models (migrateAll)

-- | Database connection pool type
type DbPool = Pool SqlBackend

-- | Create a PostgreSQL connection pool
createDbPool :: MonadIO m => ConnectionString -> Int -> m DbPool
createDbPool connStr poolSize = liftIO $ 
    runStdoutLoggingT $ createPostgresqlPool connStr poolSize

-- | Run a database action with the given pool
runDb :: MonadIO m => DbPool -> ReaderT SqlBackend IO a -> m a
runDb pool action = liftIO $ runSqlPool action pool

-- | Initialize the database (run migrations)
initializeDb :: MonadIO m => DbPool -> m ()
initializeDb pool = runDb pool migrateAll

-- | Run a database action within a transaction
withDb :: ConnectionString -> ReaderT SqlBackend (LoggingT (ResourceT IO)) a -> IO a
withDb connStr action = runStdoutLoggingT $ withPostgresqlConn connStr $ \backend ->
    runReaderT action backend

-- Example connection strings:
-- PostgreSQL: "host=localhost dbname=trend2zero user=postgres password=password port=5432"
-- SQLite: "trend2zero.db"

{- Example usage:

import Database
import Models

main :: IO ()
main = do
    -- Create connection pool
    let connStr = "host=localhost dbname=trend2zero user=postgres password=password port=5432"
    pool <- createDbPool connStr 10
    
    -- Initialize database (run migrations)
    initializeDb pool
    
    -- Example: Create a new user
    userId <- runDb pool $ do
        createUser "John Doe" "john@example.com" "password123" UserRole
    
    -- Example: Add an asset to watchlist
    runDb pool $ do
        case userId of
            Just uid -> createWatchlistItem uid "AAPL" Stock Nothing ["tech", "large-cap"]
            Nothing -> return Nothing
    
    -- Example: Query assets
    topAssets <- runDb pool $ getTopByMarketCap 10
    print topAssets
-}