{-# LANGUAGE OverloadedStrings #-}
module Utils.Terminal
  ( printSuccess
  , printError
  , printWarning
  , printInfo
  , printHeader
  , withSpinner
  ) where

import System.Console.ANSI
import Control.Concurrent.Async
import Control.Concurrent (threadDelay)
import Control.Exception (finally)
import System.IO (hFlush, stdout)

-- Print success message in green
printSuccess :: String -> IO ()
printSuccess msg = do
  setSGR [SetColor Foreground Vivid Green]
  putStrLn $ "✓ " ++ msg
  setSGR [Reset]

-- Print error message in red
printError :: String -> IO ()
printError msg = do
  setSGR [SetColor Foreground Vivid Red]
  putStrLn $ "✗ " ++ msg
  setSGR [Reset]

-- Print warning message in yellow
printWarning :: String -> IO ()
printWarning msg = do
  setSGR [SetColor Foreground Vivid Yellow]
  putStrLn $ "⚠ " ++ msg
  setSGR [Reset]

-- Print info message in blue
printInfo :: String -> IO ()
printInfo msg = do
  setSGR [SetColor Foreground Vivid Blue]
  putStrLn $ "ℹ " ++ msg
  setSGR [Reset]

-- Print header with formatting
printHeader :: String -> IO ()
printHeader msg = do
  putStrLn ""
  setSGR [SetConsoleIntensity BoldIntensity]
  putStrLn msg
  setSGR [Reset]
  putStrLn $ replicate (length msg) '-'

-- Show spinner while executing an action
withSpinner :: String -> IO a -> IO a
withSpinner msg action = do
  putStr $ msg ++ " "
  hFlush stdout
  spinner <- async spinnerLoop
  result <- action `finally` cancel spinner
  clearLine
  cursorBackward (length msg + 2)
  return result
  where
    spinnerLoop = do
      let chars = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
      mapM_ showChar (cycle chars)
    showChar c = do
      putChar c
      hFlush stdout
      threadDelay 100000  -- 0.1 seconds
      cursorBackward 1