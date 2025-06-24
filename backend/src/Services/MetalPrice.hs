{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE FlexibleContexts #-}

module Services.MetalPrice 
    ( MetalPriceService(..)
    , MetalPriceConfig(..)
    , MetalSymbol(..)
    , MetalPriceResponse(..)
    , MetalRate(..)
    , createMetalPriceService
    , getMetalPrice
    , getAllMetalPrices
    , metalSymbolToText
    , metalNameLookup
    ) where

import Control.Concurrent.STM
import Control.Exception (Exception, throwIO, catch, try, SomeException)
import Control.Monad (forM, forM_, when)
import Control.Monad.IO.Class (MonadIO, liftIO)
import Control.Retry
import Data.Aeson
import Data.ByteString.Lazy (ByteString)
import qualified Data.ByteString.Lazy.Char8 as L8
import Data.Cache.LRU.IO as LRU
import Data.Hashable (Hashable)
import Data.Map.Strict (Map)
import qualified Data.Map.Strict as Map
import Data.Maybe (fromMaybe, catMaybes)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import Data.Time.Clock.POSIX (posixSecondsToUTCTime)
import GHC.Generics
import Network.HTTP.Simple (parseRequest, httpLBS, getResponseBody, getResponseStatus, Response)
import Network.HTTP.Client (responseTimeout, responseTimeoutMicro)
import Network.HTTP.Types.Status (statusCode)
import System.Environment (lookupEnv)
import System.Log.FastLogger

-- Import shared types
import qualified Services.MarketDataTypes as MD
import Services.MarketDataTypes (DataSource(..))
import qualified Services.ApiLogger as Logger

-- | Supported metal symbols
data MetalSymbol = Gold | Silver | Platinum | Palladium
    deriving (Show, Eq, Ord, Generic, Enum, Bounded)

instance Hashable MetalSymbol

-- | Convert MetalSymbol to API text representation
metalSymbolToText :: MetalSymbol -> Text
metalSymbolToText Gold = "XAU"
metalSymbolToText Silver = "XAG"
metalSymbolToText Platinum = "XPT"
metalSymbolToText Palladium = "XPD"

-- | Get human-readable name for metal
metalNameLookup :: MetalSymbol -> Text
metalNameLookup Gold = "Gold"
metalNameLookup Silver = "Silver"
metalNameLookup Platinum = "Platinum"
metalNameLookup Palladium = "Palladium"

-- | Metal price service configuration
data MetalPriceConfig = MetalPriceConfig
    { mpcApiKey :: Text
    , mpcBaseUrl :: Text
    , mpcTimeout :: Int  -- milliseconds
    , mpcCacheTTL :: Int  -- seconds
    , mpcRetryPolicy :: RetryPolicyM IO
    , mpcMaxCacheSize :: Int
    } deriving (Generic)

-- | Default configuration
defaultMetalPriceConfig :: Text -> MetalPriceConfig
defaultMetalPriceConfig apiKey = MetalPriceConfig
    { mpcApiKey = apiKey
    , mpcBaseUrl = "https://api.metalpriceapi.com/v1"
    , mpcTimeout = 10000
    , mpcCacheTTL = 6 * 60 * 60  -- 6 hours
    , mpcRetryPolicy = exponentialBackoff 1000000 <> limitRetries 3
    , mpcMaxCacheSize = 100
    }

-- | Metal price service state
data MetalPriceService = MetalPriceService
    { mpsConfig :: MetalPriceConfig
    , mpsCache :: LRU.AtomicLRU Text MD.AssetPrice
    , mpsLogger :: TimedFastLogger
    , mpsApiLogger :: Logger.ApiLogger
    , mpsRateLimiter :: TVar RateLimitState
    }

-- | Rate limiting state
data RateLimitState = RateLimitState
    { rlsRequestCount :: Int
    , rlsWindowStart :: UTCTime
    , rlsIsLimited :: Bool
    } deriving (Show, Eq)

-- | API response structure
data MetalPriceResponse = MetalPriceResponse
    { mprSuccess :: Bool
    , mprTimestamp :: Integer
    , mprBase :: Text
    , mprRates :: Map Text Double
    } deriving (Show, Eq, Generic)

instance FromJSON MetalPriceResponse where
    parseJSON = withObject "MetalPriceResponse" $ \v -> MetalPriceResponse
        <$> v .: "success"
        <*> v .: "timestamp"
        <*> v .: "base"
        <*> v .: "rates"

-- | Metal rate structure
data MetalRate = MetalRate
    { mrSymbol :: Text
    , mrRate :: Double
    } deriving (Show, Eq, Generic)

-- | API errors
data MetalPriceError
    = ApiKeyMissing
    | InvalidApiResponse Text
    | NetworkError Text
    | RateLimitExceeded
    | MetalNotSupported Text
    deriving (Show, Eq)

instance Exception MetalPriceError

-- | Create a new metal price service
createMetalPriceService :: Maybe Text -> IO MetalPriceService
createMetalPriceService maybeApiKey = do
    -- Get API key from parameter or environment
    apiKey <- case maybeApiKey of
        Just key -> return key
        Nothing -> do
            envKey <- lookupEnv "METAL_PRICE_API_KEY"
            case envKey of
                Just key -> return $ T.pack key
                Nothing -> throwIO ApiKeyMissing
    
    let config = defaultMetalPriceConfig apiKey
    
    -- Initialize cache
    cache <- LRU.newAtomicLRU (Just $ fromIntegral $ mpcMaxCacheSize config)
    
    -- Initialize logger
    timeCache <- newTimeCache simpleTimeFormat
    (logger, cleanup) <- newTimedFastLogger timeCache (LogStdout defaultBufSize)
    
    -- Initialize API logger
    apiLogger <- Logger.createApiLogger Logger.INFO
    
    -- Initialize rate limiter
    now <- getCurrentTime
    rateLimiter <- newTVarIO $ RateLimitState 0 now False
    
    return MetalPriceService
        { mpsConfig = config
        , mpsCache = cache
        , mpsLogger = logger
        , mpsApiLogger = apiLogger
        , mpsRateLimiter = rateLimiter
        }

-- | Get price for a specific metal with caching and retry logic
getMetalPrice :: MonadIO m => MetalPriceService -> MetalSymbol -> m (Maybe MD.AssetPrice)
getMetalPrice service symbol = liftIO $ do
    let symbolText = metalSymbolToText symbol
        cacheKey = "metalprice_latest_" <> symbolText
    
    -- Log request
    mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Checking cache for " <> toLogStr symbolText <> "\n"
    
    -- Check cache first
    now <- getCurrentTime
    maybeCached <- LRU.lookup cacheKey (mpsCache service)
    
    case maybeCached of
        Just cachedPrice -> do
            let cacheAge = diffUTCTime now (MD.apLastUpdated cachedPrice)
            if cacheAge < fromIntegral (mpcCacheTTL $ mpsConfig service)
                then do
                    mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Cache hit for " <> toLogStr symbolText <> "\n"
                    return $ Just cachedPrice
                else fetchAndCache
        Nothing -> fetchAndCache
  where
    fetchAndCache = do
        -- Check rate limit
        rateLimitOk <- checkRateLimit service
        if not rateLimitOk
            then do
                mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Rate limit exceeded\n"
                return Nothing
            else do
                -- Fetch from API with retry
                mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Fetching latest price for " <> toLogStr (metalSymbolToText symbol) <> "\n"
                
                result <- retrying (mpcRetryPolicy $ mpsConfig service) shouldRetry $ \_ -> 
                    fetchMetalPriceFromAPI service symbol
                
                case result of
                    Right assetPrice -> do
                        -- Cache the result
                        LRU.insert ("metalprice_latest_" <> metalSymbolToText symbol) assetPrice (mpsCache service)
                        mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Successfully fetched and cached price for " 
                            <> toLogStr (metalSymbolToText symbol) <> ": $" <> toLogStr (show $ MD.apPrice assetPrice) <> "\n"
                        return $ Just assetPrice
                    Left err -> do
                        mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Error fetching " 
                            <> toLogStr (metalSymbolToText symbol) <> ": " <> toLogStr (show err) <> "\n"
                        return Nothing
    
    shouldRetry _ (Left (NetworkError _)) = return True
    shouldRetry _ _ = return False

-- | Get all metal prices in a single API call
getAllMetalPrices :: MonadIO m => MetalPriceService -> m [MD.AssetPrice]
getAllMetalPrices service = liftIO $ do
    -- Check rate limit
    rateLimitOk <- checkRateLimit service
    if not rateLimitOk
        then do
            mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Rate limit exceeded for batch request\n"
            return []
        else do
            mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Fetching all metal prices\n"
            
            let allSymbols = T.intercalate "," $ map metalSymbolToText [minBound..maxBound]
                config = mpsConfig service
                endpoint = "/latest"
                url = T.unpack (mpcBaseUrl config) <> endpoint
                    <> "?api_key=" <> T.unpack (mpcApiKey config)
                    <> "&base=USD"
                    <> "&currencies=" <> T.unpack allSymbols
            
            -- Log batch API call
            startTime <- Logger.logApiCall (mpsApiLogger service) "MetalPrice" 
                (T.pack endpoint) "GET" $ Map.fromList
                [ ("operation", toJSON ("batch_fetch" :: Text))
                , ("currencies", toJSON allSymbols)
                , ("count", toJSON (length [minBound..maxBound :: MetalSymbol]))
                ]
            
            request <- parseRequest url
            let requestWithTimeout = request { responseTimeout = responseTimeoutMicro (mpcTimeout config * 1000000) }
            
            result <- try $ httpLBS requestWithTimeout
            
            case result of
                Left (err :: SomeException) -> do
                    mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Network error: " <> toLogStr (show err) <> "\n"
                    Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                        (T.pack endpoint) "GET" (T.pack $ show err) 
                        $ Map.singleton "operation" (toJSON ("batch_fetch" :: Text))
                    return []
                Right httpResponse -> do
                    let status = statusCode $ getResponseStatus httpResponse
                    
                    -- Log response
                    Logger.logApiResponse (mpsApiLogger service) "MetalPrice" 
                        (T.pack endpoint) "GET" startTime status $ Map.fromList
                        [ ("operation", toJSON ("batch_fetch" :: Text))
                        , ("response_size", toJSON $ L8.length $ getResponseBody httpResponse)
                        ]
                    
                    if status == 200
                        then do
                            case eitherDecode (getResponseBody httpResponse) of
                                Right apiResponse -> do
                                    now <- getCurrentTime
                                    let prices = catMaybes $ map (parseMetalFromResponse apiResponse now) [minBound..maxBound]
                                    
                                    -- Cache all results
                                    forM_ prices $ \price -> 
                                        LRU.insert ("metalprice_latest_" <> MD.apSymbol price) price (mpsCache service)
                                    
                                    mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] Successfully fetched " 
                                        <> toLogStr (show $ length prices) <> " metal prices\n"
                                    
                                    -- Log successful batch fetch
                                    Logger.logApiMetrics (mpsApiLogger service)
                                    
                                    return prices
                                Left err -> do
                                    mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] JSON decode error: " <> toLogStr err <> "\n"
                                    Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                                        (T.pack endpoint) "GET" 
                                        ("JSON decode error: " <> T.pack err) 
                                        $ Map.singleton "operation" (toJSON ("batch_fetch" :: Text))
                                    return []
                        else do
                            mpsLogger service $ \time -> toLogStr time <> " [MetalPriceAPI] HTTP error status: " <> toLogStr (show status) <> "\n"
                            Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                                (T.pack endpoint) "GET" 
                                ("HTTP error status: " <> T.pack (show status)) 
                                $ Map.fromList 
                                    [ ("status", toJSON status)
                                    , ("operation", toJSON ("batch_fetch" :: Text))
                                    ]
                            return []
  where
    parseMetalFromResponse :: MetalPriceResponse -> UTCTime -> MetalSymbol -> Maybe MD.AssetPrice
    parseMetalFromResponse response now symbol =
        let symbolText = metalSymbolToText symbol
            rateKey = "USD" <> symbolText
        in case Map.lookup rateKey (mprRates response) of
            Just rate -> Just MD.AssetPrice
                { MD.apSymbol = symbolText
                , MD.apName = metalNameLookup symbol
                , MD.apType = "commodity"
                , MD.apPrice = rate
                , MD.apPriceInUSD = rate
                , MD.apPriceInBTC = 0  -- Would need BTC price to calculate
                , MD.apChange = 0  -- API doesn't provide change data
                , MD.apChangePercent = 0
                , MD.apVolume24h = Nothing
                , MD.apMarketCap = Nothing
                , MD.apLastUpdated = posixSecondsToUTCTime $ fromIntegral $ mprTimestamp response
                , MD.apSource = Mixed  -- Custom source for metals
                }
            Nothing -> Nothing

