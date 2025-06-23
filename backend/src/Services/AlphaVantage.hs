{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE LambdaCase #-}

module Services.AlphaVantage
    ( AlphaVantageService(..)
    , AlphaVantageConfig(..)
    , AlphaVantageError(..)
    , AssetData(..)
    , HistoricalDataPoint(..)
    , CurrencyExchangeRate(..)
    , createAlphaVantageService
    , getStockData
    , getCryptoCurrencyData
    , getHistoricalData
    , getCurrencyExchangeRate
    ) where

import Control.Concurrent (threadDelay)
import Control.Concurrent.STM
import Control.Exception (Exception, throwIO, catch)
import Control.Monad (when)
import Control.Monad.IO.Class (liftIO)
import Data.Aeson
import Data.ByteString.Char8 as BS8
import qualified Data.HashMap.Strict as HM
import Data.List (sortOn)
import Data.Maybe (fromMaybe, listToMaybe)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import Data.Time.Format
import GHC.Generics
import Network.HTTP.Client
import Network.HTTP.Client.TLS
import Network.HTTP.Types.Status

-- | AlphaVantage API Configuration
data AlphaVantageConfig = AlphaVantageConfig
    { apiKey :: Text
    , baseURL :: Text
    , rateLimitDelay :: Int  -- microseconds between requests (15 seconds for free tier)
    } deriving (Show, Eq)

-- | AlphaVantage Service State
data AlphaVantageService = AlphaVantageService
    { config :: AlphaVantageConfig
    , httpManager :: Manager
    , lastRequestTime :: TVar (Maybe UTCTime)
    }

-- | AlphaVantage API Errors
data AlphaVantageError
    = RateLimitError Text
    , APIError Text
    , ParseError Text
    , NetworkError Text
    | NoDataError Text
    deriving (Show, Eq)

instance Exception AlphaVantageError

-- | Asset Data Response
data AssetData = AssetData
    { adSymbol :: Text
    , adName :: Text
    , adType :: Text  -- "Stocks" or "Cryptocurrency"
    , adPrice :: Double
    , adChange :: Double
    , adChangePercent :: Double
    , adPriceInBTC :: Double
    , adPriceInUSD :: Double
    , adLastUpdated :: Text
    } deriving (Show, Eq, Generic)

instance ToJSON AssetData where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 2 }

instance FromJSON AssetData where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 2 }

-- | Historical Data Point (reuse from CoinGecko)
data HistoricalDataPoint = HistoricalDataPoint
    { hdpTimestamp :: Integer
    , hdpDate :: UTCTime
    , hdpPrice :: Double
    , hdpValue :: Double
    , hdpOpen :: Double
    , hdpHigh :: Double
    , hdpLow :: Double
    , hdpClose :: Double
    , hdpVolume :: Int
    } deriving (Show, Eq, Generic)

instance ToJSON HistoricalDataPoint where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 3 }

instance FromJSON HistoricalDataPoint where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 3 }

-- | Currency Exchange Rate
data CurrencyExchangeRate = CurrencyExchangeRate
    { cerFromCurrencyCode :: Text
    , cerFromCurrencyName :: Text
    , cerToCurrencyCode :: Text
    , cerToCurrencyName :: Text
    , cerExchangeRate :: Double
    , cerLastRefreshed :: Text
    , cerTimeZone :: Text
    } deriving (Show, Eq, Generic)

instance ToJSON CurrencyExchangeRate where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 3 }

instance FromJSON CurrencyExchangeRate where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 3 }

-- | AlphaVantage API Response Types
data StockQuote = StockQuote
    { sq_symbol :: Text
    , sq_open :: Text
    , sq_high :: Text
    , sq_low :: Text
    , sq_price :: Text
    , sq_volume :: Text
    , sq_latestTradingDay :: Text
    , sq_previousClose :: Text
    , sq_change :: Text
    , sq_changePercent :: Text
    } deriving (Show, Generic)

