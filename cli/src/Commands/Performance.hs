{-# LANGUAGE OverloadedStrings #-}
module Commands.Performance
  ( performanceCommand
  ) where

import Utils.Process
import Utils.Terminal
import System.Exit (ExitCode(..))
import qualified Data.Text as T
import qualified Data.Text.IO as TIO

-- Execute performance command
performanceCommand :: IO ()
performanceCommand = do
  printHeader "Performance Analysis"
  
  printInfo "Running performance tests..."
  printInfo "This may take several minutes to complete"
  
  -- Run performance tests and capture output
  result <- withSpinner "Analyzing performance..." $ 
    runCommandWithOutput "npm run test:performance"
  
  case result of
    Right cmdResult -> 
      case exitCode cmdResult of
        ExitSuccess -> do
          printSuccess "Performance tests completed!"
          
          -- Display results if any
          let output = T.strip (stdout cmdResult)
          unless (T.null output) $ do
            printHeader "Performance Results"
            TIO.putStrLn output
            
        ExitFailure code -> do
          printError $ "Performance tests failed with exit code: " ++ show code
          unless (T.null (stderr cmdResult)) $ do
            printError "Error output:"
            TIO.putStrLn (stderr cmdResult)
          error "Performance analysis failed"
          
    Left err -> do
      printError $ "Failed to run performance tests: " ++ err
      error "Performance analysis failed"
  where
    unless cond action = if not cond then action else return ()