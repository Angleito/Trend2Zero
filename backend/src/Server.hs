{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE OverloadedStrings #-}

module Server where

import Servant
import API
import Handlers.Health
import Handlers.MarketData
import Handlers.Watchlist

-- | API proxy
api :: Proxy TrendZeroAPI
api = Proxy

-- | Main server implementation combining all handlers
server :: Server TrendZeroAPI
server = healthAPI :<|> marketAPI :<|> watchlistAPI
  where
    -- Health API handler
    healthAPI = healthHandler
    
    -- Market API handlers
    marketAPI = allAssetsHandler
            :<|> assetBySymbolHandler
            :<|> marketOverviewHandler
            :<|> historicalDataHandler
    
    -- Watchlist API handlers
    watchlistAPI = getWatchlistHandler
               :<|> addWatchlistHandler
               :<|> removeWatchlistHandler

-- | WAI Application
app :: Application
app = serve api server