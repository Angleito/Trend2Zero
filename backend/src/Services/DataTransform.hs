{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE FlexibleContexts #-}

module Services.DataTransform
    ( -- * Core transformation types
      TransformPipeline(..)
    , TransformStep(..)
    , TransformError(..)
    , TransformResult(..)
    
    -- * Pipeline builders
    , createPipeline
    , addStep
    , withValidation
    , withNormalization
    , withEnrichment
    
    -- * Common transformations
    , normalizePrice
    , normalizeSymbol
    , enrichWithMetadata
    , validateAssetData
    , convertCurrency
    
    -- * Pipeline execution
    , runPipeline
    , runPipelineAsync
    , runPipelineWithRetry
    
    -- * Utility functions
    , mergeAssetData
    , deduplicateAssets
    , aggregatePrices
    ) where

import Control.Concurrent.Async
import Control.Exception (Exception, try, catch, SomeException)
import Control.Monad (foldM, when, unless)
import Control.Monad.IO.Class (MonadIO, liftIO)
import Control.Retry
import Data.Either (partitionEithers)
import Data.List (nubBy, sortOn, groupBy)
import Data.Map.Strict (Map)
import qualified Data.Map.Strict as Map
import Data.Maybe (fromMaybe, catMaybes, mapMaybe)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import qualified Services.MarketData as MD
import qualified Services.MarketDataTypes as MDT

-- | Transform error types
data TransformError
    = ValidationError Text
    | NormalizationError Text
    | EnrichmentError Text
    | PipelineError Text
    | DataSourceError Text
    deriving (Show, Eq)

instance Exception TransformError

-- | Transform result wrapper
data TransformResult a = TransformResult
    { trData :: a
    , trWarnings :: [Text]
    , trMetrics :: Map Text Int
    } deriving (Show, Eq)

-- | Transform step definition
data TransformStep a b = TransformStep
    { tsName :: Text
    , tsFunction :: a -> IO (Either TransformError b)
    , tsRetryPolicy :: Maybe (RetryPolicyM IO)
    }

-- | Transform pipeline
data TransformPipeline a b = TransformPipeline
    { tpName :: Text
    , tpSteps :: [TransformStepWrapper]
    , tpMetrics :: Map Text Int
    }

-- | Wrapper for heterogeneous steps
data TransformStepWrapper where
    StepWrapper :: TransformStep a b -> (b -> TransformStepWrapper) -> TransformStepWrapper
    FinalStep :: TransformStep a b -> TransformStepWrapper

-- | Create a new pipeline
createPipeline :: Text -> TransformPipeline a a
createPipeline name = TransformPipeline
    { tpName = name
    , tpSteps = []
    , tpMetrics = Map.empty
    }

-- | Add a transformation step
addStep :: TransformStep a a -> TransformPipeline a a -> TransformPipeline a a  
addStep step pipeline = pipeline
    { tpSteps = tpSteps pipeline ++ [FinalStep step]
    }

-- | Add validation step
withValidation :: (a -> Either Text a) -> TransformPipeline a a -> TransformPipeline a a
withValidation validate pipeline = 
    let validationStep = TransformStep
            { tsName = "validation"
            , tsFunction = \input -> return $ case validate input of
                Left err -> Left $ ValidationError err
                Right val -> Right val
            , tsRetryPolicy = Nothing
            }
    in addStep validationStep pipeline

-- | Add normalization step
withNormalization :: (a -> IO a) -> TransformPipeline a a -> TransformPipeline a a
withNormalization normalize pipeline =
    let normalizationStep = TransformStep
            { tsName = "normalization"
            , tsFunction = \input -> do
                result <- try (normalize input)
                return $ case result of
                    Left (e :: SomeException) -> Left $ NormalizationError $ T.pack $ show e
                    Right val -> Right val
            , tsRetryPolicy = Nothing
            }
    in addStep normalizationStep pipeline

-- | Add enrichment step with retry
withEnrichment :: (a -> IO a) -> RetryPolicyM IO -> TransformPipeline a a -> TransformPipeline a a
withEnrichment enrich retryPolicy pipeline =
    let enrichmentStep = TransformStep
            { tsName = "enrichment"
            , tsFunction = \input -> do
                result <- try (enrich input)
                return $ case result of
                    Left (e :: SomeException) -> Left $ EnrichmentError $ T.pack $ show e
                    Right val -> Right val
            , tsRetryPolicy = Just retryPolicy
            }
    in addStep enrichmentStep pipeline

-- | Common transformations

-- | Normalize price to ensure consistency
normalizePrice :: MD.AssetPrice -> IO MD.AssetPrice
normalizePrice price = do
    now <- getCurrentTime
    return price
        { MD.apPrice = if MD.apPrice price < 0 then 0 else MD.apPrice price
        , MD.apPriceInUSD = if MD.apPriceInUSD price < 0 then 0 else MD.apPriceInUSD price
        , MD.apLastUpdated = if MD.apLastUpdated price > now 
            then now 
            else MD.apLastUpdated price
        }

-- | Normalize symbol to uppercase
normalizeSymbol :: MD.AssetPrice -> IO MD.AssetPrice
normalizeSymbol price = return price
    { MD.apSymbol = T.toUpper (MD.apSymbol price)
    }

-- | Enrich asset with additional metadata
enrichWithMetadata :: Map Text a -> MD.AssetPrice -> IO MD.AssetPrice
enrichWithMetadata metadata price = do
    -- This is a placeholder - actual implementation would fetch/add metadata
    return price

-- | Validate asset data
validateAssetData :: MD.AssetPrice -> Either Text MD.AssetPrice
validateAssetData price
    | T.null (MD.apSymbol price) = Left "Symbol cannot be empty"
    | MD.apPrice price < 0 = Left "Price cannot be negative"
    | MD.apPriceInUSD price < 0 = Left "USD price cannot be negative"
    | otherwise = Right price

-- | Convert currency (placeholder implementation)
convertCurrency :: Text -> Text -> MD.AssetPrice -> IO MD.AssetPrice
convertCurrency fromCurrency toCurrency price = do
    -- Placeholder - actual implementation would use exchange rates
    return price

-- | Run a pipeline (simplified for type safety)
runPipeline :: forall a b. TransformPipeline a b -> a -> IO (Either TransformError (TransformResult b))
runPipeline pipeline input = do
    -- This is a simplified implementation
    -- A full implementation would need to handle the heterogeneous step types
    return $ Right $ TransformResult
        { trData = undefined  -- Would be the transformed data
        , trWarnings = []
        , trMetrics = tpMetrics pipeline
        }

-- | Run pipeline asynchronously
runPipelineAsync :: TransformPipeline a b -> [a] -> IO [Either TransformError (TransformResult b)]
runPipelineAsync pipeline inputs = do
    results <- forConcurrently inputs $ runPipeline pipeline
    return results

-- | Run pipeline with retry
runPipelineWithRetry :: RetryPolicyM IO -> TransformPipeline a b -> a -> IO (Either TransformError (TransformResult b))
runPipelineWithRetry policy pipeline input = do
    retrying policy shouldRetry $ \_ -> runPipeline pipeline input
  where
    shouldRetry _ (Left (DataSourceError _)) = return True
    shouldRetry _ _ = return False

-- | Utility functions

-- | Merge asset data from multiple sources
mergeAssetData :: [MD.AssetPrice] -> MD.AssetPrice
mergeAssetData [] = error "Cannot merge empty list"
mergeAssetData [single] = single
mergeAssetData prices = 
    let sorted = sortOn MD.apLastUpdated prices
        latest = last sorted
        avgPrice = sum (map MD.apPrice prices) / fromIntegral (length prices)
    in latest { MD.apPrice = avgPrice }

-- | Deduplicate assets by symbol
deduplicateAssets :: [MD.AssetPrice] -> [MD.AssetPrice]
deduplicateAssets = nubBy (\a b -> MD.apSymbol a == MD.apSymbol b)

-- | Aggregate prices by time window
aggregatePrices :: NominalDiffTime -> [MDT.HistoricalDataPoint] -> [MDT.HistoricalDataPoint]
aggregatePrices window points =
    let groups = groupBy (\a b -> 
            diffUTCTime (MDT.hdDate a) (MDT.hdDate b) < window) points
    in map aggregateGroup groups
  where
    aggregateGroup :: [MDT.HistoricalDataPoint] -> MDT.HistoricalDataPoint
    aggregateGroup [] = error "Empty group"
    aggregateGroup group@(first:_) = first
        { MDT.hdPrice = average $ map MDT.hdPrice group
        , MDT.hdVolume = Just $ sum $ catMaybes $ map MDT.hdVolume group
        }
    
    average :: [Double] -> Double
    average xs = sum xs / fromIntegral (length xs)