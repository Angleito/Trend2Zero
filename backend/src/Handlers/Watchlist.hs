{-# LANGUAGE OverloadedStrings #-}

module Handlers.Watchlist where

import Control.Monad.IO.Class (liftIO)
import Data.Text (Text)
import qualified Data.Text as T
import Servant
import Types

-- | Handler for getting watchlist
getWatchlistHandler :: Handler WatchlistResponse
getWatchlistHandler = do
  liftIO $ putStrLn "[API] Fetching watchlist"
  
  -- Mock watchlist data
  let mockWatchlist = [ WatchlistItem
                          { wiAssetSymbol = "BTC"
                          , wiAssetType = "Cryptocurrency"
                          , wiDateAdded = "2024-01-01"
                          }
                      , WatchlistItem
                          { wiAssetSymbol = "ETH"
                          , wiAssetType = "Cryptocurrency"
                          , wiDateAdded = "2024-01-02"
                          }
                      ]
  
  return WatchlistResponse
    { wrData = WatchlistData { wdWatchlist = mockWatchlist }
    }

-- | Handler for adding to watchlist
addWatchlistHandler :: WatchlistItem -> Handler NoContent
addWatchlistHandler item = do
  liftIO $ putStrLn $ "[API] Adding to watchlist: " ++ T.unpack (wiAssetSymbol item)
  
  -- Mock implementation - in production would save to database
  return NoContent

-- | Handler for removing from watchlist
removeWatchlistHandler :: String -> Handler NoContent
removeWatchlistHandler symbol = do
  liftIO $ putStrLn $ "[API] Removing from watchlist: " ++ symbol
  
  -- Mock implementation - in production would remove from database
  return NoContent