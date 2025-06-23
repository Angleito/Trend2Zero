{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE TypeApplications #-}

-- | High-performance Redis-based caching module with STM for thread safety
-- Implements cache-aside pattern with TTL-based expiration
module Cache
  ( CacheConfig(..)
  , CacheHandle
  , initCache
  , getCachedData
  , clearCache
  , defaultCacheConfig
  ) where

import Control.Concurrent.STM
import Control.Exception (SomeException, catch, try)
import Control.Monad (void)
import Data.Aeson (FromJSON, ToJSON, decode, encode)
import Data.ByteString.Lazy (ByteString)
import qualified Data.ByteString.Lazy as BSL
import qualified Data.ByteString.Char8 as BS
import Data.Time.Clock (UTCTime, getCurrentTime, addUTCTime, diffUTCTime)
import Database.Redis (Connection, Redis, Reply(..))
import qualified Database.Redis as Redis
import GHC.Generics (Generic)
import System.Log.FastLogger

-- | Configuration for the cache system
data CacheConfig = CacheConfig
  { redisHost :: String
  , redisPort :: Int
  , redisAuth :: Maybe BS.ByteString
  , redisDb :: Integer
  , defaultTTL :: Int  -- ^ Default TTL in seconds
  , enableLogging :: Bool
  } deriving (Show)

-- | Default cache configuration
defaultCacheConfig :: CacheConfig
defaultCacheConfig = CacheConfig
  { redisHost = "localhost"
  , redisPort = 6379
  , redisAuth = Nothing
  , redisDb = 0
  , defaultTTL = 300  -- 5 minutes
  , enableLogging = True
  }

-- | Cache entry with metadata
data CacheEntry a = CacheEntry
  { ceData :: a
  , ceExpiresAt :: UTCTime
  } deriving (Generic)

instance ToJSON a => ToJSON (CacheEntry a)
instance FromJSON a => FromJSON (CacheEntry a)

-- | Handle for cache operations with STM for thread safety
data CacheHandle = CacheHandle
  { chConnection :: Connection
  , chConfig :: CacheConfig
  , chLogger :: Maybe (TimedFastLogger)
  , chStats :: TVar CacheStats
  }

-- | Cache statistics for monitoring
data CacheStats = CacheStats
  { csHits :: !Int
  , csMisses :: !Int
  , csErrors :: !Int
  } deriving (Show)

-- | Initialize the cache system
initCache :: CacheConfig -> IO CacheHandle
initCache config = do
  -- Connect to Redis
  conn <- Redis.connect $ Redis.defaultConnectInfo
    { Redis.connectHost = redisHost config
    , Redis.connectPort = Redis.PortNumber (fromIntegral $ redisPort config)
    , Redis.connectAuth = redisAuth config
    , Redis.connectDatabase = redisDb config
    }
  
  -- Initialize logger if enabled
  logger <- if enableLogging config
    then do
      timeCache <- newTimeCache simpleTimeFormat
      (l, _) <- newTimedFastLogger timeCache (LogStdout defaultBufSize)
      return (Just l)
    else return Nothing
  
  -- Initialize stats
  stats <- newTVarIO $ CacheStats 0 0 0
  
  return $ CacheHandle conn config logger stats

-- | Main cache function implementing cache-aside pattern with TTL
-- Uses STM for thread-safe statistics updates and Redis for atomic operations
getCachedData :: (FromJSON a, ToJSON a) 
              => CacheHandle 
              -> String           -- ^ Cache key
              -> IO a             -- ^ Fetcher function
              -> Maybe Int        -- ^ Optional TTL override in seconds
              -> IO a
getCachedData handle key fetcher ttlOverride = do
  let ttl = maybe (defaultTTL $ chConfig handle) id ttlOverride
  
  -- Try to get from cache
  cacheResult <- try $ Redis.runRedis (chConnection handle) $ do
    Redis.get (BS.pack key)
  
  case cacheResult of
    Left (e :: SomeException) -> do
      -- Redis error - log and fall back to fetcher
      logError handle $ "Redis error for key " ++ key ++ ": " ++ show e
      updateStats handle (\s -> s { csErrors = csErrors s + 1 })
      fetcher
    
    Right (Left redisErr) -> do
      -- Redis command error
      logError handle $ "Redis command error for key " ++ key ++ ": " ++ show redisErr
      updateStats handle (\s -> s { csErrors = csErrors s + 1 })
      fetcher
    
    Right (Right Nothing) -> do
      -- Cache miss
      logInfo handle $ "CACHE MISS for key: " ++ key
      updateStats handle (\s -> s { csMisses = csMisses s + 1 })
      fetchAndCache handle key fetcher ttl
    
    Right (Right (Just bs)) -> do
      -- Check if cached data is valid and not expired
      case decode (BSL.fromStrict bs) of
        Nothing -> do
          -- Invalid cached data
          logWarn handle $ "Invalid cached data for key: " ++ key
          updateStats handle (\s -> s { csMisses = csMisses s + 1 })
          fetchAndCache handle key fetcher ttl
        
        Just (entry :: CacheEntry a) -> do
          now <- getCurrentTime
          if ceExpiresAt entry > now
            then do
              -- Cache hit
              logInfo handle $ "CACHE HIT for key: " ++ key
              updateStats handle (\s -> s { csHits = csHits s + 1 })
              return $ ceData entry
            else do
              -- Expired
              logInfo handle $ "CACHE EXPIRED for key: " ++ key
              updateStats handle (\s -> s { csMisses = csMisses s + 1 })
              fetchAndCache handle key fetcher ttl

-- | Fetch fresh data and update cache atomically
fetchAndCache :: (FromJSON a, ToJSON a)
              => CacheHandle
              -> String
              -> IO a
              -> Int
              -> IO a
fetchAndCache handle key fetcher ttl = do
  -- Fetch fresh data
  freshData <- fetcher
  
  -- Calculate expiration time
  now <- getCurrentTime
  let expiresAt = addUTCTime (fromIntegral ttl) now
  
  -- Create cache entry
  let entry = CacheEntry
        { ceData = freshData
        , ceExpiresAt = expiresAt
        }
  
  -- Store in Redis with TTL
  storeResult <- try $ Redis.runRedis (chConnection handle) $ do
    Redis.setex (BS.pack key) (fromIntegral ttl) (BSL.toStrict $ encode entry)
  
  case storeResult of
    Left (e :: SomeException) -> 
      logError handle $ "Failed to store in cache for key " ++ key ++ ": " ++ show e
    Right (Left redisErr) ->
      logError handle $ "Redis error storing key " ++ key ++ ": " ++ show redisErr
    Right (Right _) ->
      logInfo handle $ "CACHE UPDATED for key: " ++ key
  
  return freshData

-- | Clear specific cache key or all cache
clearCache :: CacheHandle -> Maybe String -> IO ()
clearCache handle Nothing = do
  -- Clear all cache
  result <- try $ Redis.runRedis (chConnection handle) Redis.flushdb
  case result of
    Left (e :: SomeException) ->
      logError handle $ "Failed to clear cache: " ++ show e
    Right _ ->
      logInfo handle "Cache cleared"

clearCache handle (Just key) = do
  -- Clear specific key
  result <- try $ Redis.runRedis (chConnection handle) $ 
    void $ Redis.del [BS.pack key]
  case result of
    Left (e :: SomeException) ->
      logError handle $ "Failed to clear key " ++ key ++ ": " ++ show e
    Right _ ->
      logInfo handle $ "Cache key cleared: " ++ key

-- | Update cache statistics atomically using STM
updateStats :: CacheHandle -> (CacheStats -> CacheStats) -> IO ()
updateStats handle f = atomically $ modifyTVar' (chStats handle) f

-- | Logging helpers
logInfo :: CacheHandle -> String -> IO ()
logInfo handle msg = case chLogger handle of
  Nothing -> return ()
  Just logger -> logger (\time -> toLogStr time <> " [INFO] " <> toLogStr msg <> "\n")

logWarn :: CacheHandle -> String -> IO ()
logWarn handle msg = case chLogger handle of
  Nothing -> return ()
  Just logger -> logger (\time -> toLogStr time <> " [WARN] " <> toLogStr msg <> "\n")

logError :: CacheHandle -> String -> IO ()
logError handle msg = case chLogger handle of
  Nothing -> return ()
  Just logger -> logger (\time -> toLogStr time <> " [ERROR] " <> toLogStr msg <> "\n")