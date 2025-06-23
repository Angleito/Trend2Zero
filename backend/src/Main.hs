{-# LANGUAGE OverloadedStrings #-}

module Main where

import Network.Wai.Handler.Warp (run)
import Network.Wai.Middleware.Cors
import Network.Wai.Middleware.RequestLogger (logStdoutDev)
import Server (app)
import System.Environment (lookupEnv)
import Text.Read (readMaybe)

-- | CORS middleware configuration
corsPolicy :: CorsResourcePolicy
corsPolicy = CorsResourcePolicy
    { corsOrigins = Nothing  -- Allow all origins in development
    , corsMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    , corsRequestHeaders = ["Content-Type", "Authorization"]
    , corsExposedHeaders = Nothing
    , corsMaxAge = Just 86400
    , corsVaryOrigin = False
    , corsRequireOrigin = False
    , corsIgnoreFailures = False
    }

-- | Main entry point
main :: IO ()
main = do
    -- Get port from environment or use default
    portStr <- lookupEnv "PORT"
    let port = maybe 8080 readMaybe portStr :: Maybe Int
        actualPort = maybe 8080 id port
    
    putStrLn $ "Starting Trend2Zero API server on port " ++ show actualPort
    putStrLn "Available endpoints:"
    putStrLn "  GET /health"
    putStrLn "  GET /crypto/bitcoin-price"
    putStrLn "  GET /market-data/overview"
    putStrLn "  GET /market-data/price/:symbol"
    putStrLn "  GET /market-data/search?q=query&limit=10"
    putStrLn "  GET /market-data/asset/:symbol"
    putStrLn "  GET /market-data/popular"
    putStrLn "  GET /market-data/assets"
    putStrLn "  GET /market-data/historical/:symbol"
    
    -- Run the server with middleware
    run actualPort $ logStdoutDev $ cors (const $ Just corsPolicy) app