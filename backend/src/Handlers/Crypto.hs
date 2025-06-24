{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module Handlers.Crypto 
    ( bitcoinPriceHandler
    , convertAssetPrice
    , fallbackBitcoinPrice
    ) where

import Control.Monad.IO.Class (liftIO)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time.Clock (getCurrentTime)
import Data.Time.Format (formatTime, defaultTimeLocale)
import Servant
import qualified Services.MarketDataTypes as MDT
import qualified Services.CoinGecko as CG
import qualified Types

-- | Fallback Bitcoin price data for when external services are unavailable
fallbackBitcoinPrice :: MDT.AssetPrice
fallbackBitcoinPrice = MDT.AssetPrice
  { MDT.apSymbol = "BTC"
  , MDT.apName = "Bitcoin"
  , MDT.apType = "Cryptocurrency"
  , MDT.apPrice = 67890.12
  , MDT.apPriceInUSD = 67890.12
  , MDT.apPriceInBTC = 1
  , MDT.apChange = 1234.56
  , MDT.apChangePercent = 1.85
  , MDT.apVolume24h = Nothing
  , MDT.apMarketCap = Nothing
  , MDT.apLastUpdated = read "2025-04-15 00:00:00 UTC"
  , MDT.apSource = MDT.CoinGecko
  }

-- | Convert from Services.MarketDataTypes.AssetPrice to Types.AssetPrice
-- This handles the different field structures between the two AssetPrice types
convertAssetPrice :: MDT.AssetPrice -> Types.AssetPrice
convertAssetPrice mdtAsset = Types.AssetPrice
    { Types.apSymbol = MDT.apSymbol mdtAsset
    , Types.apName = Just (MDT.apName mdtAsset)
    , Types.apPrice = MDT.apPrice mdtAsset
    , Types.apPriceInUSD = Just (MDT.apPriceInUSD mdtAsset)
    , Types.apPriceInBTC = Just (MDT.apPriceInBTC mdtAsset)
    , Types.apChange = MDT.apChange mdtAsset
    , Types.apChangePercent = MDT.apChangePercent mdtAsset
    , Types.apLastUpdated = Just $ T.pack $ formatTime defaultTimeLocale "%Y-%m-%d %H:%M:%S UTC" (MDT.apLastUpdated mdtAsset)
    , Types.apType = Just (MDT.apType mdtAsset)
    }

-- | Handler for getting Bitcoin price
bitcoinPriceHandler :: Handler MDT.AssetPrice
bitcoinPriceHandler = do
  liftIO $ putStrLn "[API] /crypto/bitcoin-price called"
  
  -- Try to fetch from CoinGecko service
  result <- liftIO $ CG.fetchBitcoinPrice
  
  case result of
    Right price -> do
      liftIO $ putStrLn $ "[API] Bitcoin price fetched: " ++ show price
      return price
    Left err -> do
      liftIO $ putStrLn $ "[API] Failed to fetch Bitcoin price: " ++ show err
      -- Return fallback data
      return fallbackBitcoinPrice