instance FromJSON StockQuote where
    parseJSON = withObject "StockQuote" $ \v -> StockQuote
        <$> v .: "01. symbol"
        <*> v .: "02. open"
        <*> v .: "03. high"
        <*> v .: "04. low"
        <*> v .: "05. price"
        <*> v .: "06. volume"
        <*> v .: "07. latest trading day"
        <*> v .: "08. previous close"
        <*> v .: "09. change"
        <*> v .: "10. change percent"

data DailyValue = DailyValue
    { dv_open :: Text
    , dv_high :: Text
    , dv_low :: Text
    , dv_close :: Text
    , dv_volume :: Text
    } deriving (Show, Generic)

instance FromJSON DailyValue where
    parseJSON = withObject "DailyValue" $ \v -> DailyValue
        <$> v .: "1. open"
        <*> v .: "2. high"
        <*> v .: "3. low"
        <*> v .: "4. close"
        <*> v .: "5. volume"

data CryptoDailyValue = CryptoDailyValue
    { cdv_openUSD :: Text
    , cdv_highUSD :: Text
    , cdv_lowUSD :: Text
    , cdv_closeUSD :: Text
    , cdv_volume :: Text
    , cdv_marketCap :: Text
    } deriving (Show, Generic)

instance FromJSON CryptoDailyValue where
    parseJSON = withObject "CryptoDailyValue" $ \v -> CryptoDailyValue
        <$> v .: "1a. open (USD)"
        <*> v .: "2a. high (USD)"
        <*> v .: "3a. low (USD)"
        <*> v .: "4a. close (USD)"
        <*> v .: "5. volume"
        <*> v .: "6. market cap (USD)"

data ExchangeRateData = ExchangeRateData
    { erd_fromCurrencyCode :: Text
    , erd_fromCurrencyName :: Text
    , erd_toCurrencyCode :: Text
    , erd_toCurrencyName :: Text
    , erd_exchangeRate :: Text
    , erd_lastRefreshed :: Text
    , erd_timeZone :: Text
    , erd_bidPrice :: Text
    , erd_askPrice :: Text
    } deriving (Show, Generic)

instance FromJSON ExchangeRateData where
    parseJSON = withObject "ExchangeRateData" $ \v -> ExchangeRateData
        <$> v .: "1. From_Currency Code"
        <*> v .: "2. From_Currency Name"
        <*> v .: "3. To_Currency Code"
        <*> v .: "4. To_Currency Name"
        <*> v .: "5. Exchange Rate"
        <*> v .: "6. Last Refreshed"
        <*> v .: "7. Time Zone"
        <*> v .: "8. Bid Price"
        <*> v .: "9. Ask Price"

-- | Create a new AlphaVantage service instance
createAlphaVantageService :: Text -> IO AlphaVantageService
createAlphaVantageService apiKey = do
    manager <- newManager tlsManagerSettings
    lastReqTime <- newTVarIO Nothing
    let config = AlphaVantageConfig
            { apiKey = apiKey
            , baseURL = "https://www.alphavantage.co/query"
            , rateLimitDelay = 15 * 1000000  -- 15 seconds for free tier
            }
    return $ AlphaVantageService
        { config = config
        , httpManager = manager
        , lastRequestTime = lastReqTime
        }

