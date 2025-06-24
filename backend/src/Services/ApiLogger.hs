{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}

module Services.ApiLogger
    ( ApiLogger(..)
    , ApiLogEntry(..)
    , ApiLogLevel(..)
    , createApiLogger
    , logApiCall
    , logApiResponse
    , logApiError
    , logApiMetrics
    , flushLogger
    ) where

import Control.Concurrent.Async (async)
import Control.Concurrent.STM
import Control.Monad (when, forever)
import Control.Monad.IO.Class (MonadIO, liftIO)
import Data.Aeson
import Data.ByteString.Lazy (ByteString)
import qualified Data.ByteString.Lazy.Char8 as L8
import Data.Map.Strict (Map)
import qualified Data.Map.Strict as Map
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import GHC.Generics
import System.Log.FastLogger

-- | Log levels for API calls
data ApiLogLevel = DEBUG | INFO | WARN | ERROR | CRITICAL
    deriving (Show, Eq, Ord, Generic)

instance ToJSON ApiLogLevel
instance FromJSON ApiLogLevel

-- | API log entry structure
data ApiLogEntry = ApiLogEntry
    { aleTimestamp :: UTCTime
    , aleLevel :: ApiLogLevel
    , aleService :: Text
    , aleEndpoint :: Text
    , aleMethod :: Text
    , aleStatusCode :: Maybe Int
    , aleResponseTime :: Maybe NominalDiffTime
    , aleError :: Maybe Text
    , aleMetadata :: Map Text Value
    } deriving (Show, Eq, Generic)

instance ToJSON ApiLogEntry where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 3 }

instance FromJSON ApiLogEntry where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 3 }

-- | API logger state
data ApiLogger = ApiLogger
    { alLogger :: TimedFastLogger
    , alQueue :: TQueue ApiLogEntry
    , alMetrics :: TVar ApiMetrics
    , alMinLevel :: ApiLogLevel
    }

-- | API metrics tracking
data ApiMetrics = ApiMetrics
    { amTotalCalls :: Int
    , amSuccessfulCalls :: Int
    , amFailedCalls :: Int
    , amTotalResponseTime :: NominalDiffTime
    , amServiceCalls :: Map Text Int
    , amErrorsByService :: Map Text Int
    } deriving (Show, Eq)

-- | Create a new API logger
createApiLogger :: MonadIO m => ApiLogLevel -> m ApiLogger
createApiLogger minLevel = liftIO $ do
    -- Create time cache for performance
    timeCache <- newTimeCache simpleTimeFormat
    
    -- Create logger
    (logger, _) <- newTimedFastLogger timeCache (LogStdout defaultBufSize)
    
    -- Create log queue
    queue <- newTQueueIO
    
    -- Initialize metrics
    metrics <- newTVarIO $ ApiMetrics 0 0 0 0 Map.empty Map.empty
    
    let apiLogger = ApiLogger logger queue metrics minLevel
    
    -- Start background logger thread
    _ <- async $ loggerThread apiLogger
    
    return apiLogger

-- | Background thread for processing log entries
loggerThread :: ApiLogger -> IO ()
loggerThread logger = forever $ do
    entry <- atomically $ readTQueue (alQueue logger)
    when (aleLevel entry >= alMinLevel logger) $ do
        alLogger logger $ \time -> 
            toLogStr time <> " " <>
            toLogStr (formatLogEntry entry) <> "\n"

-- | Format log entry for output
formatLogEntry :: ApiLogEntry -> Text
formatLogEntry ApiLogEntry{..} = T.unwords
    [ "[" <> T.pack (show aleLevel) <> "]"
    , "[" <> aleService <> "]"
    , aleMethod
    , aleEndpoint
    , case aleStatusCode of
        Just code -> "Status:" <> T.pack (show code)
        Nothing -> ""
    , case aleResponseTime of
        Just time -> "Time:" <> T.pack (show (round (time * 1000) :: Int)) <> "ms"
        Nothing -> ""
    , case aleError of
        Just err -> "Error:" <> err
        Nothing -> ""
    , if Map.null aleMetadata
        then ""
        else "Metadata:" <> T.pack (show aleMetadata)
    ]