-- | Fetch metal price from API with comprehensive logging
fetchMetalPriceFromAPI :: MetalPriceService -> MetalSymbol -> IO (Either MetalPriceError MD.AssetPrice)
fetchMetalPriceFromAPI service symbol = do
    let config = mpsConfig service
        symbolText = metalSymbolToText symbol
        allSymbols = T.intercalate "," $ map metalSymbolToText [minBound..maxBound]
        endpoint = "/latest"
        url = T.unpack (mpcBaseUrl config) <> endpoint
            <> "?api_key=" <> T.unpack (mpcApiKey config)
            <> "&base=USD"
            <> "&currencies=" <> T.unpack allSymbols
    
    -- Log API call
    startTime <- Logger.logApiCall (mpsApiLogger service) "MetalPrice" 
        (T.pack endpoint) "GET" $ Map.fromList
        [ ("symbol", toJSON symbolText)
        , ("currencies", toJSON allSymbols)
        ]
    
    request <- parseRequest url
    let requestWithTimeout = request { responseTimeout = responseTimeoutMicro (mpcTimeout config * 1000000) }
    
    result <- try $ httpLBS requestWithTimeout
    
    case result of
        Left (err :: SomeException) -> do
            Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                (T.pack endpoint) "GET" (T.pack $ show err) Map.empty
            return $ Left $ NetworkError $ T.pack $ show err
        Right httpResponse -> do
            let status = statusCode $ getResponseStatus httpResponse
            
            -- Log response
            Logger.logApiResponse (mpsApiLogger service) "MetalPrice" 
                (T.pack endpoint) "GET" startTime status $ Map.fromList
                [ ("symbol", toJSON symbolText)
                , ("response_size", toJSON $ L8.length $ getResponseBody httpResponse)
                ]
            
            if status == 200
                then do
                    case eitherDecode (getResponseBody httpResponse) of
                        Right apiResponse -> 
                            if mprSuccess apiResponse
                                then do
                                    let rateKey = "USD" <> symbolText
                                    case Map.lookup rateKey (mprRates apiResponse) of
                                        Just rate -> do
                                            now <- getCurrentTime
                                            return $ Right MD.AssetPrice
                                                { MD.apSymbol = symbolText
                                                , MD.apName = metalNameLookup symbol
                                                , MD.apType = "commodity"
                                                , MD.apPrice = rate
                                                , MD.apPriceInUSD = rate
                                                , MD.apPriceInBTC = 0
                                                , MD.apChange = 0
                                                , MD.apChangePercent = 0
                                                , MD.apVolume24h = Nothing
                                                , MD.apMarketCap = Nothing
                                                , MD.apLastUpdated = posixSecondsToUTCTime $ fromIntegral $ mprTimestamp apiResponse
                                                , MD.apSource = Mixed
                                                }
                                        Nothing -> do
                                            Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                                                (T.pack endpoint) "GET" 
                                                ("Metal not supported: " <> symbolText) Map.empty
                                            return $ Left $ MetalNotSupported symbolText
                                else do
                                    Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                                        (T.pack endpoint) "GET" 
                                        "API returned success=false" Map.empty
                                    return $ Left $ InvalidApiResponse "API returned success=false"
                        Left err -> do
                            Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                                (T.pack endpoint) "GET" 
                                ("JSON decode error: " <> T.pack err) Map.empty
                            return $ Left $ InvalidApiResponse $ T.pack err
                else if status == 429
                    then do
                        Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                            (T.pack endpoint) "GET" 
                            "Rate limit exceeded" $ Map.singleton "status" (toJSON status)
                        return $ Left RateLimitExceeded
                    else do
                        Logger.logApiError (mpsApiLogger service) "MetalPrice" 
                            (T.pack endpoint) "GET" 
                            ("HTTP error status: " <> T.pack (show status)) 
                            $ Map.singleton "status" (toJSON status)
                        return $ Left $ NetworkError $ "HTTP status: " <> T.pack (show status)

-- | Check rate limit (simple implementation - can be enhanced)
checkRateLimit :: MetalPriceService -> IO Bool
checkRateLimit service = do
    now <- getCurrentTime
    atomically $ do
        state <- readTVar (mpsRateLimiter service)
        let windowDuration = 60  -- 1 minute window
            maxRequests = 50     -- Max 50 requests per minute
            
        if diffUTCTime now (rlsWindowStart state) > windowDuration
            then do
                -- Reset window
                writeTVar (mpsRateLimiter service) $ RateLimitState 1 now False
                return True
            else if rlsRequestCount state >= maxRequests
                then do
                    -- Rate limit exceeded
                    writeTVar (mpsRateLimiter service) $ state { rlsIsLimited = True }
                    return False
                else do
                    -- Increment counter
                    writeTVar (mpsRateLimiter service) $ state { rlsRequestCount = rlsRequestCount state + 1 }
                    return True