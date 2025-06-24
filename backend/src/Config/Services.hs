{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}

module Config.Services
    ( ServicesConfig(..)
    , ServiceEndpoint(..)
    , ApiKeyConfig(..)
    , RetryConfig(..)
    , CacheConfig(..)
    , loadServicesConfig
    , getServiceEndpoint
    , getApiKey
    , validateConfig
    , defaultRetryConfig
    , defaultCacheConfig
    ) where

import Control.Monad (when, unless)
import Control.Monad.IO.Class (MonadIO, liftIO)
import Control.Retry
import Data.Aeson
import Data.Map.Strict (Map)
import qualified Data.Map.Strict as Map
import Data.Maybe (fromMaybe, isNothing)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import GHC.Generics
import System.Environment
import System.Exit (exitFailure)
import System.IO

-- | Service endpoint configuration
data ServiceEndpoint = ServiceEndpoint
    { seBaseUrl :: Text
    , seTimeout :: Int  -- milliseconds
    , seMaxRetries :: Int
    , seRateLimitPerMinute :: Int
    } deriving (Show, Eq, Generic)

instance ToJSON ServiceEndpoint where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 2 }

instance FromJSON ServiceEndpoint where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 2 }

-- | API key configuration
data ApiKeyConfig = ApiKeyConfig
    { akcKey :: Text
    , akcIsRequired :: Bool
    , akcEnvironmentVar :: Text
    } deriving (Show, Eq, Generic)

instance ToJSON ApiKeyConfig where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 3 }

instance FromJSON ApiKeyConfig where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 3 }

-- | Retry configuration
data RetryConfig = RetryConfig
    { rcMaxRetries :: Int
    , rcInitialDelayMicros :: Int
    , rcMaxDelayMicros :: Int
    , rcExponentialBase :: Double
    } deriving (Show, Eq, Generic)

instance ToJSON RetryConfig where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 2 }

instance FromJSON RetryConfig where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 2 }

-- | Cache configuration
data CacheConfig = CacheConfig
    { ccEnabled :: Bool
    , ccDefaultTTL :: Int  -- seconds
    , ccMaxSize :: Int
    , ccEvictionPolicy :: Text  -- "LRU", "LFU", etc.
    } deriving (Show, Eq, Generic)

instance ToJSON CacheConfig where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 2 }

instance FromJSON CacheConfig where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 2 }

-- | Main services configuration
data ServicesConfig = ServicesConfig
    { scEndpoints :: Map Text ServiceEndpoint
    , scApiKeys :: Map Text ApiKeyConfig
    , scGlobalRetry :: RetryConfig
    , scGlobalCache :: CacheConfig
    , scLogLevel :: Text
    , scEnvironment :: Text
    } deriving (Show, Eq, Generic)

instance ToJSON ServicesConfig where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 2 }

instance FromJSON ServicesConfig where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 2 }

-- | Default retry configuration
defaultRetryConfig :: RetryConfig
defaultRetryConfig = RetryConfig
    { rcMaxRetries = 3
    , rcInitialDelayMicros = 1000000  -- 1 second
    , rcMaxDelayMicros = 30000000     -- 30 seconds
    , rcExponentialBase = 2.0
    }

-- | Default cache configuration
defaultCacheConfig :: CacheConfig
defaultCacheConfig = CacheConfig
    { ccEnabled = True
    , ccDefaultTTL = 3600      -- 1 hour
    , ccMaxSize = 1000
    , ccEvictionPolicy = "LRU"
    }

-- | Default service endpoints
defaultEndpoints :: Map Text ServiceEndpoint
defaultEndpoints = Map.fromList
    [ ("coingecko", ServiceEndpoint
        { seBaseUrl = "https://api.coingecko.com/api/v3"
        , seTimeout = 30000
        , seMaxRetries = 3
        , seRateLimitPerMinute = 50
        })
    , ("alphavantage", ServiceEndpoint
        { seBaseUrl = "https://www.alphavantage.co"
        , seTimeout = 30000
        , seMaxRetries = 3
        , seRateLimitPerMinute = 5  -- Free tier limit
        })
    , ("metalprice", ServiceEndpoint
        { seBaseUrl = "https://api.metalpriceapi.com/v1"
        , seTimeout = 10000
        , seMaxRetries = 3
        , seRateLimitPerMinute = 50
        })
    , ("cryptocompare", ServiceEndpoint
        { seBaseUrl = "https://min-api.cryptocompare.com"
        , seTimeout = 20000
        , seMaxRetries = 3
        , seRateLimitPerMinute = 100
        })
    ]