-- | Apply rate limiting
applyRateLimit :: AlphaVantageService -> IO ()
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
makeRequest :: FromJSON a => AlphaVantageService -> [(String, String)] -> IO (Either AlphaVantageError a)
makeRequest service params = do
    applyRateLimit service
    let allParams = ("apikey", T.unpack (apiKey $ config service)) : params
        url = T.unpack (baseURL $ config service)
        request = setQueryString (fmap (\(k,v) -> (BS8.pack k, Just $ BS8.pack v)) allParams) $
                  parseRequest_ url
    
    response <- httpLbs request (httpManager service) `catch` handleNetworkError
    
    let body = responseBody response
    -- Check for API errors in response
    case eitherDecode body :: Either String Value of
        Right (Object obj) 
            | HM.member "Note" obj -> return $ Left $ RateLimitError "API call frequency limit reached"
            | HM.member "Error Message" obj -> do
                let errMsg = fromMaybe "Unknown error" $ parseMaybe (.: "Error Message") (Object obj)
                return $ Left $ APIError errMsg
        _ -> pure ()
    
    case statusCode (responseStatus response) of
        200 -> case eitherDecode body of
            Left err -> return $ Left (ParseError $ T.pack err)
            Right val -> return $ Right val
        code -> return $ Left (APIError $ T.pack $ "HTTP " ++ show code)
  where
    handleNetworkError :: HttpException -> IO (Response a)
    handleNetworkError e = throwIO $ NetworkError $ T.pack $ show e

-- | Get stock data
getStockData :: AlphaVantageService -> Text -> IO (Either AlphaVantageError AssetData)
getStockData service symbol = do
    let params = [ ("function", "GLOBAL_QUOTE")
                 , ("symbol", T.unpack symbol)
                 ]
    
    result <- makeRequest service params
    case result of
        Left err -> return $ Left err
        Right (obj :: Value) -> case obj of
            Object hm -> case HM.lookup "Global Quote" hm of
                Just quoteData -> case fromJSON quoteData of
                    Success (quote :: StockQuote) -> do
                        -- Try to get BTC exchange rate
                        btcRate <- getCurrencyExchangeRate service symbol "BTC"
                        let btcPrice = case btcRate of
                                Right rate -> read (T.unpack $ sq_price quote) / cerExchangeRate rate
                                Left _ -> 0
                        
                        return $ Right $ AssetData
                            { adSymbol = sq_symbol quote
                            , adName = sq_symbol quote
                            , adType = "Stocks"
                            , adPrice = read $ T.unpack $ sq_price quote
                            , adChange = read $ T.unpack $ sq_change quote
                            , adChangePercent = read $ T.unpack $ T.filter (/= '%') $ sq_changePercent quote
                            , adPriceInBTC = btcPrice
                            , adPriceInUSD = read $ T.unpack $ sq_price quote
                            , adLastUpdated = sq_latestTradingDay quote
                            }
                    Error e -> return $ Left $ ParseError $ T.pack e
                Nothing -> return $ Left $ NoDataError "No quote data found"
            _ -> return $ Left $ ParseError "Invalid response format"

-- | Get cryptocurrency data
getCryptoCurrencyData :: AlphaVantageService -> Text -> IO (Either AlphaVantageError AssetData)
getCryptoCurrencyData service symbol = do
    let params = [ ("function", "DIGITAL_CURRENCY_DAILY")
                 , ("symbol", T.unpack symbol)
                 , ("market", "USD")
                 ]
    
    result <- makeRequest service params
    case result of
        Left err -> return $ Left err
        Right (obj :: Value) -> case obj of
            Object hm -> case HM.lookup "Time Series (Digital Currency Daily)" hm of
                Just (Object timeSeries) -> 
                    let sortedDates = sortOn (Down . fst) $ HM.toList timeSeries
                    in case listToMaybe sortedDates of
                        Just (latestDate, latestData) -> case fromJSON latestData of
                            Success (crypto :: CryptoDailyValue) -> do
                                -- Try to get BTC exchange rate
                                btcRate <- if symbol /= "BTC" 
                                    then getCurrencyExchangeRate service symbol "BTC"
                                    else return $ Right $ CurrencyExchangeRate "" "" "" "" 1 "" ""
                                
                                let usdPrice = read $ T.unpack $ cdv_closeUSD crypto
                                    btcPrice = case btcRate of
                                        Right rate -> usdPrice / cerExchangeRate rate
                                        Left _ -> if symbol == "BTC" then 1 else 0
                                
                                return $ Right $ AssetData
                                    { adSymbol = symbol
                                    , adName = symbol
                                    , adType = "Cryptocurrency"
                                    , adPrice = usdPrice
                                    , adChange = 0  -- AlphaVantage doesn't provide daily change directly
                                    , adChangePercent = 0
                                    , adPriceInBTC = btcPrice
                                    , adPriceInUSD = usdPrice
                                    , adLastUpdated = latestDate
                                    }
                            Error e -> return $ Left $ ParseError $ T.pack e
                        Nothing -> return $ Left $ NoDataError "No time series data found"
                Nothing -> return $ Left $ NoDataError "No cryptocurrency data found"
            _ -> return $ Left $ ParseError "Invalid response format"

