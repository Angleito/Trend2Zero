{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module Handlers.Crypto where

import Control.Monad.IO.Class (liftIO)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time.Clock (getCurrentTime)
import Servant
import Types
import qualified Services.CoinGecko as CG

-- | Fallback Bitcoin price data for when external services are unavailable
fallbackBitcoinPrice :: AssetPrice
fallbackBitcoinPrice = AssetPrice
  { apSymbol = "BTC"
  , apName = Just "Bitcoin"
  , apType = Just "Cryptocurrency"
  , apPrice = 67890.12
  , apChange = 1234.56
  , apChangePercent = 1.85
  , apPriceInBTC = Just 1
  , apPriceInUSD = Just 67890.12
  , apLastUpdated = Just "2025-04-15T00:00:00Z"
  }

-- | Convert CoinGecko AssetPrice to our AssetPrice type
convertAssetPrice :: CG.AssetPrice -> AssetPrice
convertAssetPrice cgPrice = AssetPrice
  { apSymbol = CG.apSymbol cgPrice
  , apName = Just $ CG.apName cgPrice
  , apType = Just $ CG.apType cgPrice
  , apPrice = CG.apPrice cgPrice
  , apChange = CG.apChange cgPrice
  , apChangePercent = CG.apChangePercent cgPrice
  , apPriceInBTC = Just $ CG.apPriceInBTC cgPrice
  , apPriceInUSD = Just $ CG.apPriceInUSD cgPrice
  , apLastUpdated = Just $ T.pack $ show $ CG.apLastUpdated cgPrice
  }

-- | Handler for getting Bitcoin price
bitcoinPriceHandler :: Handler AssetPrice
bitcoinPriceHandler = do
  liftIO $ putStrLn "[API] /crypto/bitcoin-price called"
  
  -- Try to fetch from CoinGecko service
  result <- liftIO $ CG.fetchBitcoinPrice
  
  case result of
    Right cgPrice -> do
      let price = convertAssetPrice cgPrice
      liftIO $ putStrLn $ "[API] Bitcoin price fetched: " ++ show price
      return price
    Left err -> do
      liftIO $ putStrLn $ "[API] Failed to fetch Bitcoin price: " ++ show err
      -- Return fallback data
      return fallbackBitcoinPrice