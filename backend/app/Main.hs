{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE OverloadedStrings #-}

module Main where

import Network.Wai.Handler.Warp (run)
import Servant
import Control.Monad.IO.Class (liftIO)
import Data.Time (getCurrentTime)
import qualified Data.Text as T
import Control.Concurrent.Async (async, wait)
import Control.Concurrent (forkIO, threadDelay)
import Control.Monad (forever, when)
import Data.Time.Clock (utctDayTime)

import API
import Types
import Config
import WebSocket.Server
import WebSocket.Types

-- API Implementation
api :: Proxy TrendZeroAPI
api = Proxy

server :: Server TrendZeroAPI
server = healthHandler :<|> marketHandlers :<|> watchlistHandlers
  where
    healthHandler :: Handler HealthStatus
    healthHandler = do
      currentTime <- liftIO getCurrentTime
      return $ HealthStatus "healthy" (show currentTime) "0.1.0"
    
    marketHandlers = getAssets :<|> getAsset :<|> getOverview :<|> getHistorical
    watchlistHandlers = getWatchlist :<|> addToWatchlist :<|> removeFromWatchlist

-- Market Handlers
getAssets :: Maybe String -> Maybe Int -> Maybe Int -> Maybe String -> Maybe String -> Maybe String -> Handler MarketData
getAssets category limit page search sort order = do
  liftIO $ putStrLn $ "Getting assets with params: " ++ show (category, limit, page, search, sort, order)
  -- TODO: Implement actual data fetching
  return $ MarketData [] 0 1 10

getAsset :: String -> Handler MarketAsset
getAsset symbol = do
  liftIO $ putStrLn $ "Getting asset: " ++ symbol
  -- TODO: Implement actual data fetching
  throwError err404

getOverview :: Handler MarketOverview
getOverview = do
  liftIO $ putStrLn "Getting market overview"
  -- TODO: Implement actual data fetching
  return $ MarketOverview 0 0 0 [] []

getHistorical :: String -> Maybe String -> Handler [HistoricalDataPoint]
getHistorical symbol period = do
  liftIO $ putStrLn $ "Getting historical data for: " ++ symbol ++ " period: " ++ show period
  -- TODO: Implement actual data fetching
  return []

-- Watchlist Handlers
getWatchlist :: Handler WatchlistResponse
getWatchlist = do
  liftIO $ putStrLn "Getting watchlist"
  -- TODO: Implement actual data fetching
  return $ WatchlistResponse (WatchlistData [])

addToWatchlist :: WatchlistItem -> Handler NoContent
addToWatchlist item = do
  liftIO $ putStrLn $ "Adding to watchlist: " ++ show item
  -- TODO: Implement actual data persistence
  return NoContent

removeFromWatchlist :: String -> Handler NoContent
removeFromWatchlist symbol = do
  liftIO $ putStrLn $ "Removing from watchlist: " ++ symbol
  -- TODO: Implement actual data persistence
  return NoContent

-- Application
app :: Application
app = serve api server

main :: IO ()
main = do
  config <- loadConfig
  
  -- Initialize WebSocket server state
  let wsConfig = WebSocketConfig 
        { wscHost = "0.0.0.0"
        , wscPort = 8081  -- WebSocket port
        , wscHeartbeatInterval = 30  -- 30 seconds
        , wscClientTimeout = 120     -- 2 minutes
        }
  wsState <- initServerState wsConfig
  
  -- Start WebSocket server in a separate thread
  putStrLn $ "Starting WebSocket server on port " ++ show (wscPort wsConfig) ++ "..."
  wsThread <- async $ runWebSocketServer wsConfig wsState
  
  -- Start mock price update broadcaster (for demo purposes)
  _ <- forkIO $ mockPriceUpdater wsState
  
  -- Start HTTP API server
  putStrLn $ "Starting Trend2Zero-FP Backend API on port " ++ show (appPort config) ++ "..."
  httpThread <- async $ run (appPort config) app
  
  -- Wait for both servers
  _ <- wait wsThread
  _ <- wait httpThread
  return ()

-- Mock price updater for demonstration
mockPriceUpdater :: ServerState -> IO ()
mockPriceUpdater wsState = forever $ do
  currentTime <- getCurrentTime
  
  -- Create mock price updates
  let btcPrice = AssetPrice
        { apSymbol = "BTC"
        , apName = Just "Bitcoin"
        , apPrice = 45000 + (fromIntegral (round (utctDayTime currentTime) `mod` 1000))
        , apPriceInUSD = Nothing
        , apPriceInBTC = Just 1.0
        , apChange = 150.5
        , apChangePercent = 0.34
        , apLastUpdated = Just (T.pack $ show currentTime)
        , apType = Just "crypto"
        }
      
      ethPrice = AssetPrice
        { apSymbol = "ETH"
        , apName = Just "Ethereum"
        , apPrice = 2500 + (fromIntegral (round (utctDayTime currentTime) `mod` 100))
        , apPriceInUSD = Nothing
        , apPriceInBTC = Just 0.055
        , apChange = 25.3
        , apChangePercent = 1.02
        , apLastUpdated = Just (T.pack $ show currentTime)
        , apType = Just "crypto"
        }
  
  -- Broadcast price updates
  broadcastPriceUpdate wsState btcPrice
  broadcastPriceUpdate wsState ethPrice
  
  -- Send occasional notifications
  when ((round (utctDayTime currentTime) :: Int) `mod` 60 == 0) $ do
    broadcastNotification wsState PriceAlert 
      "Price Alert" 
      "Bitcoin has crossed $45,000!" 
      Nothing
  
  -- Wait 5 seconds before next update
  threadDelay 5000000  -- 5 seconds