-- | Default API key configurations
defaultApiKeys :: Map Text ApiKeyConfig
defaultApiKeys = Map.fromList
    [ ("coingecko", ApiKeyConfig
        { akcKey = ""
        , akcIsRequired = False  -- Free tier available
        , akcEnvironmentVar = "COINGECKO_API_KEY"
        })
    , ("alphavantage", ApiKeyConfig
        { akcKey = ""
        , akcIsRequired = True
        , akcEnvironmentVar = "ALPHA_VANTAGE_API_KEY"
        })
    , ("metalprice", ApiKeyConfig
        { akcKey = ""
        , akcIsRequired = True
        , akcEnvironmentVar = "METAL_PRICE_API_KEY"
        })
    , ("cryptocompare", ApiKeyConfig
        { akcKey = ""
        , akcIsRequired = False
        , akcEnvironmentVar = "CRYPTOCOMPARE_API_KEY"
        })
    ]

-- | Load services configuration from environment
loadServicesConfig :: MonadIO m => m ServicesConfig
loadServicesConfig = liftIO $ do
    -- Get environment
    env <- fromMaybe "production" <$> lookupEnv "ENVIRONMENT"
    
    -- Get log level
    logLevel <- fromMaybe "info" <$> lookupEnv "LOG_LEVEL"
    
    -- Load API keys from environment
    apiKeys <- loadApiKeys
    
    -- Check for config file override
    configFile <- lookupEnv "SERVICES_CONFIG_FILE"
    
    baseConfig <- case configFile of
        Just file -> do
            -- Load from JSON file if specified
            result <- eitherDecodeFileStrict file
            case result of
                Right config -> return config
                Left err -> do
                    hPutStrLn stderr $ "Error loading config file: " ++ err
                    exitFailure
        Nothing -> do
            -- Use default configuration
            return ServicesConfig
                { scEndpoints = defaultEndpoints
                , scApiKeys = apiKeys
                , scGlobalRetry = defaultRetryConfig
                , scGlobalCache = defaultCacheConfig
                , scLogLevel = T.pack logLevel
                , scEnvironment = T.pack env
                }
    
    -- Validate configuration
    validateConfig baseConfig
    
    return baseConfig

-- | Load API keys from environment variables
loadApiKeys :: IO (Map Text ApiKeyConfig)
loadApiKeys = do
    let loadKey (name, config) = do
            maybeKey <- lookupEnv (T.unpack $ akcEnvironmentVar config)
            return (name, config { akcKey = maybe "" T.pack maybeKey })
    
    updatedKeys <- mapM loadKey $ Map.toList defaultApiKeys
    return $ Map.fromList updatedKeys

-- | Get service endpoint configuration
getServiceEndpoint :: ServicesConfig -> Text -> Maybe ServiceEndpoint
getServiceEndpoint config service = Map.lookup service (scEndpoints config)

-- | Get API key for a service
getApiKey :: ServicesConfig -> Text -> Maybe Text
getApiKey config service = do
    keyConfig <- Map.lookup service (scApiKeys config)
    let key = akcKey keyConfig
    if T.null key then Nothing else Just key

-- | Validate configuration
validateConfig :: MonadIO m => ServicesConfig -> m ()
validateConfig config = liftIO $ do
    -- Check required API keys
    let requiredKeys = Map.filter akcIsRequired (scApiKeys config)
        missingKeys = Map.filter (T.null . akcKey) requiredKeys
    
    unless (Map.null missingKeys) $ do
        hPutStrLn stderr "ERROR: Missing required API keys:"
        mapM_ (hPutStrLn stderr . ("  - " ++) . T.unpack . akcEnvironmentVar) $ Map.elems missingKeys
        hPutStrLn stderr "\nPlease set the required environment variables."
        exitFailure
    
    -- Validate endpoints
    let invalidEndpoints = Map.filter (T.null . seBaseUrl) (scEndpoints config)
    unless (Map.null invalidEndpoints) $ do
        hPutStrLn stderr "ERROR: Invalid service endpoints (missing base URL):"
        mapM_ (hPutStrLn stderr . ("  - " ++) . T.unpack) $ Map.keys invalidEndpoints
        exitFailure
    
    -- Validate retry config
    when (rcMaxRetries (scGlobalRetry config) < 0) $ do
        hPutStrLn stderr "ERROR: Invalid retry configuration (negative max retries)"
        exitFailure
    
    -- Validate cache config
    when (ccMaxSize (scGlobalCache config) <= 0) $ do
        hPutStrLn stderr "ERROR: Invalid cache configuration (non-positive max size)"
        exitFailure
    
    -- Log successful validation in development
    when (scEnvironment config == "development") $ do
        putStrLn "Services configuration validated successfully:"
        putStrLn $ "  - Environment: " ++ T.unpack (scEnvironment config)
        putStrLn $ "  - Log Level: " ++ T.unpack (scLogLevel config)
        putStrLn $ "  - Configured Services: " ++ show (Map.keys $ scEndpoints config)
        putStrLn $ "  - API Keys Loaded: " ++ show (Map.keys $ Map.filter (not . T.null . akcKey) $ scApiKeys config)

-- | Create retry policy from configuration
createRetryPolicy :: RetryConfig -> RetryPolicyM IO
createRetryPolicy config = 
    capDelay (rcMaxDelayMicros config) $
        exponentialBackoff (rcInitialDelayMicros config) 
        <> limitRetries (rcMaxRetries config)