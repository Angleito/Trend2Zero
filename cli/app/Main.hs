{-# LANGUAGE OverloadedStrings #-}
module Main where

import Options.Applicative
import System.Exit (exitFailure, exitSuccess)
import Control.Exception (catch, SomeException)

-- Import command modules
import Commands.Build (buildCommand, BuildOptions(..))
import Commands.Cache (cacheCommand, CacheOptions(..))
import Commands.Test (testCommand, TestOptions(..))
import Commands.Deploy (deployCommand, DeployOptions(..))
import Commands.Dev (devCommand)
import Commands.Performance (performanceCommand)

-- Main CLI data type
data Command
  = Build BuildOptions
  | Cache CacheOptions
  | Test TestOptions
  | Deploy DeployOptions
  | Dev
  | Performance
  deriving (Show)

-- Version of the CLI
cliVersion :: String
cliVersion = "1.0.1"

-- Main parser
mainParser :: Parser Command
mainParser = subparser
  ( command "build" (info buildParser (progDesc "Build the Next.js application"))
  <> command "cache" (info cacheParser (progDesc "Manage build cache"))
  <> command "test" (info testParser (progDesc "Run tests"))
  <> command "deploy" (info deployParser (progDesc "Deploy to Vercel"))
  <> command "dev" (info devParser (progDesc "Start development server"))
  <> command "performance" (info performanceParser (progDesc "Run performance tests"))
  )

-- Build command parser
buildParser :: Parser Command
buildParser = Build <$> buildOptionsParser
  where
    buildOptionsParser = BuildOptions
      <$> switch (long "analyze" <> short 'a' <> help "Analyze bundle size")
      <*> switch (long "performance" <> short 'p' <> help "Analyze build performance")

-- Cache command parser
cacheParser :: Parser Command
cacheParser = Cache <$> cacheOptionsParser
  where
    cacheOptionsParser = CacheOptions
      <$> switch (long "clear" <> short 'c' <> help "Clear build cache")
      <*> switch (long "analyze" <> short 'a' <> help "Analyze cache performance")
      <*> switch (long "validate" <> short 'v' <> help "Validate cache")
      <*> switch (long "metrics" <> short 'm' <> help "Show cache metrics")
      <*> switch (long "prune" <> short 'p' <> help "Prune cache")

-- Test command parser
testParser :: Parser Command
testParser = Test <$> testOptionsParser
  where
    testOptionsParser = TestOptions
      <$> switch (long "unit" <> short 'u' <> help "Run unit tests")
      <*> switch (long "e2e" <> short 'e' <> help "Run end-to-end tests")
      <*> switch (long "visual" <> short 'v' <> help "Run visual tests")
      <*> switch (long "coverage" <> short 'c' <> help "Generate test coverage report")
      <*> switch (long "watch" <> short 'w' <> help "Watch mode for tests")

-- Deploy command parser
deployParser :: Parser Command
deployParser = Deploy <$> deployOptionsParser
  where
    deployOptionsParser = DeployOptions
      <$> switch (long "production" <> short 'p' <> help "Deploy to production")

-- Dev command parser
devParser :: Parser Command
devParser = pure Dev

-- Performance command parser
performanceParser :: Parser Command
performanceParser = pure Performance

-- CLI info
cliInfo :: ParserInfo Command
cliInfo = info (mainParser <**> helper <**> versionOption)
  ( fullDesc
  <> progDesc "Trend2Zero CLI - Build, test, and deploy your Next.js application"
  <> header "trend2zero - A CLI tool for managing Trend2Zero projects"
  )
  where
    versionOption = infoOption cliVersion
      (long "version" <> short 'V' <> help "Show CLI version")

-- Execute commands
executeCommand :: Command -> IO ()
executeCommand cmd = case cmd of
  Build opts -> buildCommand opts
  Cache opts -> cacheCommand opts
  Test opts -> testCommand opts
  Deploy opts -> deployCommand opts
  Dev -> devCommand
  Performance -> performanceCommand

-- Main entry point
main :: IO ()
main = do
  cmd <- execParser cliInfo
  catch (executeCommand cmd >> exitSuccess) handleError
  where
    handleError :: SomeException -> IO ()
    handleError e = do
      putStrLn $ "Error: " ++ show e
      exitFailure