{-# LANGUAGE OverloadedStrings #-}
module Commands.Dev
  ( devCommand
  ) where

import Utils.Process
import Utils.Terminal
import System.Exit (ExitCode(..))
import Control.Exception (finally)

-- Execute dev command
devCommand :: IO ()
devCommand = do
  printHeader "Starting Development Server"
  
  printInfo "Starting Next.js development server..."
  printInfo "Press Ctrl+C to stop the server"
  printInfo ""
  
  -- Run the dev server (this will run until interrupted)
  exitCode <- runCommand "npm run dev" `finally` cleanup
  
  case exitCode of
    ExitSuccess -> printSuccess "Development server stopped gracefully"
    ExitFailure code -> do
      printError $ "Development server exited with code: " ++ show code
      error "Development server failed"

-- Cleanup when server stops
cleanup :: IO ()
cleanup = do
  printInfo ""
  printInfo "Shutting down development server..."