-- | Get historical data
getHistoricalData :: AlphaVantageService -> Text -> Int -> IO [HistoricalDataPoint]
getHistoricalData service symbol days = do
    let params = [ ("function", "TIME_SERIES_DAILY")
                 , ("symbol", T.unpack symbol)
                 , ("outputsize", if days > 100 then "full" else "compact")
                 ]
    
    result <- makeRequest service params
    case result of
        Right (obj :: Value) -> case obj of
            Object hm -> case HM.lookup "Time Series (Daily)" hm of
                Just (Object timeSeries) -> do
                    let dataPoints = take days $ parseTimeSeriesData timeSeries
                    return dataPoints
                _ -> return []
            _ -> return []
        Left _ -> return []
  where
    parseTimeSeriesData timeSeries =
        let sortedData = sortOn (fst) $ HM.toList timeSeries
        in [ HistoricalDataPoint
                { hdpTimestamp = round $ utcTimeToPOSIXSeconds date
                , hdpDate = date
                , hdpPrice = close
                , hdpValue = close
                , hdpOpen = open
                , hdpHigh = high
                , hdpLow = low
                , hdpClose = close
                , hdpVolume = volume
                }
           | (dateStr, valData) <- sortedData
           , let date = parseTimeOrError True defaultTimeLocale "%Y-%m-%d" (T.unpack dateStr) :: UTCTime
           , Success (DailyValue openStr highStr lowStr closeStr volumeStr) <- [fromJSON valData]
           , let open = read $ T.unpack openStr
                 high = read $ T.unpack highStr
                 low = read $ T.unpack lowStr
                 close = read $ T.unpack closeStr
                 volume = read $ T.unpack volumeStr
           ]

-- | Get currency exchange rate
getCurrencyExchangeRate :: AlphaVantageService -> Text -> Text -> IO (Either AlphaVantageError CurrencyExchangeRate)
getCurrencyExchangeRate service fromCurrency toCurrency = do
    let params = [ ("function", "CURRENCY_EXCHANGE_RATE")
                 , ("from_currency", T.unpack fromCurrency)
                 , ("to_currency", T.unpack toCurrency)
                 ]
    
    result <- makeRequest service params
    case result of
        Left err -> return $ Left err
        Right (obj :: Value) -> case obj of
            Object hm -> case HM.lookup "Realtime Currency Exchange Rate" hm of
                Just rateData -> case fromJSON rateData of
                    Success (erd :: ExchangeRateData) -> return $ Right $ CurrencyExchangeRate
                        { cerFromCurrencyCode = erd_fromCurrencyCode erd
                        , cerFromCurrencyName = erd_fromCurrencyName erd
                        , cerToCurrencyCode = erd_toCurrencyCode erd
                        , cerToCurrencyName = erd_toCurrencyName erd
                        , cerExchangeRate = read $ T.unpack $ erd_exchangeRate erd
                        , cerLastRefreshed = erd_lastRefreshed erd
                        , cerTimeZone = erd_timeZone erd
                        }
                    Error e -> return $ Left $ ParseError $ T.pack e
                Nothing -> return $ Left $ NoDataError "No exchange rate data found"
            _ -> return $ Left $ ParseError "Invalid response format"