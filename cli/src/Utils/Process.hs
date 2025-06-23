{-# LANGUAGE OverloadedStrings #-}
module Utils.Process
  ( runCommand
  , runCommandWithOutput
  , CommandResult(..)
  ) where

import System.Process
import System.Exit
import Control.Exception (try, SomeException)
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.IO as TIO

-- Result of running a command
data CommandResult = CommandResult
  { exitCode :: ExitCode
  , stdout :: Text
  , stderr :: Text
  } deriving (Show, Eq)

-- Run a command and inherit stdio (real-time output)
runCommand :: String -> IO ExitCode
runCommand cmd = do
  (_, _, _, ph) <- createProcess (shell cmd)
    { std_in = Inherit
    , std_out = Inherit
    , std_err = Inherit
    }
  waitForProcess ph

-- Run a command and capture output
runCommandWithOutput :: String -> IO (Either String CommandResult)
runCommandWithOutput cmd = do
  result <- try $ readProcessWithExitCode "sh" ["-c", cmd] ""
  case result of
    Left (e :: SomeException) -> return $ Left (show e)
    Right (code, out, err) -> return $ Right CommandResult
      { exitCode = code
      , stdout = T.pack out
      , stderr = T.pack err
      }