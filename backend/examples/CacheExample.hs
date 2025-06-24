{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}

-- | Example usage of the Cache module
module CacheExample where

import Cache
import Data.Aeson (FromJSON, ToJSON)
import GHC.Generics (Generic)
import Network.HTTP.Simple
import Control.Concurrent (threadDelay)
import Control.Concurrent.Async (async, wait)

-- Example data types
data CryptoPrice = CryptoPrice
  { symbol :: String
  , price :: Double
  , timestamp :: String
  } deriving (Generic, Show)

instance ToJSON CryptoPrice
instance FromJSON CryptoPrice

-- | Example: Fetch cryptocurrency prices with caching
fetchCryptoPrices :: IO [CryptoPrice]
fetchCryptoPrices = do
  -- Simulate API call
  putStrLn "Fetching fresh crypto prices from API..."
  threadDelay 1000000  -- Simulate 1 second API latency
  return 
    [ CryptoPrice "BTC" 45000.50 "2024-01-15T10:00:00Z"
    , CryptoPrice "ETH" 2500.75 "2024-01-15T10:00:00Z"
    , CryptoPrice "ADA" 0.65 "2024-01-15T10:00:00Z"
    ]

-- | Example usage demonstrating thread safety and performance
exampleUsage :: IO ()
exampleUsage = do
  -- Initialize cache
  cache <- initCache defaultCacheConfig
    { defaultTTL = 60  -- 1 minute TTL
    , enableLogging = True
    }
  
  putStrLn "=== Cache Example ==="
  
  -- First call - should miss cache
  prices1 <- getCachedData cache "crypto-prices" fetchCryptoPrices Nothing
  putStrLn $ "First call result: " ++ show prices1
  
  -- Second call - should hit cache
  prices2 <- getCachedData cache "crypto-prices" fetchCryptoPrices Nothing
  putStrLn $ "Second call result: " ++ show prices2
  
  -- Demonstrate thread safety with concurrent requests
  putStrLn "\n=== Testing concurrent access ==="
  
  -- Launch 10 concurrent requests
  asyncActions <- mapM (\n -> async $ do
    result <- getCachedData cache "crypto-prices" fetchCryptoPrices Nothing
    putStrLn $ "Thread " ++ show n ++ " completed"
    return result
    ) [1..10]
  
  -- Wait for all to complete
  results <- mapM wait asyncActions
  putStrLn $ "All threads completed. Cache should have prevented multiple fetches."
  
  -- Clear specific key
  clearCache cache (Just "crypto-prices")
  putStrLn "\nCache cleared for crypto-prices"
  
  -- Next call should miss cache again
  prices3 <- getCachedData cache "crypto-prices" fetchCryptoPrices Nothing
  putStrLn $ "After clear: " ++ show prices3

-- | Example with custom TTL
exampleWithCustomTTL :: IO ()
exampleWithCustomTTL = do
  cache <- initCache defaultCacheConfig
  
  -- Cache with 10 second TTL
  result <- getCachedData cache "short-lived-data" 
    (return "This data expires quickly") 
    (Just 10)
  
  putStrLn $ "Cached with 10s TTL: " ++ result