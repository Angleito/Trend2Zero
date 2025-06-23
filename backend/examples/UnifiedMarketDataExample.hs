{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module Main where

import Control.Concurrent.Async
import Control.Exception (bracket, catch, SomeException)
import Control.Monad (forM_, when)
import Data.List (sortOn)
import Data.Maybe (catMaybes, fromMaybe)
import qualified Data.Text as T
import qualified Data.Text.IO as TIO
import Data.Time
import System.Environment (lookupEnv)

import qualified Config.Services as Config
import qualified Services.MarketData as MD
import qualified Services.MetalPrice as MP
import qualified Services.ApiLogger as Logger
import qualified Services.DataTransform as Transform

-- | Example application showing unified market data access
main :: IO ()
main = do
    putStrLn "=== Unified Market Data Example ==="
    putStrLn "This example demonstrates:"
    putStrLn "- Fetching data from multiple sources"
    putStrLn "- Unified data transformation"
    putStrLn "- Comprehensive error handling"
    putStrLn "- API call logging and metrics"
    putStrLn ""
    
    -- Load configuration
    config <- Config.loadServicesConfig
    putStrLn "✓ Configuration loaded"
    
    -- Initialize services
    marketService <- MD.createMarketDataService
    putStrLn "✓ Market data service initialized"
    
    -- Run example scenarios
    runExampleScenarios marketService
    
    putStrLn "\n=== Example completed ==="

-- | Run various example scenarios
runExampleScenarios :: MD.MarketDataService -> IO ()
runExampleScenarios service = do
    -- Scenario 1: Get popular assets with enriched data
    scenario1 service
    
    -- Scenario 2: Fetch specific asset prices
    scenario2 service
    
    -- Scenario 3: Historical data analysis
    scenario3 service
    
    -- Scenario 4: Concurrent data fetching
    scenario4 service
    
    -- Scenario 5: Error handling demonstration
    scenario5 service

-- | Scenario 1: Get popular assets with enriched data
scenario1 :: MD.MarketDataService -> IO ()
scenario1 service = do
    putStrLn "\n--- Scenario 1: Popular Assets with Live Prices ---"
    
    assets <- MD.getPopularAssets service
    
    putStrLn $ "Retrieved " ++ show (length assets) ++ " popular assets:"
    putStrLn ""
    
    -- Sort by price for display
    let sorted = sortOn (negate . MD.maPrice) assets
    
    forM_ sorted $ \asset -> do
        let priceStr = formatPrice (MD.maPrice asset)
            changeStr = case MD.maChange24h asset of
                Just change -> formatChange change
                Nothing -> "N/A"
            sourceStr = show (MD.maSource asset)
        
        putStrLn $ T.unpack (MD.maSymbol asset) ++ " (" ++ 
                  T.unpack (MD.maName asset) ++ "): " ++
                  priceStr ++ " | " ++ changeStr ++ " | " ++ sourceStr

-- | Scenario 2: Fetch specific asset prices
scenario2 :: MD.MarketDataService -> IO ()
scenario2 service = do
    putStrLn "\n--- Scenario 2: Specific Asset Prices ---"
    
    let symbols = ["BTC", "ETH", "XAU", "XAG", "AAPL", "GOOGL"]
    
    -- Fetch all prices concurrently
    prices <- forConcurrently symbols $ \symbol -> do
        maybePrice <- MD.getAssetPrice service symbol
        return (symbol, maybePrice)
    
    putStrLn "Asset prices:"
    forM_ prices $ \(symbol, maybePrice) -> do
        case maybePrice of
            Nothing -> putStrLn $ T.unpack symbol ++ ": Failed to fetch"
            Just price -> do
                let priceStr = formatPrice (MD.apPrice price)
                    typeStr = T.unpack (MD.apType price)
                    sourceStr = show (MD.apSource price)
                putStrLn $ T.unpack symbol ++ " (" ++ typeStr ++ "): " ++ 
                          priceStr ++ " [" ++ sourceStr ++ "]"

-- | Scenario 3: Historical data analysis
scenario3 :: MD.MarketDataService -> IO ()
scenario3 service = do
    putStrLn "\n--- Scenario 3: Historical Data Analysis ---"
    
    -- Get 7 days of Bitcoin data
    btcHistory <- MD.getHistoricalData service "BTC" 7
    
    if null btcHistory
        then putStrLn "No historical data available"
        else do
            let prices = map MD.hdpPrice btcHistory
                avgPrice = sum prices / fromIntegral (length prices)
                maxPrice = maximum prices
                minPrice = minimum prices
                volatility = maxPrice - minPrice
            
            putStrLn $ "Bitcoin 7-day analysis:"
            putStrLn $ "  Data points: " ++ show (length btcHistory)
            putStrLn $ "  Average price: " ++ formatPrice avgPrice
            putStrLn $ "  Max price: " ++ formatPrice maxPrice
            putStrLn $ "  Min price: " ++ formatPrice minPrice
            putStrLn $ "  Price range: " ++ formatPrice volatility

-- | Scenario 4: Concurrent data fetching with transformation
scenario4 :: MD.MarketDataService -> IO ()
scenario4 service = do
    putStrLn "\n--- Scenario 4: Concurrent Data Fetching ---"
    
    let assetGroups = 
            [ ("Cryptocurrencies", ["BTC", "ETH", "SOL"])
            , ("Precious Metals", ["XAU", "XAG", "XPT", "XPD"])
            , ("Tech Stocks", ["AAPL", "GOOGL", "MSFT"])
            ]
    
    -- Fetch all groups concurrently
    results <- forConcurrently assetGroups $ \(groupName, symbols) -> do
        prices <- forConcurrently symbols $ MD.getAssetPrice service
        return (groupName, catMaybes prices)
    
    -- Display results
    forM_ results $ \(groupName, prices) -> do
        putStrLn $ "\n" ++ T.unpack groupName ++ ":"
        if null prices
            then putStrLn "  No data available"
            else do
                let totalValue = sum $ map MD.apPrice prices
                    avgPrice = totalValue / fromIntegral (length prices)
                
                forM_ prices $ \price -> do
                    putStrLn $ "  " ++ T.unpack (MD.apSymbol price) ++ ": " ++ 
                              formatPrice (MD.apPrice price)
                
                putStrLn $ "  Average: " ++ formatPrice avgPrice

-- | Scenario 5: Error handling demonstration
scenario5 :: MD.MarketDataService -> IO ()
scenario5 service = do
    putStrLn "\n--- Scenario 5: Error Handling ---"
    
    -- Test various error conditions
    let testCases = 
            [ ("Invalid symbol", "INVALID123")
            , ("Empty symbol", "")
            , ("Special characters", "BTC/USD")
            ]
    
    forM_ testCases $ \(description, symbol) -> do
        putStr $ T.unpack description ++ ": "
        result <- MD.getAssetPrice service symbol `catch` handleError
        case result of
            Nothing -> putStrLn "Handled gracefully (returned Nothing)"
            Just _ -> putStrLn "WARNING: Unexpected success"
  where
    handleError :: SomeException -> IO (Maybe MD.AssetPrice)
    handleError e = do
        putStrLn $ "Exception caught: " ++ show e
        return Nothing

-- | Utility functions

formatPrice :: Double -> String
formatPrice price
    | price >= 1000 = "$" ++ show (round price :: Int)
    | price >= 1 = "$" ++ show (round (price * 100) / 100 :: Double)
    | otherwise = "$" ++ show price

formatChange :: Double -> String
formatChange change
    | change > 0 = "+" ++ show (round (change * 100) / 100 :: Double) ++ "%"
    | change < 0 = show (round (change * 100) / 100 :: Double) ++ "%"
    | otherwise = "0.00%"