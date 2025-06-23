{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

module CacheSpec (spec) where

import Test.Hspec
import Test.QuickCheck
import Test.QuickCheck.Monadic
import Control.Concurrent
import Control.Concurrent.STM
import Control.Exception (bracket, try, SomeException)
import Control.Monad (replicateM, forM_)
import Data.Aeson
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import qualified Data.ByteString.Char8 as BS
import qualified Database.Redis as Redis
import Cache
import Types
import TestHelpers
import System.Environment (lookupEnv)

spec :: Spec
spec = do
  redisAvailable <- runIO checkRedisAvailable
  
  if redisAvailable
    then do
      describe "Cache Module" $ do
        cacheInitializationSpec
        cacheOperationsSpec
        cacheTTLSpec
        cacheStatisticsSpec
        cacheErrorHandlingSpec
        cacheConcurrencySpec
        cachePropertyTests
    else
      describe "Cache Module" $
        it "Redis not available - skipping cache tests" $
          pendingWith "Redis server not running or not accessible"

-- Check if Redis is available
checkRedisAvailable :: IO Bool
checkRedisAvailable = do
  result <- try $ do
    conn <- Redis.connect Redis.defaultConnectInfo
    Redis.runRedis conn Redis.ping
  case result of
    Right (Right Redis.Pong) -> return True
    _ -> return False

-- Cache Initialization Tests
cacheInitializationSpec :: Spec
cacheInitializationSpec = describe "Initialization" $ do
  it "initializes with default configuration" $ do
    handle <- initCache defaultCacheConfig
    -- Should not throw an exception
    return ()
  
  it "initializes with custom configuration" $ do
    let customConfig = defaultCacheConfig
          { redisDb = 1
          , defaultTTL = 600
          , enableLogging = False
          }
    handle <- initCache customConfig
    chConfig handle `shouldBe` customConfig
  
  it "initializes statistics correctly" $ do
    handle <- initCache defaultCacheConfig
    stats <- readTVarIO (chStats handle)
    csHits stats `shouldBe` 0
    csMisses stats `shouldBe` 0
    csErrors stats `shouldBe` 0

-- Cache Operations Tests
cacheOperationsSpec :: Spec
cacheOperationsSpec = around withTestCache $ describe "Operations" $ do
  it "caches and retrieves simple data" $ \handle -> do
    let key = "test:simple"
        value = "test value" :: String
    
    -- First call should miss and fetch
    result1 <- getCachedData handle key (return value) Nothing
    result1 `shouldBe` value
    
    -- Second call should hit cache
    result2 <- getCachedData handle key (error "Should not be called") Nothing
    result2 `shouldBe` value
  
  it "caches and retrieves complex data structures" $ \handle -> do
    let key = "test:asset"
        asset = sampleBitcoin
    
    result1 <- getCachedData handle key (return asset) Nothing
    result1 `shouldBe` asset
    
    result2 <- getCachedData handle key (error "Should not be called") Nothing
    result2 `shouldBe` asset
  
  it "caches different types independently" $ \handle -> do
    let key1 = "test:string"
        key2 = "test:number"
        value1 = "string value" :: String
        value2 = 42 :: Int
    
    result1 <- getCachedData handle key1 (return value1) Nothing
    result2 <- getCachedData handle key2 (return value2) Nothing
    
    result1 `shouldBe` value1
    result2 `shouldBe` value2
  
  it "supports cache clearing" $ \handle -> do
    let key = "test:clear"
        value = "will be cleared" :: String
    
    -- Cache the value
    _ <- getCachedData handle key (return value) Nothing
    
    -- Clear cache
    clearCache handle (Just key)
    
    -- Should miss and fetch again
    callCount <- newTVarIO (0 :: Int)
    result <- getCachedData handle key (do
      atomically $ modifyTVar' callCount (+1)
      return value) Nothing
    
    count <- readTVarIO callCount
    count `shouldBe` 1
    result `shouldBe` value
  
  it "clears all cache when no key specified" $ \handle -> do
    -- Cache multiple values
    forM_ [1..5] $ \i -> do
      let key = "test:bulk:" ++ show i
      getCachedData handle key (return i) Nothing
    
    -- Clear all
    clearCache handle Nothing
    
    -- All should miss
    missCount <- newTVarIO (0 :: Int)
    forM_ [1..5] $ \i -> do
      let key = "test:bulk:" ++ show i
      getCachedData handle key (do
        atomically $ modifyTVar' missCount (+1)
        return i) Nothing
    
    count <- readTVarIO missCount
    count `shouldBe` 5

-- TTL Tests
cacheTTLSpec :: Spec
cacheTTLSpec = around withTestCache $ describe "TTL Management" $ do
  it "respects default TTL" $ \handle -> do
    let key = "test:ttl:default"
        value = "ttl test" :: String
    
    -- Cache with default TTL (5 seconds in test config)
    _ <- getCachedData handle key (return value) Nothing
    
    -- Should hit immediately
    result1 <- getCachedData handle key (error "Should hit cache") Nothing
    result1 `shouldBe` value
    
    -- Wait for expiration (using shorter TTL for tests)
    threadDelay (6 * 1000000) -- 6 seconds
    
    -- Should miss after expiration
    callCount <- newTVarIO (0 :: Int)
    result2 <- getCachedData handle key (do
      atomically $ modifyTVar' callCount (+1)
      return value) Nothing
    
    count <- readTVarIO callCount
    count `shouldBe` 1
  
  it "respects custom TTL override" $ \handle -> do
    let key = "test:ttl:custom"
        value = "custom ttl" :: String
        customTTL = Just 2 -- 2 seconds
    
    _ <- getCachedData handle key (return value) customTTL
    
    -- Should hit within TTL
    threadDelay (1 * 1000000) -- 1 second
    result1 <- getCachedData handle key (error "Should hit cache") customTTL
    result1 `shouldBe` value
    
    -- Should miss after TTL
    threadDelay (2 * 1000000) -- 2 more seconds
    callCount <- newTVarIO (0 :: Int)
    result2 <- getCachedData handle key (do
      atomically $ modifyTVar' callCount (+1)
      return value) customTTL
    
    count <- readTVarIO callCount
    count `shouldBe` 1

-- Statistics Tests
cacheStatisticsSpec :: Spec
cacheStatisticsSpec = around withTestCache $ describe "Statistics" $ do
  it "tracks cache hits correctly" $ \handle -> do
    let key = "test:stats:hits"
        value = "hit test" :: String
    
    -- Prime the cache
    _ <- getCachedData handle key (return value) Nothing
    
    -- Generate hits
    replicateM_ 5 $ getCachedData handle key (error "Should hit") Nothing
    
    stats <- readTVarIO (chStats handle)
    csHits stats `shouldBe` 5
  
  it "tracks cache misses correctly" $ \handle -> do
    -- Generate misses with different keys
    forM_ [1..5] $ \i -> do
      let key = "test:stats:miss:" ++ show i
      getCachedData handle key (return i) Nothing
    
    stats <- readTVarIO (chStats handle)
    csMisses stats `shouldBe` 5
  
  it "maintains accurate hit/miss ratio" $ \handle -> do
    -- Generate known pattern: 1 miss + 3 hits per key
    forM_ [1..10] $ \i -> do
      let key = "test:stats:ratio:" ++ show i
      _ <- getCachedData handle key (return i) Nothing -- miss
      replicateM_ 3 $ getCachedData handle key (error "Should hit") Nothing -- hits
    
    stats <- readTVarIO (chStats handle)
    csHits stats `shouldBe` 30
    csMisses stats `shouldBe` 10

-- Error Handling Tests
cacheErrorHandlingSpec :: Spec
cacheErrorHandlingSpec = around withTestCache $ describe "Error Handling" $ do
  it "handles fetcher exceptions gracefully" $ \handle -> do
    let key = "test:error:fetcher"
        errorFetcher = error "Fetcher failed!" :: IO String
    
    result <- try $ getCachedData handle key errorFetcher Nothing
    case result of
      Left (e :: SomeException) -> return ()
      Right _ -> expectationFailure "Expected exception from fetcher"
  
  it "handles JSON decoding errors" $ \handle -> do
    let key = "test:error:json"
    
    -- Manually insert invalid JSON
    Redis.runRedis (chConnection handle) $ do
      Redis.set (BS.pack key) "invalid json"
    
    -- Should handle gracefully and re-fetch
    result <- getCachedData handle key (return ("valid" :: String)) Nothing
    result `shouldBe` "valid"
    
    stats <- readTVarIO (chStats handle)
    csMisses stats `shouldSatisfy` (> 0)
  
  it "recovers from temporary Redis failures" $ \handle -> do
    -- This test would require mocking Redis connection failures
    -- For now, we'll test the error counting mechanism
    pendingWith "Requires Redis failure simulation"

-- Concurrency Tests
cacheConcurrencySpec :: Spec
cacheConcurrencySpec = around withTestCache $ describe "Concurrency" $ do
  it "handles concurrent reads safely" $ \handle -> do
    let key = "test:concurrent:read"
        value = "concurrent" :: String
    
    -- Prime the cache
    _ <- getCachedData handle key (return value) Nothing
    
    -- Concurrent reads
    results <- forConcurrently [1..100] $ \_ ->
      getCachedData handle key (error "Should hit") Nothing
    
    all (== value) results `shouldBe` True
    
    stats <- readTVarIO (chStats handle)
    csHits stats `shouldBe` 100
  
  it "handles concurrent writes safely" $ \handle -> do
    fetchCount <- newTVarIO (0 :: Int)
    
    -- Concurrent cache misses for same key
    let key = "test:concurrent:write"
        fetcher = do
          atomically $ modifyTVar' fetchCount (+1)
          threadDelay 10000 -- 10ms to increase race condition chance
          return ("value" :: String)
    
    results <- forConcurrently [1..10] $ \_ ->
      getCachedData handle key fetcher Nothing
    
    -- All should get same value
    all (== "value") results `shouldBe` True
    
    -- Fetcher should only be called once due to Redis SET NX
    count <- readTVarIO fetchCount
    count `shouldSatisfy` (<= 2) -- Allow for small race window
  
  it "maintains consistent statistics under load" $ \handle -> do
    -- Generate mixed load
    forConcurrently [1..100] $ \i -> do
      let key = if i `mod` 3 == 0 
                then "test:load:common" 
                else "test:load:" ++ show i
      getCachedData handle key (return i) Nothing
    
    stats <- readTVarIO (chStats handle)
    let total = csHits stats + csMisses stats
    total `shouldBe` 100

-- Property-based Tests
cachePropertyTests :: Spec
cachePropertyTests = around withTestCache $ describe "Property Tests" $ do
  it "caches any JSON-serializable data correctly" $ \handle ->
    property $ \(asset :: AssetData) -> monadicIO $ do
      let key = "test:prop:" ++ T.unpack (adSymbol asset)
      
      result1 <- run $ getCachedData handle key (return asset) Nothing
      result2 <- run $ getCachedData handle key (error "Should hit") Nothing
      
      assert $ result1 == asset
      assert $ result2 == asset
  
  it "maintains cache coherency" $ \handle ->
    property $ \(keys :: [String]) -> monadicIO $ do
      let uniqueKeys = take 10 $ filter (not . null) $ map (take 50) keys
      
      when (not $ null uniqueKeys) $ do
        -- Cache different values for each key
        forM_ (zip uniqueKeys [1..]) $ \(key, value) -> do
          run $ getCachedData handle ("test:coherency:" ++ key) 
                             (return value) Nothing
        
        -- Verify all cached correctly
        results <- forM (zip uniqueKeys [1..]) $ \(key, expectedValue) -> do
          actualValue <- run $ getCachedData handle ("test:coherency:" ++ key)
                                            (error "Should hit") Nothing
          return (actualValue == expectedValue)
        
        assert $ and results
  
  it "TTL always expires data" $ \handle ->
    property $ \(Positive ttl) -> monadicIO $ do
      when (ttl <= 10) $ do -- Keep test duration reasonable
        let key = "test:ttl:prop:" ++ show ttl
            value = "expires in " ++ show ttl
        
        run $ getCachedData handle key (return value) (Just ttl)
        run $ threadDelay ((ttl + 1) * 1000000)
        
        fetchCalled <- run $ newTVarIO False
        result <- run $ getCachedData handle key (do
          atomically $ writeTVar fetchCalled True
          return value) (Just ttl)
        
        called <- run $ readTVarIO fetchCalled
        assert called

-- Test Helpers
withTestCache :: (CacheHandle -> IO a) -> IO a
withTestCache action = do
  let testConfig = defaultCacheConfig
        { redisDb = 15  -- Use separate DB for tests
        , defaultTTL = 5  -- Short TTL for tests
        , enableLogging = False  -- Disable logging in tests
        }
  
  bracket
    (initCache testConfig)
    (\handle -> clearCache handle Nothing)  -- Clean up after tests
    action

-- Import for concurrent operations
import Control.Concurrent.Async (forConcurrently)