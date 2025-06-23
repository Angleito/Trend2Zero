{-# LANGUAGE OverloadedStrings #-}

module Handlers.Health where

import Servant
import Types

-- | Health check handler - returns a simple status message
healthHandler :: Handler HealthStatus
healthHandler = return $ HealthStatus "ok"