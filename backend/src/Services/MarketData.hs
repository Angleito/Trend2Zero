{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE FlexibleContexts #-}

module Services.MarketData
    ( MarketDataService(..)
    , MarketDataConfig(..)
    , createMarketDataService
    , getMarketOverview
    , getPopularAssets
    , getAssetPrice
    , getHistoricalData
    , searchAssets
    , listAvailableAssets
    -- Re-export shared types
    , module Services.MarketDataTypes
    ) where

import Control.Concurrent.Async (forConcurrently)
import Control.Concurrent.STM
import Control.Exception (SomeException, catch)
import Control.Monad (forM, when)
import Control.Monad.IO.Class (liftIO)
import Data.Aeson
import Data.List (sortOn, nub, nubBy, find)
import Data.Maybe (fromMaybe, catMaybes, isJust, listToMaybe)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import GHC.Generics
import System.Environment (lookupEnv)

-- Import shared types
import Services.MarketDataTypes
import qualified Services.MarketDataTypes as MDT
import qualified Types

-- Import our service modules
import qualified Services.CoinGecko as CG
import qualified Services.AlphaVantage as AV
import qualified Services.MetalPrice as MP
import qualified Config.Services as Config

-- Additional imports for conversion
import qualified Services.MarketDataTypes as MD


-- | Market Data Configuration
data MarketDataConfig = MarketDataConfig
    { enableCoinGecko :: Bool
    , enableAlphaVantage :: Bool
    , enableMetalPrice :: Bool
    , coinGeckoApiKey :: Maybe Text
    , alphaVantageApiKey :: Maybe Text
    , metalPriceApiKey :: Maybe Text
    , cacheEnabled :: Bool
    , useMockData :: Bool
    , servicesConfig :: Maybe Config.ServicesConfig
    } deriving (Show, Eq)

-- | Market Data Service State
data MarketDataService = MarketDataService
    { config :: MarketDataConfig
    , coinGeckoService :: Maybe CG.CoinGeckoService
    , alphaVantageService :: Maybe AV.AlphaVantageService
    , metalPriceService :: Maybe MP.MetalPriceService
    , rateLimitState :: TVar RateLimitState
    }

-- | Rate limit tracking
data RateLimitState = RateLimitState
    { coinGeckoLimited :: Bool
    , alphaVantageLimited :: Bool
    , metalPriceLimited :: Bool
    , lastResetTime :: UTCTime
    } deriving (Show, Eq)


-- | Predefined asset mappings
predefinedAssets :: [(Text, Text, Text)]  -- (symbol, name, type)
predefinedAssets =
    [ ("BTC", "Bitcoin", "cryptocurrency")
    , ("ETH", "Ethereum", "cryptocurrency")
    , ("SOL", "Solana", "cryptocurrency")
    , ("AAPL", "Apple Inc.", "stocks")
    , ("GOOGL", "Alphabet Inc.", "stocks")
    , ("MSFT", "Microsoft Corporation", "stocks")
    , ("XAU", "Gold", "commodity")
    , ("XAG", "Silver", "commodity")
    , ("XPT", "Platinum", "commodity")
    , ("XPD", "Palladium", "commodity")
    ]

-- | Create a new MarketData service instance
createMarketDataService :: IO MarketDataService
createMarketDataService = do
    -- Load configuration from environment
    cgApiKey <- fmap T.pack <$> lookupEnv "COINGECKO_API_KEY"
    avApiKey <- fmap T.pack <$> lookupEnv "ALPHA_VANTAGE_API_KEY"
    mpApiKey <- fmap T.pack <$> lookupEnv "METAL_PRICE_API_KEY"
    useMock <- fmap (== "true") <$> lookupEnv "USE_MOCK_DATA"
    
    -- Load services configuration
    servicesConfig <- Config.loadServicesConfig
    
    let config = MarketDataConfig
            { enableCoinGecko = isJust cgApiKey || cgApiKey == Just ""
            , enableAlphaVantage = isJust avApiKey
            , enableMetalPrice = isJust mpApiKey
            , coinGeckoApiKey = cgApiKey
            , alphaVantageApiKey = avApiKey
            , metalPriceApiKey = mpApiKey
            , cacheEnabled = True
            , useMockData = fromMaybe False useMock
            , servicesConfig = Just servicesConfig
            }
    
    -- Initialize services with proper error handling and logging
    putStrLn "[MarketData] Initializing market data services..."
    
    cgService <- if enableCoinGecko config
        then do
            putStrLn "[MarketData] Initializing CoinGecko service..."
            Just <$> CG.createCoinGeckoService cgApiKey
        else return Nothing
    
    avService <- case avApiKey of
        Just key -> do
            putStrLn "[MarketData] Initializing AlphaVantage service..."
            Just <$> AV.createAlphaVantageService key
        Nothing -> return Nothing
    
    mpService <- case mpApiKey of
        Just key -> do
            putStrLn "[MarketData] Initializing MetalPrice service..."
            (Just <$> MP.createMetalPriceService (Just key)) `catch` handleMetalPriceError
        Nothing -> return Nothing
    
    -- Initialize rate limit state
    now <- getCurrentTime
    rateLimitVar <- newTVarIO $ RateLimitState False False False now
    
    putStrLn $ "[MarketData] Services initialized: " ++ 
        "CoinGecko=" ++ show (isJust cgService) ++ 
        ", AlphaVantage=" ++ show (isJust avService) ++ 
        ", MetalPrice=" ++ show (isJust mpService)
    
    return $ MarketDataService
        { config = config
        , coinGeckoService = cgService
        , alphaVantageService = avService
        , metalPriceService = mpService
        , rateLimitState = rateLimitVar
        }
  where
    handleMetalPriceError :: SomeException -> IO (Maybe MP.MetalPriceService)
    handleMetalPriceError e = do
        putStrLn $ "[MarketData] Failed to initialize MetalPrice service: " ++ show e
        return Nothing

-- | Get market overview  
getMarketOverview :: MarketDataService -> IO (Maybe Types.MarketOverview)
getMarketOverview service = do
    assets <- getPopularAssets service
    if null assets
        then return Nothing
        else do
            now <- getCurrentTime
            let cryptoAssets = filter (\a -> Types.maType a == Just "cryptocurrency") assets
                totalMarketCap = sum $ catMaybes $ map Types.maMarketCap assets
                totalVolume = sum $ catMaybes $ map Types.maVolume24h assets
                btcAsset = find (\a -> Types.maSymbol a == "BTC") assets
                btcDominance = case btcAsset >>= Types.maMarketCap of
                    Just btcCap -> if totalMarketCap > 0 
                        then (btcCap / totalMarketCap) * 100
                        else 0
                    Nothing -> 0
                avgChange = average $ catMaybes $ map Types.maChange24h assets
                
            return $ Just $ Types.MarketOverview
                { Types.moTotalMarketCap = totalMarketCap
                , Types.moTotalVolume = totalVolume
                , Types.moTotalVolume24h = totalVolume
                , Types.moBtcDominance = btcDominance
                , Types.moMarketCapChange24h = avgChange
                , Types.moActiveCryptocurrencies = length cryptoAssets
                , Types.moMarkets = 0
                , Types.moTotalAssets = length assets
                , Types.moTopMovers = []
                , Types.moRecentlyAdded = []
                , Types.moLastUpdated = now
                }
  where
    average xs = if null xs then 0 else sum xs / fromIntegral (length xs)

-- | Get popular assets with load balancing
getPopularAssets :: MarketDataService -> IO [Types.MarketAsset]
getPopularAssets service = do
    putStrLn "[MarketData] Getting popular assets..."
    rateState <- readTVarIO (rateLimitState service)
    
    -- Try CoinGecko first if available and not rate limited
    cgAssets <- case coinGeckoService service of
        Just cg | not (coinGeckoLimited rateState) -> do
            putStrLn "[MarketData] Fetching from CoinGecko..."
            result <- CG.getTopAssets cg 10 `catch` handleCoinGeckoError
            case result of
                [] -> return []
                assets -> return $ map convertCoinGeckoAsset assets
        _ -> return []
    
    -- If we got results from CoinGecko, return them
    if not (null cgAssets)
        then do
            putStrLn $ "[MarketData] Returning " ++ show (length cgAssets) ++ " assets from CoinGecko"
            return cgAssets
        else do
            -- Fallback to predefined assets with enriched data
            putStrLn "[MarketData] Enriching predefined assets with live prices..."
            enrichedAssets <- enrichPredefinedAssets service $ take 10 predefinedAssets
            return enrichedAssets
  where
    handleCoinGeckoError :: SomeException -> IO [MDT.MarketAsset]
    handleCoinGeckoError _ = do
        -- Mark CoinGecko as rate limited
        atomically $ modifyTVar' (rateLimitState service) $ \s -> 
            s { coinGeckoLimited = True }
        return []
    
    convertCoinGeckoAsset :: MDT.MarketAsset -> Types.MarketAsset
    convertCoinGeckoAsset cg = Types.MarketAsset
        { Types.maId = MDT.maId cg
        , Types.maSymbol = MDT.maSymbol cg
        , Types.maName = MDT.maName cg
        , Types.maPrice = MDT.maPrice cg
        , Types.maPriceInUSD = Just $ MDT.maPrice cg
        , Types.maPriceInBTC = Just $ MDT.maPriceInBTC cg
        , Types.maChange = 0
        , Types.maChangePercent = 0
        , Types.maChange24h = Just $ MDT.maChange24h cg
        , Types.maVolume24h = Just $ MDT.maVolume24h cg
        , Types.maMarketCap = Just $ MDT.maMarketCap cg
        , Types.maCategory = Nothing
        , Types.maType = Just $ MDT.maType cg
        , Types.maImage = Nothing
        , Types.maRank = Just $ MDT.maRank cg
        , Types.maSource = Just $ T.pack $ show $ MDT.maSource cg
        , Types.maLastUpdated = ""
        }
    
    createPredefinedAsset :: (Text, Text, Text) -> Types.MarketAsset
    createPredefinedAsset (symbol, name, assetType) = Types.MarketAsset
        { Types.maId = T.toLower symbol
        , Types.maSymbol = symbol
        , Types.maName = name
        , Types.maPrice = 0
        , Types.maPriceInUSD = Nothing
        , Types.maPriceInBTC = Nothing
        , Types.maChange = 0
        , Types.maChangePercent = 0
        , Types.maChange24h = Nothing
        , Types.maVolume24h = Nothing
        , Types.maMarketCap = Nothing
        , Types.maCategory = Nothing
        , Types.maType = Just assetType
        , Types.maImage = Nothing
        , Types.maRank = Nothing
        , Types.maSource = Nothing
        , Types.maLastUpdated = ""
        }

-- | Enrich predefined assets with live price data
enrichPredefinedAssets :: MarketDataService -> [(Text, Text, Text)] -> IO [Types.MarketAsset]
enrichPredefinedAssets service predefinedList = do
    -- Concurrently fetch prices for all assets
    enrichedAssets <- forConcurrently predefinedList $ \(symbol, name, assetType) -> do
        maybePrice <- getAssetPrice service symbol `catch` handleError
        return Types.MarketAsset
            { Types.maId = T.toLower symbol
            , Types.maSymbol = symbol
            , Types.maName = name
            , Types.maPrice = maybe 0 Types.apPrice maybePrice
            , Types.maPriceInUSD = maybePrice >>= Types.apPriceInUSD
            , Types.maPriceInBTC = maybePrice >>= Types.apPriceInBTC
            , Types.maChange = maybe 0 Types.apChange maybePrice
            , Types.maChangePercent = maybe 0 Types.apChangePercent maybePrice
            , Types.maChange24h = Just $ maybe 0 Types.apChangePercent maybePrice
            , Types.maVolume24h = Nothing
            , Types.maMarketCap = Nothing
            , Types.maCategory = Nothing
            , Types.maType = Just assetType
            , Types.maImage = Nothing
            , Types.maRank = Nothing
            , Types.maSource = maybePrice >>= Types.apType
            , Types.maLastUpdated = maybe "" (fromMaybe "") (fmap Types.apLastUpdated maybePrice)
            }
    
    -- Filter out assets with zero prices (failed to fetch)
    let validAssets = filter (\a -> Types.maPrice a > 0) enrichedAssets
    putStrLn $ "[MarketData] Successfully enriched " ++ show (length validAssets) ++ " assets"
    
    -- If we have few valid assets, include some with zero prices
    if length validAssets < 5
        then return $ take 10 enrichedAssets
        else return validAssets
  where
    handleError :: SomeException -> IO (Maybe Types.AssetPrice)
    handleError e = do
        putStrLn $ "[MarketData] Error enriching asset: " ++ show e
        return Nothing

-- | Get asset price with failover
getAssetPrice :: MarketDataService -> Text -> IO (Maybe Types.AssetPrice)
getAssetPrice service symbol = do
    rateState <- readTVarIO (rateLimitState service)
    
    -- Log the request
    putStrLn $ "[MarketData] Getting price for symbol: " ++ T.unpack symbol
    
    -- Determine asset type
    let assetType = getAssetType symbol
        isCrypto = assetType == "cryptocurrency"
        isStock = assetType == "stocks"
        isCommodity = assetType == "commodity"
    
    -- Try appropriate service based on asset type
    if isCrypto
        then do
            -- Try CoinGecko for crypto
            cgPrice <- case coinGeckoService service of
                Just cg | not (coinGeckoLimited rateState) -> do
                    maybePrice <- CG.getCryptoPrice cg symbol `catch` handleCoinGeckoError
                    return $ fmap convertCoinGeckoPrice maybePrice
                _ -> return Nothing
            
            case cgPrice of
                Just price -> return $ Just price
                Nothing -> 
                    -- Try AlphaVantage as fallback for crypto
                    case alphaVantageService service of
                        Just av | not (alphaVantageLimited rateState) -> do
                            result <- AV.getCryptoCurrencyData av symbol `catch` handleAlphaVantageError
                            case result of
                                Right avData -> return $ Just $ convertAlphaVantagePrice avData
                                Left _ -> return Nothing
                        _ -> return Nothing
        else if isStock
            then do
                -- Try AlphaVantage for stocks
                case alphaVantageService service of
                    Just av | not (alphaVantageLimited rateState) -> do
                        result <- AV.getStockData av symbol `catch` handleAlphaVantageError
                        case result of
                            Right avData -> return $ Just $ convertAlphaVantagePrice avData
                            Left _ -> return Nothing
                    _ -> return Nothing
            else if isCommodity
                then do
                    -- Try MetalPrice service for commodities
                    case metalPriceService service of
                        Just mp | not (metalPriceLimited rateState) -> do
                            let metalSymbol = textToMetalSymbol symbol
                            case metalSymbol of
                                Just ms -> do
                                    putStrLn $ "[MarketData] Fetching metal price for: " ++ T.unpack symbol
                                    maybePrice <- MP.getMetalPrice mp ms `catch` handleMetalPriceError
                                    return $ fmap convertMDAssetPrice maybePrice
                                Nothing -> do
                                    putStrLn $ "[MarketData] Unknown metal symbol: " ++ T.unpack symbol
                                    return Nothing
                        _ -> do
                            putStrLn $ "[MarketData] Metal price service not available or rate limited"
                            return Nothing
                else do
                    putStrLn $ "[MarketData] Unknown asset type: " ++ T.unpack assetType
                    return Nothing
  where
    getAssetType :: Text -> Text
    getAssetType sym = 
        case find (\(s, _, _) -> s == sym) predefinedAssets of
            Just (_, _, t) -> t
            Nothing -> "cryptocurrency"  -- Default assumption
    
    handleCoinGeckoError :: SomeException -> IO (Maybe AssetPrice)
    handleCoinGeckoError _ = do
        atomically $ modifyTVar' (rateLimitState service) $ \s -> 
            s { coinGeckoLimited = True }
        return Nothing
    
    handleAlphaVantageError :: SomeException -> IO (Either AV.AlphaVantageError AV.AssetData)
    handleAlphaVantageError e = do
        atomically $ modifyTVar' (rateLimitState service) $ \s -> 
            s { alphaVantageLimited = True }
        return $ Left $ AV.NetworkError $ T.pack $ show e
    
    handleMetalPriceError :: SomeException -> IO (Maybe AssetPrice)
    handleMetalPriceError e = do
        putStrLn $ "[MarketData] Metal price error: " ++ show e
        atomically $ modifyTVar' (rateLimitState service) $ \s -> 
            s { metalPriceLimited = True }
        return Nothing
    
    textToMetalSymbol :: Text -> Maybe MP.MetalSymbol
    textToMetalSymbol "XAU" = Just MP.Gold
    textToMetalSymbol "XAG" = Just MP.Silver
    textToMetalSymbol "XPT" = Just MP.Platinum
    textToMetalSymbol "XPD" = Just MP.Palladium
    textToMetalSymbol _ = Nothing
    
    convertCoinGeckoPrice :: MDT.AssetPrice -> Types.AssetPrice
    convertCoinGeckoPrice cg = Types.AssetPrice
        { Types.apSymbol = MDT.apSymbol cg
        , Types.apName = Just $ MDT.apName cg
        , Types.apPrice = MDT.apPrice cg
        , Types.apPriceInUSD = Just $ MDT.apPriceInUSD cg
        , Types.apPriceInBTC = Just $ MDT.apPriceInBTC cg
        , Types.apChange = MDT.apChange cg
        , Types.apChangePercent = MDT.apChangePercent cg
        , Types.apLastUpdated = Just $ T.pack $ show $ MDT.apLastUpdated cg
        , Types.apType = Just $ MDT.apType cg
        }
    
    convertAlphaVantagePrice :: AV.AssetData -> Types.AssetPrice
    convertAlphaVantagePrice av = Types.AssetPrice
        { Types.apSymbol = AV.adSymbol av
        , Types.apName = Just $ AV.adName av
        , Types.apPrice = AV.adPrice av
        , Types.apPriceInUSD = Just $ AV.adPriceInUSD av
        , Types.apPriceInBTC = Just $ AV.adPriceInBTC av
        , Types.apChange = AV.adChange av
        , Types.apChangePercent = AV.adChangePercent av
        , Types.apLastUpdated = Just $ AV.adLastUpdated av
        , Types.apType = Just $ AV.adType av
        }
    
    -- Convert from Services.MarketDataTypes.AssetPrice to Types.AssetPrice
    convertMDAssetPrice :: MD.AssetPrice -> Types.AssetPrice
    convertMDAssetPrice md = Types.AssetPrice
        { Types.apSymbol = MD.apSymbol md
        , Types.apName = Just $ MD.apName md
        , Types.apPrice = MD.apPrice md
        , Types.apPriceInUSD = Just $ MD.apPriceInUSD md
        , Types.apPriceInBTC = Just $ MD.apPriceInBTC md
        , Types.apChange = MD.apChange md
        , Types.apChangePercent = MD.apChangePercent md
        , Types.apLastUpdated = Just $ T.pack $ show $ MD.apLastUpdated md
        , Types.apType = Just $ MD.apType md
        }

-- | Get historical data with appropriate service selection
getHistoricalData :: MarketDataService -> Text -> Int -> IO [Types.HistoricalDataPoint]
getHistoricalData service symbol days = do
    let assetType = getAssetType symbol
        isCrypto = assetType == "cryptocurrency"
    
    if isCrypto
        then do
            -- Use CoinGecko for crypto historical data
            case coinGeckoService service of
                Just cg -> do
                    cgData <- CG.getHistoricalData cg symbol days `catch` handleError
                    return $ map convertCGHistoricalPoint cgData
                Nothing -> return []
        else do
            -- Use AlphaVantage for stocks
            case alphaVantageService service of
                Just av -> do
                    avData <- AV.getHistoricalData av symbol days `catch` handleError
                    return $ map convertAVHistoricalPoint avData
                Nothing -> return []
  where
    getAssetType :: Text -> Text
    getAssetType sym = 
        case find (\(s, _, _) -> s == sym) predefinedAssets of
            Just (_, _, t) -> t
            Nothing -> "cryptocurrency"
    
    handleError :: SomeException -> IO [a]
    handleError _ = return []
    
    convertCGHistoricalPoint :: MDT.HistoricalDataPoint -> Types.HistoricalDataPoint
    convertCGHistoricalPoint cg = Types.HistoricalDataPoint
        { Types.hdTimestamp = MDT.hdTimestamp cg
        , Types.hdDate = MDT.hdDate cg
        , Types.hdPrice = MDT.hdPrice cg
        , Types.hdValue = MDT.hdPrice cg  -- Use price as value
        , Types.hdOpen = MDT.hdPrice cg   -- Use price for OHLC if not available
        , Types.hdHigh = MDT.hdPrice cg
        , Types.hdLow = MDT.hdPrice cg
        , Types.hdClose = MDT.hdPrice cg
        , Types.hdVolume = MDT.hdVolume cg
        }
    
    convertAVHistoricalPoint :: MDT.HistoricalDataPoint -> Types.HistoricalDataPoint
    convertAVHistoricalPoint av = Types.HistoricalDataPoint
        { Types.hdTimestamp = MDT.hdTimestamp av
        , Types.hdDate = MDT.hdDate av
        , Types.hdPrice = MDT.hdPrice av
        , Types.hdValue = MDT.hdPrice av  -- Use price as value
        , Types.hdOpen = MDT.hdPrice av   -- Use price for OHLC if not available
        , Types.hdHigh = MDT.hdPrice av
        , Types.hdLow = MDT.hdPrice av
        , Types.hdClose = MDT.hdPrice av
        , Types.hdVolume = MDT.hdVolume av
        }

-- | Search assets across services
searchAssets :: MarketDataService -> Text -> Int -> IO [Types.MarketAsset]
searchAssets service query limit = do
    -- Search in predefined assets first
    let searchLower = T.toLower query
        predefinedResults :: [Types.MarketAsset]
        predefinedResults = filter (matchesQuery searchLower) $ 
            map createPredefinedAsset predefinedAssets
    
    -- If we have enough results, return them
    if length predefinedResults >= limit
        then return $ take limit predefinedResults
        else do
            -- Search using CoinGecko
            cgResults <- case coinGeckoService service of
                Just cg -> do
                    results <- CG.searchAssets cg query (limit - length predefinedResults) `catch` handleCGError
                    return $ map convertCoinGeckoAsset results
                Nothing -> return []
            
            -- Combine and deduplicate results
            let allResults = predefinedResults ++ cgResults
                deduped = nubBy (\a b -> Types.maSymbol a == Types.maSymbol b) allResults
            return $ take limit deduped
  where
    matchesQuery searchTerm asset =
        T.isInfixOf searchTerm (T.toLower (Types.maSymbol asset)) ||
        T.isInfixOf searchTerm (T.toLower (Types.maName asset))
    
    createPredefinedAsset (symbol, name, assetType) = Types.MarketAsset
        { Types.maId = T.toLower symbol
        , Types.maSymbol = symbol
        , Types.maName = name
        , Types.maPrice = 0
        , Types.maPriceInUSD = Nothing
        , Types.maPriceInBTC = Nothing
        , Types.maChange = 0
        , Types.maChangePercent = 0
        , Types.maChange24h = Nothing
        , Types.maVolume24h = Nothing
        , Types.maMarketCap = Nothing
        , Types.maCategory = Nothing
        , Types.maType = Just assetType
        , Types.maImage = Nothing
        , Types.maRank = Nothing
        , Types.maSource = Nothing
        , Types.maLastUpdated = ""
        }
    
    convertCoinGeckoAsset cg = Types.MarketAsset
        { Types.maId = MDT.maId cg
        , Types.maSymbol = MDT.maSymbol cg
        , Types.maName = MDT.maName cg
        , Types.maPrice = MDT.maPrice cg
        , Types.maPriceInUSD = Nothing  -- CoinGecko asset doesn't have separate USD price
        , Types.maPriceInBTC = Nothing  -- CoinGecko asset doesn't have separate BTC price  
        , Types.maChange = 0
        , Types.maChangePercent = 0
        , Types.maChange24h = Just $ MDT.maChange24h cg
        , Types.maVolume24h = Just $ MDT.maVolume24h cg
        , Types.maMarketCap = Just $ MDT.maMarketCap cg
        , Types.maCategory = Nothing
        , Types.maType = Just $ MDT.maType cg
        , Types.maImage = Nothing
        , Types.maRank = Just $ MDT.maRank cg
        , Types.maSource = Nothing  -- No source field in Types.MarketAsset
        , Types.maLastUpdated = ""
        }
    
    handleError :: SomeException -> IO [Types.MarketAsset]
    handleError _ = return []
    
    handleCGError :: SomeException -> IO [MarketAsset]
    handleCGError _ = return []

-- | List available assets with pagination
listAvailableAssets :: MarketDataService -> ListOptions -> IO (Maybe ([(MarketAsset, Int)], Int))
listAvailableAssets service options = do
    let filteredAssets = applyFilters predefinedAssets
        limit = loLimit options
        offset = loOffset options
        paginatedAssets = take limit $ drop offset filteredAssets
        totalCount = length filteredAssets
        
    -- Create MarketAssets from filtered results
    assets <- forM paginatedAssets $ \(symbol, name, assetType) -> do
        -- Try to get current price
        maybePrice <- getAssetPrice service symbol
        let baseAsset = MarketAsset
                { maId = T.toLower symbol
                , maSymbol = symbol
                , maName = name
                , maType = assetType
                , maPrice = maybe 0 Types.apPrice maybePrice
                , maPriceInBTC = maybe 0 (fromMaybe 0 . Types.apPriceInBTC) maybePrice
                , maChange24h = maybe 0 Types.apChangePercent maybePrice
                , maVolume24h = 0  -- Volume not available in Types.AssetPrice
                , maMarketCap = 0  -- MarketCap not available in Types.AssetPrice
                , maRank = 0
                , maSource = Mixed  -- Default to Mixed source
                }
        return baseAsset
    
    return $ Just (zip assets [offset + 1..], totalCount)
  where
    applyFilters assets = assets  -- Simple implementation for now