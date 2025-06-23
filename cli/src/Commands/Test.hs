{-# LANGUAGE OverloadedStrings #-}
module Commands.Test
  ( testCommand
  , TestOptions(..)
  ) where

import Utils.Process
import Utils.Terminal
import System.Exit (ExitCode(..))

-- Test command options
data TestOptions = TestOptions
  { unit :: Bool
  , e2e :: Bool
  , visual :: Bool
  , coverage :: Bool
  , watch :: Bool
  } deriving (Show, Eq)

-- Execute test command
testCommand :: TestOptions -> IO ()
testCommand opts = do
  printHeader "Running Tests"
  
  let (cmd, msg) = determineTestCommand opts
  
  printInfo msg
  
  -- For watch mode, we don't use spinner as it runs continuously
  exitCode <- if watch opts
    then runCommand cmd
    else withSpinner "Running tests..." $ runCommand cmd
  
  case exitCode of
    ExitSuccess -> 
      if not (watch opts)
        then printSuccess "Tests completed successfully!"
        else return ()
    ExitFailure code -> do
      printError $ "Tests failed with exit code: " ++ show code
      error "Test execution failed"

-- Determine which test command to run
determineTestCommand :: TestOptions -> (String, String)
determineTestCommand opts
  | unit opts = ("npm run test", "Running unit tests...")
  | e2e opts = ("npm run test:e2e", "Running end-to-end tests...")
  | visual opts = ("npm run test:visual", "Running visual regression tests...")
  | coverage opts = ("npm run test:coverage", "Running tests with coverage report...")
  | watch opts = ("npm run test:watch", "Starting test watcher...")
  | otherwise = ("npm run test", "Running all tests...")