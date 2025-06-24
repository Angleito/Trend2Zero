{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE LambdaCase #-}

module Services.CoinGecko
    ( CoinGeckoService(..)
    , CoinGeckoConfig(..)
    , CoinGeckoError(..)
    , createCoinGeckoService
    , getAssetPrice
    , getCryptoPrice
    , getHistoricalData
    , getHistoricalDataRange
    , getTopAssets
    , searchAssets
    , fetchBitcoinPrice
    ) where

import Control.Concurrent (threadDelay)
import Control.Concurrent.STM
import Control.Exception (Exception, throwIO, catch)
import Control.Monad (when)
import Control.Monad.IO.Class (liftIO)
import Data.Aeson
import Data.Aeson.Types (parseMaybe)
import qualified Data.Aeson.KeyMap as KM
import qualified Data.Aeson.Key as K
import qualified Data.ByteString.Char8 as BS8
import Data.Maybe (fromMaybe)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import qualified Data.Vector as V
import Data.Time.Clock.POSIX
import GHC.Generics
import Network.HTTP.Client
import Network.HTTP.Client.TLS
import Network.HTTP.Types.Status
import Network.HTTP.Types.Header
import qualified Services.MarketDataTypes as MDT

-- | CoinGecko API Configuration
data CoinGeckoConfig = CoinGeckoConfig
    { apiKey :: Maybe Text
    , baseURL :: Text
    , rateLimitDelay :: Int  -- microseconds between requests
    } deriving (Show, Eq)

-- | CoinGecko Service State
data CoinGeckoService = CoinGeckoService
    { config :: CoinGeckoConfig
    , httpManager :: Manager
    , lastRequestTime :: TVar (Maybe UTCTime)
    , symbolToIdMap :: [(Text, Text)]  -- Symbol to ID mappings
    }

-- | CoinGecko API Errors
data CoinGeckoError
    = RateLimitError
    | APIError Text
    | ParseError Text
    | NetworkError Text
    deriving (Show, Eq)

instance Exception CoinGeckoError

-- | CoinGecko Asset Price Response (internal)
data CGAssetPrice = CGAssetPrice
    { apSymbol :: Text
    , apName :: Text
    , apType :: Text
    , apPrice :: Double
    , apChange :: Double
    , apChangePercent :: Double
    , apVolume24h :: Maybe Double
    , apMarketCap :: Maybe Double
    , apLastUpdated :: UTCTime
    , apPriceInBTC :: Double
    , apPriceInUSD :: Double
    } deriving (Show, Eq, Generic)

instance ToJSON CGAssetPrice where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

instance FromJSON CGAssetPrice where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

-- | CoinGecko Historical Data Point (internal)
data CGHistoricalDataPoint = CGHistoricalDataPoint
    { hdpTimestamp :: Integer
    , hdpDate :: UTCTime
    , hdpPrice :: Double
    , hdpValue :: Double
    , hdpOpen :: Double
    , hdpHigh :: Double
    , hdpLow :: Double
    , hdpClose :: Double
    , hdpVolume :: Maybe Double
    } deriving (Show, Eq, Generic)

instance ToJSON CGHistoricalDataPoint where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 3 }

instance FromJSON CGHistoricalDataPoint where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 3 }

-- | CoinGecko Market Asset (internal)
data CGMarketAsset = CGMarketAsset
    { maSymbol :: Text
    , maName :: Text
    , maType :: Text
    , maPrice :: Double
    , maChangePercent :: Double
    , maPriceInUSD :: Double
    , maPriceInBTC :: Double
    , maChange :: Double
    , maLastUpdated :: Text
    } deriving (Show, Eq, Generic)

instance ToJSON CGMarketAsset where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

instance FromJSON CGMarketAsset where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = Prelude.drop 2 }

-- | CoinGecko API Response Types
data SimplePriceResponse = SimplePriceResponse
    { usd :: Double
    , usd_24h_change :: Maybe Double
    , usd_24h_vol :: Maybe Double
    , usd_market_cap :: Maybe Double
    , last_updated_at :: Maybe Integer
    } deriving (Show, Generic)

