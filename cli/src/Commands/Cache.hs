{-# LANGUAGE OverloadedStrings #-}
module Commands.Cache
  ( cacheCommand
  , CacheOptions(..)
  ) where

import Utils.Process
import Utils.Terminal
import System.Exit (ExitCode(..))

-- Cache command options
data CacheOptions = CacheOptions
  { clear :: Bool
  , analyze :: Bool
  , validate :: Bool
  , metrics :: Bool
  , prune :: Bool
  } deriving (Show, Eq)

-- Execute cache command
cacheCommand :: CacheOptions -> IO ()
cacheCommand opts = do
  printHeader "Cache Management"
  
  case determineCacheOperation opts of
    Just (cmd, msg) -> do
      printInfo msg
      exitCode <- withSpinner "Processing..." $ runCommand cmd
      
      case exitCode of
        ExitSuccess -> printSuccess "Cache operation completed successfully!"
        ExitFailure code -> do
          printError $ "Cache operation failed with exit code: " ++ show code
          error "Cache operation failed"
    
    Nothing -> do
      printWarning "No cache operation specified"
      printInfo "Available operations:"
      printInfo "  --clear    Clear build cache"
      printInfo "  --analyze  Analyze cache performance"
      printInfo "  --validate Validate cache"
      printInfo "  --metrics  Show cache metrics"
      printInfo "  --prune    Prune cache"

-- Determine which cache operation to perform
determineCacheOperation :: CacheOptions -> Maybe (String, String)
determineCacheOperation opts
  | clear opts = Just ("npm run build:cache:clear", "Clearing build cache...")
  | analyze opts = Just ("npm run build:cache:analyze", "Analyzing cache performance...")
  | validate opts = Just ("npm run build:cache:validate", "Validating cache...")
  | metrics opts = Just ("npm run cache:metrics", "Fetching cache metrics...")
  | prune opts = Just ("npm run cache:prune", "Pruning cache...")
  | otherwise = Nothing