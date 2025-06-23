{-# LANGUAGE OverloadedStrings #-}
module Commands.Build
  ( buildCommand
  , BuildOptions(..)
  ) where

import Utils.Process
import Utils.Terminal
import System.Exit (ExitCode(..))

-- Build command options
data BuildOptions = BuildOptions
  { analyze :: Bool
  , performance :: Bool
  } deriving (Show, Eq)

-- Execute build command
buildCommand :: BuildOptions -> IO ()
buildCommand opts = do
  printHeader "Building Trend2Zero Application"
  
  let buildCmd = determineBuildCommand opts
      buildMsg = determineBuildMessage opts
  
  printInfo buildMsg
  
  exitCode <- withSpinner "Building..." $ runCommand buildCmd
  
  case exitCode of
    ExitSuccess -> printSuccess "Build completed successfully!"
    ExitFailure code -> do
      printError $ "Build failed with exit code: " ++ show code
      error "Build process failed"

-- Determine which build command to run
determineBuildCommand :: BuildOptions -> String
determineBuildCommand opts
  | analyze opts = "npm run build:analyze"
  | performance opts = "npm run build:performance"
  | otherwise = "npm run build"

-- Determine build message
determineBuildMessage :: BuildOptions -> String
determineBuildMessage opts
  | analyze opts = "Running build with bundle analysis..."
  | performance opts = "Running build with performance analysis..."
  | otherwise = "Running standard build..."