instance FromJSON SimplePriceResponse

data MarketChartResponse = MarketChartResponse
    { prices :: [[Double]]
    , total_volumes :: [[Double]]
    } deriving (Show, Generic)

instance FromJSON MarketChartResponse

data MarketDataItem = MarketDataItem
    { id :: Text
    , symbol :: Text
    , name :: Text
    , current_price :: Double
    , price_change_percentage_24h :: Maybe Double
    , price_change_24h :: Maybe Double
    , market_cap :: Maybe Double
    , total_volume :: Maybe Double
    , market_cap_rank :: Maybe Int
    , last_updated :: Text
    } deriving (Show, Generic)

instance FromJSON MarketDataItem

-- | Create a new CoinGecko service instance
createCoinGeckoService :: Maybe Text -> IO CoinGeckoService
createCoinGeckoService apiKey = do
    manager <- newManager tlsManagerSettings
    lastReqTime <- newTVarIO Nothing
    let config = CoinGeckoConfig
            { apiKey = apiKey
            , baseURL = "https://api.coingecko.com/api/v3"
            , rateLimitDelay = 15 * 1000000  -- 15 seconds in microseconds
            }
    return $ CoinGeckoService
        { config = config
        , httpManager = manager
        , lastRequestTime = lastReqTime
        , symbolToIdMap = 
            [ ("BTC", "bitcoin")
            , ("ETH", "ethereum")
            , ("SOL", "solana")
            ]
        }

-- | Apply rate limiting
applyRateLimit :: CoinGeckoService -> IO ()
applyRateLimit service = do
    now <- getCurrentTime
    lastTime <- readTVarIO (lastRequestTime service)
    case lastTime of
        Nothing -> atomically $ writeTVar (lastRequestTime service) (Just now)
        Just last -> do
            let elapsed = diffUTCTime now last
                delay = fromIntegral (rateLimitDelay $ config service) / 1000000
                remaining = delay - elapsed
            when (remaining > 0) $ do
                threadDelay $ round (remaining * 1000000)
            atomically $ writeTVar (lastRequestTime service) (Just now)

-- | Make HTTP request with error handling
makeRequest :: FromJSON a => CoinGeckoService -> String -> [(String, String)] -> IO (Either CoinGeckoError a)
makeRequest service path params = do
    applyRateLimit service
    let url = T.unpack (baseURL $ config service) ++ path
        headers = case apiKey (config service) of
            Nothing -> []
            Just key -> [(hAuthorization, BS8.pack $ "Bearer " ++ T.unpack key)]
        request = setQueryString (fmap (\(k,v) -> (BS8.pack k, Just $ BS8.pack v)) params) $
                  parseRequest_ url
        requestWithHeaders = request { requestHeaders = headers }
    
    response <- httpLbs requestWithHeaders (httpManager service) `catch` handleNetworkError
    
    case statusCode (responseStatus response) of
        200 -> case eitherDecode (responseBody response) of
            Left err -> return $ Left (ParseError $ T.pack err)
            Right val -> return $ Right val
        429 -> return $ Left RateLimitError
        code -> return $ Left (APIError $ T.pack $ "HTTP " ++ show code)
  where
    handleNetworkError :: HttpException -> IO (Response a)
    handleNetworkError e = throwIO $ NetworkError $ T.pack $ show e

