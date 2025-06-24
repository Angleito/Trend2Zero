{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeOperators #-}

module API where

import Servant
import Data.Aeson
import Types

-- Main API Type
type TrendZeroAPI = "api" :> "v1" :> (
       "health" :> Get '[JSON] HealthStatus
  :<|> "market" :> MarketAPI
  :<|> "watchlist" :> WatchlistAPI
  )

-- Market API endpoints
type MarketAPI = 
       "assets" :> QueryParam "category" String 
                :> QueryParam "limit" Int
                :> QueryParam "page" Int
                :> QueryParam "search" String
                :> QueryParam "sort" String
                :> QueryParam "order" String
                :> Get '[JSON] MarketData
  :<|> "assets" :> Capture "symbol" String :> Get '[JSON] MarketAsset
  :<|> "overview" :> Get '[JSON] MarketOverview
  :<|> "historical" :> Capture "symbol" String 
                     :> QueryParam "period" String
                     :> Get '[JSON] [HistoricalDataPoint]

-- Watchlist API endpoints
type WatchlistAPI = 
       Get '[JSON] WatchlistResponse
  :<|> ReqBody '[JSON] WatchlistItem :> Post '[JSON] NoContent
  :<|> Capture "symbol" String :> Delete '[JSON] NoContent

-- Health Status Response is imported from Types module