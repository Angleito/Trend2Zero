{-# LANGUAGE OverloadedStrings #-}

module Config where

import Data.Text (Text, splitOn)
import qualified Data.Text as T
import System.Environment (lookupEnv)
import Control.Monad (msum)
import Data.Maybe (fromMaybe)

data AppConfig = AppConfig
  { appPort :: Int
  , appDatabaseUrl :: Text
  , appRedisUrl :: Text
  , appLogLevel :: AppLogLevel
  , appEnv :: Environment
  , appCorsOrigins :: [Text]
  , appJwtSecret :: Text
  , appMaxRequestSize :: Int
  } deriving (Show, Eq)

data AppLogLevel = Debug | Info | Warning | Error
  deriving (Show, Eq, Read)

data Environment = Development | Staging | Production
  deriving (Show, Eq, Read)

-- Load configuration from environment variables
loadConfig :: IO AppConfig
loadConfig = do
  port <- readEnvWithDefault "PORT" 8080
  dbUrl <- readEnvText "DATABASE_URL" "postgresql://localhost/trend2zero"
  redisUrl <- readEnvText "REDIS_URL" "redis://localhost:6379"
  logLevel <- readEnvWithDefault "LOG_LEVEL" Info
  env <- readEnvWithDefault "APP_ENV" Development
  corsOrigins <- readEnvTextList "CORS_ORIGINS" ["http://localhost:3000"]
  jwtSecret <- readEnvText "JWT_SECRET" "development-secret-change-in-production"
  maxReqSize <- readEnvWithDefault "MAX_REQUEST_SIZE" (10 * 1024 * 1024) -- 10MB
  
  return AppConfig
    { appPort = port
    , appDatabaseUrl = dbUrl
    , appRedisUrl = redisUrl
    , appLogLevel = logLevel
    , appEnv = env
    , appCorsOrigins = corsOrigins
    , appJwtSecret = jwtSecret
    , appMaxRequestSize = maxReqSize
    }

-- Helper functions
readEnvWithDefault :: Read a => String -> a -> IO a
readEnvWithDefault key defaultValue = do
  maybeValue <- lookupEnv key
  return $ case maybeValue of
    Nothing -> defaultValue
    Just str -> fromMaybe defaultValue (readMaybe str)

readEnvText :: String -> Text -> IO Text
readEnvText key defaultValue = do
  maybeValue <- lookupEnv key
  return $ case maybeValue of
    Nothing -> defaultValue
    Just str -> T.pack str

readEnvTextList :: String -> [Text] -> IO [Text]
readEnvTextList key defaultValue = do
  maybeValue <- lookupEnv key
  return $ case maybeValue of
    Nothing -> defaultValue
    Just str -> map T.strip $ T.splitOn "," (T.pack str)

readMaybe :: Read a => String -> Maybe a
readMaybe s = case reads s of
  [(x, "")] -> Just x
  _ -> Nothing