-- | Get asset price by ID
getAssetPrice :: CoinGeckoService -> Text -> IO (Either CoinGeckoError MDT.AssetPrice)
getAssetPrice service assetId = do
    let params = [ ("ids", T.unpack assetId)
                 , ("vs_currencies", "usd")
                 , ("include_market_cap", "true")
                 , ("include_24hr_vol", "true")
                 , ("include_24hr_change", "true")
                 , ("include_last_updated_at", "true")
                 ]
    
    result <- makeRequest service "/simple/price" params
    case result of
        Left err -> return $ Left err
        Right (obj :: Value) -> case obj of
            Object hm -> case KM.lookup (K.fromText $ T.toLower assetId) hm of
                Just priceData -> case fromJSON priceData of
                    Success (resp :: SimplePriceResponse) -> do
                        now <- getCurrentTime
                        let updatedTime = case last_updated_at resp of
                                Just ts -> posixSecondsToUTCTime $ fromIntegral ts
                                Nothing -> now
                        return $ Right $ MDT.AssetPrice
                            { MDT.apSymbol = getSymbolFromId service assetId
                            , MDT.apName = T.toTitle assetId
                            , MDT.apType = "Cryptocurrency"
                            , MDT.apPrice = usd resp
                            , MDT.apPriceInUSD = usd resp
                            , MDT.apPriceInBTC = 0  -- Would need BTC price
                            , MDT.apChange = fromMaybe 0 (usd_24h_change resp)
                            , MDT.apChangePercent = fromMaybe 0 (usd_24h_change resp)
                            , MDT.apVolume24h = usd_24h_vol resp
                            , MDT.apMarketCap = usd_market_cap resp
                            , MDT.apLastUpdated = updatedTime
                            , MDT.apSource = MDT.CoinGecko
                            }
                    Error e -> return $ Left $ ParseError $ T.pack e
                Nothing -> return $ Left $ APIError "Asset not found"
            _ -> return $ Left $ ParseError "Invalid response format"

-- | Get crypto price by symbol
getCryptoPrice :: CoinGeckoService -> Text -> IO (Maybe MDT.AssetPrice)
getCryptoPrice service symbol = do
    let assetId = getIdFromSymbol service symbol
    result <- getAssetPrice service assetId
    case result of
        Right price -> return $ Just price
        Left err -> do
            -- Log error in production
            return Nothing

-- | Get historical data
getHistoricalData :: CoinGeckoService -> Text -> Int -> IO [MDT.HistoricalDataPoint]
getHistoricalData service symbol days = do
    let assetId = getIdFromSymbol service symbol
        interval = if days <= 30 then "hourly" else "daily"
        params = [ ("vs_currency", "usd")
                 , ("days", show days)
                 , ("interval", interval)
                 ]
    
    result <- makeRequest service ("/coins/" ++ T.unpack assetId ++ "/market_chart") params
    case result of
        Right (resp :: MarketChartResponse) -> do
            let priceData = prices resp
                volumeData = total_volumes resp
                dataPoints = Prelude.zipWith (processDataPoint volumeData) [0..] priceData
            return dataPoints
        Left _ -> return []
  where
    processDataPoint volumeData idx [timestamp, price] =
        let time = posixSecondsToUTCTime $ realToFrac (timestamp / 1000)
            volume = case Prelude.drop idx volumeData of
                ([_, vol]:_) -> Just vol
                _ -> Nothing
        in MDT.HistoricalDataPoint
            { MDT.hdTimestamp = round timestamp
            , MDT.hdDate = time
            , MDT.hdPrice = price
            , MDT.hdVolume = volume
            , MDT.hdMarketCap = Nothing
            }
    processDataPoint _ _ _ = error "Invalid price data format"

-- | Get historical data for date range
getHistoricalDataRange :: CoinGeckoService -> Text -> UTCTime -> UTCTime -> IO [MDT.HistoricalDataPoint]
getHistoricalDataRange service symbol fromTime toTime = do
    let assetId = getIdFromSymbol service symbol
        fromTimestamp = floor $ utcTimeToPOSIXSeconds fromTime
        toTimestamp = floor $ utcTimeToPOSIXSeconds toTime
        params = [ ("vs_currency", "usd")
                 , ("from", show fromTimestamp)
                 , ("to", show toTimestamp)
                 ]
    
    result <- makeRequest service ("/coins/" ++ T.unpack assetId ++ "/market_chart/range") params
    case result of
        Right (resp :: MarketChartResponse) -> do
            let priceData = prices resp
                volumeData = total_volumes resp
                dataPoints = Prelude.zipWith (processDataPoint volumeData) [0..] priceData
            return dataPoints
        Left _ -> return []
  where
    processDataPoint volumeData idx [timestamp, price] =
        let time = posixSecondsToUTCTime $ realToFrac (timestamp / 1000)
            volume = case Prelude.drop idx volumeData of
                ([_, vol]:_) -> Just vol
                _ -> Nothing
        in MDT.HistoricalDataPoint
            { MDT.hdTimestamp = round timestamp
            , MDT.hdDate = time
            , MDT.hdPrice = price
            , MDT.hdVolume = volume
            , MDT.hdMarketCap = Nothing
            }
    processDataPoint _ _ _ = error "Invalid price data format"

