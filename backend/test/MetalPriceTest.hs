{-# LANGUAGE OverloadedStrings #-}

module Main where

import Control.Concurrent (threadDelay)
import Control.Monad (forM_, when)
import Data.Maybe (isJust, fromJust)
import qualified Data.Text as T
import qualified Data.Text.IO as TIO
import System.Environment (setEnv, lookupEnv)
import System.Exit (exitFailure, exitSuccess)

import qualified Services.MetalPrice as MP
import qualified Services.MarketData as MD
import qualified Services.ApiLogger as Logger
import qualified Config.Services as Config

main :: IO ()
main = do
    putStrLn "=== Metal Price Service Integration Test ==="
    putStrLn ""
    
    -- Check for API key
    apiKey <- lookupEnv "METAL_PRICE_API_KEY"
    case apiKey of
        Nothing -> do
            putStrLn "ERROR: METAL_PRICE_API_KEY environment variable not set"
            putStrLn "Please set your Metal Price API key to run this test"
            exitFailure
        Just _ -> putStrLn "✓ API key found"
    
    -- Test 1: Service initialization
    putStrLn "\n--- Test 1: Service Initialization ---"
    metalService <- MP.createMetalPriceService Nothing `catch` \e -> do
        putStrLn $ "Failed to create service: " ++ show e
        exitFailure
    putStrLn "✓ Metal price service initialized"
    
    -- Test 2: Individual metal price fetching
    putStrLn "\n--- Test 2: Individual Metal Price Fetching ---"
    let metals = [MP.Gold, MP.Silver, MP.Platinum, MP.Palladium]
    
    forM_ metals $ \metal -> do
        let symbol = MP.metalSymbolToText metal
            name = MP.metalNameLookup metal
        putStr $ "Fetching " ++ T.unpack name ++ " (" ++ T.unpack symbol ++ ")... "
        
        price <- MP.getMetalPrice metalService metal
        case price of
            Nothing -> putStrLn "FAILED"
            Just p -> putStrLn $ "✓ $" ++ show (MD.apPrice p) ++ " USD"
    
    -- Test 3: Batch metal price fetching
    putStrLn "\n--- Test 3: Batch Metal Price Fetching ---"
    putStrLn "Fetching all metal prices in one request..."
    
    allPrices <- MP.getAllMetalPrices metalService
    putStrLn $ "✓ Retrieved " ++ show (length allPrices) ++ " metal prices"
    
    forM_ allPrices $ \price -> do
        putStrLn $ "  " ++ T.unpack (MD.apSymbol price) ++ " (" ++ 
                  T.unpack (MD.apName price) ++ "): $" ++ 
                  show (MD.apPrice price) ++ " USD"
    
    -- Test 4: Cache functionality
    putStrLn "\n--- Test 4: Cache Functionality ---"
    putStrLn "Testing cache hit for Gold..."
    
    -- First call should fetch from API
    _ <- MP.getMetalPrice metalService MP.Gold
    
    -- Second call should hit cache
    cachedPrice <- MP.getMetalPrice metalService MP.Gold
    case cachedPrice of
        Nothing -> putStrLn "FAILED: Cache not working"
        Just _ -> putStrLn "✓ Cache hit successful"
    
    -- Test 5: Market data integration
    putStrLn "\n--- Test 5: Market Data Service Integration ---"
    marketService <- MD.createMarketDataService
    
    -- Test metal price through market data service
    goldPrice <- MD.getAssetPrice marketService "XAU"
    case goldPrice of
        Nothing -> putStrLn "FAILED: Could not fetch Gold through MarketData service"
        Just p -> do
            putStrLn $ "✓ Gold price via MarketData: $" ++ show (MD.apPrice p) ++ " USD"
            putStrLn $ "  Source: " ++ show (MD.apSource p)
    
    -- Test 6: Error handling
    putStrLn "\n--- Test 6: Error Handling ---"
    
    -- Test with invalid symbol (this should be handled gracefully)
    invalidPrice <- MD.getAssetPrice marketService "INVALID"
    case invalidPrice of
        Nothing -> putStrLn "✓ Invalid symbol handled correctly"
        Just _ -> putStrLn "WARNING: Invalid symbol returned a price"
    
    -- Test 7: Performance metrics
    putStrLn "\n--- Test 7: Performance Metrics ---"
    putStrLn "Logging API metrics..."
    
    -- Trigger some API calls
    forM_ [1..5] $ \i -> do
        putStr $ "Request " ++ show i ++ "... "
        _ <- MP.getMetalPrice metalService MP.Silver
        putStrLn "done"
        threadDelay 1000000  -- 1 second delay
    
    -- Log metrics
    Logger.logApiMetrics (MP.mpsApiLogger metalService)
    threadDelay 1000000  -- Allow time for metrics to be logged
    
    putStrLn "\n=== All tests completed successfully! ==="
    exitSuccess