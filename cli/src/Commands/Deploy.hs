{-# LANGUAGE OverloadedStrings #-}
module Commands.Deploy
  ( deployCommand
  , DeployOptions(..)
  ) where

import Utils.Process
import Utils.Terminal
import System.Exit (ExitCode(..))
import Control.Monad (when)
import Control.Concurrent (threadDelay)

-- Deploy command options
data DeployOptions = DeployOptions
  { production :: Bool
  } deriving (Show, Eq)

-- Execute deploy command
deployCommand :: DeployOptions -> IO ()
deployCommand opts = do
  printHeader "Deploying to Vercel"
  
  let (cmd, env) = if production opts
        then ("npm run vercel:deploy:prod", "production")
        else ("npm run vercel:deploy", "preview")
  
  printInfo $ "Deploying to " ++ env ++ " environment..."
  
  when (production opts) $ do
    printWarning "You are about to deploy to PRODUCTION!"
    printInfo "This will affect live users. Press Ctrl+C to cancel."
    threadDelay 3000000  -- 3 second delay
  
  exitCode <- withSpinner "Deploying..." $ runCommand cmd
  
  case exitCode of
    ExitSuccess -> do
      printSuccess $ "Successfully deployed to " ++ env ++ "!"
      printInfo "Check your Vercel dashboard for the deployment URL."
    ExitFailure code -> do
      printError $ "Deployment failed with exit code: " ++ show code
      error "Deployment process failed"