-- | Log an API call
logApiCall :: MonadIO m => ApiLogger -> Text -> Text -> Text -> Map Text Value -> m UTCTime
logApiCall logger service endpoint method metadata = liftIO $ do
    now <- getCurrentTime
    let entry = ApiLogEntry
            { aleTimestamp = now
            , aleLevel = INFO
            , aleService = service
            , aleEndpoint = endpoint
            , aleMethod = method
            , aleStatusCode = Nothing
            , aleResponseTime = Nothing
            , aleError = Nothing
            , aleMetadata = metadata
            }
    
    atomically $ do
        writeTQueue (alQueue logger) entry
        modifyTVar' (alMetrics logger) $ \m -> m
            { amTotalCalls = amTotalCalls m + 1
            , amServiceCalls = Map.insertWith (+) service 1 (amServiceCalls m)
            }
    
    return now

-- | Log an API response
logApiResponse :: MonadIO m => ApiLogger -> Text -> Text -> Text -> UTCTime -> Int -> Map Text Value -> m ()
logApiResponse logger service endpoint method startTime statusCode metadata = liftIO $ do
    now <- getCurrentTime
    let responseTime = diffUTCTime now startTime
        level = if statusCode >= 200 && statusCode < 300 then INFO else WARN
        entry = ApiLogEntry
            { aleTimestamp = now
            , aleLevel = level
            , aleService = service
            , aleEndpoint = endpoint
            , aleMethod = method
            , aleStatusCode = Just statusCode
            , aleResponseTime = Just responseTime
            , aleError = Nothing
            , aleMetadata = metadata
            }
    
    atomically $ do
        writeTQueue (alQueue logger) entry
        modifyTVar' (alMetrics logger) $ \m -> m
            { amSuccessfulCalls = if level == INFO then amSuccessfulCalls m + 1 else amSuccessfulCalls m
            , amFailedCalls = if level /= INFO then amFailedCalls m + 1 else amFailedCalls m
            , amTotalResponseTime = amTotalResponseTime m + responseTime
            }

-- | Log an API error
logApiError :: MonadIO m => ApiLogger -> Text -> Text -> Text -> Text -> Map Text Value -> m ()
logApiError logger service endpoint method errorMsg metadata = liftIO $ do
    now <- getCurrentTime
    let entry = ApiLogEntry
            { aleTimestamp = now
            , aleLevel = ERROR
            , aleService = service
            , aleEndpoint = endpoint
            , aleMethod = method
            , aleStatusCode = Nothing
            , aleResponseTime = Nothing
            , aleError = Just errorMsg
            , aleMetadata = metadata
            }
    
    atomically $ do
        writeTQueue (alQueue logger) entry
        modifyTVar' (alMetrics logger) $ \m -> m
            { amFailedCalls = amFailedCalls m + 1
            , amErrorsByService = Map.insertWith (+) service 1 (amErrorsByService m)
            }

-- | Get current API metrics
logApiMetrics :: MonadIO m => ApiLogger -> m ()
logApiMetrics logger = liftIO $ do
    metrics <- readTVarIO (alMetrics logger)
    now <- getCurrentTime
    
    let avgResponseTime = if amTotalCalls metrics > 0
            then amTotalResponseTime metrics / fromIntegral (amTotalCalls metrics)
            else 0
        
        successRate = if amTotalCalls metrics > 0
            then fromIntegral (amSuccessfulCalls metrics) / fromIntegral (amTotalCalls metrics) * 100
            else 0 :: Double
        
        metricsEntry = ApiLogEntry
            { aleTimestamp = now
            , aleLevel = INFO
            , aleService = "ApiMetrics"
            , aleEndpoint = "summary"
            , aleMethod = "REPORT"
            , aleStatusCode = Nothing
            , aleResponseTime = Nothing
            , aleError = Nothing
            , aleMetadata = Map.fromList
                [ ("total_calls", toJSON $ amTotalCalls metrics)
                , ("successful_calls", toJSON $ amSuccessfulCalls metrics)
                , ("failed_calls", toJSON $ amFailedCalls metrics)
                , ("average_response_time_ms", toJSON $ (round (avgResponseTime * 1000) :: Int))
                , ("success_rate", toJSON $ (round successRate :: Int))
                , ("calls_by_service", toJSON $ amServiceCalls metrics)
                , ("errors_by_service", toJSON $ amErrorsByService metrics)
                ]
            }
    
    atomically $ writeTQueue (alQueue logger) metricsEntry

-- | Flush logger (ensure all entries are written)
flushLogger :: MonadIO m => ApiLogger -> m ()
flushLogger logger = liftIO $ do
    alLogger logger $ \_ -> ""  -- Force flush

