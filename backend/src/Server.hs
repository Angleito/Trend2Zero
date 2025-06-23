{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE OverloadedStrings #-}

module Server where

import Servant
import API
import Handlers.Health
import Handlers.Crypto
import Handlers.MarketData

-- | Main server implementation combining all handlers
server :: Server API
server = healthAPI :<|> cryptoAPI :<|> marketDataAPI
  where
    -- Health API handler
    healthAPI = healthHandler
    
    -- Crypto API handlers
    cryptoAPI = bitcoinPriceHandler
    
    -- Market Data API handlers
    marketDataAPI = 
         marketOverviewHandler
    :<|> assetPriceHandler
    :<|> searchAssetsHandler
    :<|> assetDetailsHandler
    :<|> popularAssetsHandler
    :<|> allAssetsHandler
    :<|> historicalDataHandler

-- | WAI Application
app :: Application
app = serve api server