-- | Get top assets by market cap
getTopAssets :: CoinGeckoService -> Int -> IO [MDT.MarketAsset]
getTopAssets service limit = do
    let params = [ ("vs_currency", "usd")
                 , ("order", "market_cap_desc")
                 , ("per_page", show limit)
                 , ("page", "1")
                 ]
    
    result <- makeRequest service "/coins/markets" params
    case result of
        Right (items :: [MarketDataItem]) -> do
            btcPrice <- getBTCPrice items
            return $ fmap (convertToMarketAsset btcPrice) items
        Left _ -> return []
  where
    getBTCPrice items = case Prelude.filter (\item -> symbol item == "btc") items of
        (btc:_) -> return $ current_price btc
        _ -> return 0
    
    convertToMarketAsset btcPrice item = MDT.MarketAsset
        { MDT.maId = Services.CoinGecko.id item
        , MDT.maSymbol = T.toUpper $ symbol item
        , MDT.maName = name item
        , MDT.maType = "Cryptocurrency"
        , MDT.maPrice = current_price item
        , MDT.maPriceInBTC = if btcPrice > 0 then current_price item / btcPrice else 0
        , MDT.maChange24h = fromMaybe 0 $ price_change_24h item
        , MDT.maVolume24h = fromMaybe 0 $ total_volume item
        , MDT.maMarketCap = fromMaybe 0 $ market_cap item
        , MDT.maRank = fromMaybe 0 $ market_cap_rank item
        , MDT.maSource = MDT.CoinGecko
        }

-- | Search assets
searchAssets :: CoinGeckoService -> Text -> Int -> IO [MDT.MarketAsset]
searchAssets service query limit = do
    let params = [("query", T.unpack query)]
    
    result <- makeRequest service "/search" params
    case result of
        Right (obj :: Value) -> case obj of
            Object hm -> case KM.lookup (K.fromText "coins") hm of
                Just (Array coins) -> do
                    let searchResults = Prelude.take limit $ parseSearchResults (V.toList coins)
                    return searchResults
                _ -> return []
            _ -> return []
        Left _ -> return []
  where
    parseSearchResults coins = 
        [ MDT.MarketAsset
            { MDT.maId = fromMaybe "" $ parseMaybe (.: "id") obj
            , MDT.maSymbol = T.toUpper $ fromMaybe "" $ parseMaybe (.: "symbol") obj
            , MDT.maName = fromMaybe "" $ parseMaybe (.: "name") obj
            , MDT.maType = "Cryptocurrency"
            , MDT.maPrice = 0
            , MDT.maPriceInBTC = 0
            , MDT.maChange24h = 0
            , MDT.maVolume24h = 0
            , MDT.maMarketCap = 0
            , MDT.maRank = fromMaybe 0 $ parseMaybe (.: "market_cap_rank") obj
            , MDT.maSource = MDT.CoinGecko
            }
        | coin <- coins
        , Object obj <- [coin]
        ]

-- | Helper functions
getIdFromSymbol :: CoinGeckoService -> Text -> Text
getIdFromSymbol service symbol =
    let upperSymbol = T.toUpper symbol
    in fromMaybe (T.toLower symbol) $ lookup upperSymbol (symbolToIdMap service)

getSymbolFromId :: CoinGeckoService -> Text -> Text
getSymbolFromId service assetId =
    let reverseMap = [(v, k) | (k, v) <- symbolToIdMap service]
    in fromMaybe (T.toUpper assetId) $ lookup assetId reverseMap

-- | Fetch Bitcoin price - simplified function for the Crypto handler
fetchBitcoinPrice :: IO (Either CoinGeckoError MDT.AssetPrice)
fetchBitcoinPrice = do
    service <- createCoinGeckoService Nothing
    getAssetPrice service "bitcoin"