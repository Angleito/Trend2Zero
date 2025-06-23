{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE FlexibleContexts #-}

module Services.MarketData
    ( MarketDataService(..)
    , MarketDataConfig(..)
    , MarketAsset(..)
    , MarketOverview(..)
    , AssetPrice(..)
    , HistoricalDataPoint(..)
    , ListOptions(..)
    , DataSource(..)
    , createMarketDataService
    , getMarketOverview
    , getPopularAssets
    , getAssetPrice
    , getHistoricalData
    , searchAssets
    , listAvailableAssets
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

-- Import our service modules
import qualified Services.CoinGecko as CG
import qualified Services.AlphaVantage as AV
import qualified Services.MetalPrice as MP
import qualified Config.Services as Config

-- | Data source indicator
data DataSource = CoinGecko | AlphaVantage | MetalPrice | Mixed
    deriving (Show, Eq, Generic)

instance ToJSON DataSource
instance FromJSON DataSource

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

-- | Market Asset (unified type)
data MarketAsset = MarketAsset
    { maId :: Text
    , maSymbol :: Text
    , maName :: Text
    , maType :: Text
    , maPrice :: Double
    , maChange24h :: Maybe Double
    , maMarketCap :: Maybe Double
    , maVolume24h :: Maybe Double
    , maImage :: Maybe Text
    , maRank :: Maybe Int
    , maSource :: DataSource
    } deriving (Show, Eq, Generic)

instance ToJSON MarketAsset where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 2 }

instance FromJSON MarketAsset where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 2 }

-- | Market Overview
data MarketOverview = MarketOverview
    { moTotalMarketCap :: Double
    , moTotalVolume24h :: Double
    , moBtcDominance :: Double
    , moMarketCapChange24h :: Double
    , moActiveCryptocurrencies :: Int
    , moMarkets :: Int
    , moLastUpdated :: UTCTime
    } deriving (Show, Eq, Generic)

instance ToJSON MarketOverview where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 2 }

instance FromJSON MarketOverview where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 2 }

-- | Asset Price (unified from both services)
data AssetPrice = AssetPrice
    { apSymbol :: Text
    , apName :: Text
    , apType :: Text
    , apPrice :: Double
    , apPriceInUSD :: Double
    , apPriceInBTC :: Double
    , apChange :: Double
    , apChangePercent :: Double
    , apVolume24h :: Maybe Double
    , apMarketCap :: Maybe Double
    , apLastUpdated :: UTCTime
    , apSource :: DataSource
    } deriving (Show, Eq, Generic)

instance ToJSON AssetPrice where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 2 }

instance FromJSON AssetPrice where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 2 }

-- | Historical Data Point (shared)
data HistoricalDataPoint = HistoricalDataPoint
    { hdpTimestamp :: Integer
    , hdpDate :: UTCTime
    , hdpPrice :: Double
    , hdpValue :: Double
    , hdpOpen :: Double
    , hdpHigh :: Double
    , hdpLow :: Double
    , hdpClose :: Double
    , hdpVolume :: Maybe Double
    } deriving (Show, Eq, Generic)

instance ToJSON HistoricalDataPoint where
    toJSON = genericToJSON $ defaultOptions { fieldLabelModifier = drop 3 }

instance FromJSON HistoricalDataPoint where
    parseJSON = genericParseJSON $ defaultOptions { fieldLabelModifier = drop 3 }

-- | List options for asset queries
data ListOptions = ListOptions
    { loCategory :: Maybe Text
    , loKeywords :: Maybe Text
    , loPage :: Maybe Int
    , loPageSize :: Maybe Int
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
            Just <$> MP.createMetalPriceService (Just key) `catch` handleMetalPriceError
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
getMarketOverview :: MarketDataService -> IO (Maybe MarketOverview)
getMarketOverview service = do
    assets <- getPopularAssets service
    if null assets
        then return Nothing
        else do
            now <- getCurrentTime
            let cryptoAssets = filter (\a -> maType a == "cryptocurrency") assets
                totalMarketCap = sum $ catMaybes $ map maMarketCap assets
                totalVolume = sum $ catMaybes $ map maVolume24h assets
                btcAsset = find (\a -> maSymbol a == "BTC") assets
                btcDominance = case btcAsset >>= maMarketCap of
                    Just btcCap -> if totalMarketCap > 0 
                        then (btcCap / totalMarketCap) * 100
                        else 0
                    Nothing -> 0
                avgChange = average $ catMaybes $ map maChange24h assets
                
            return $ Just $ MarketOverview
                { moTotalMarketCap = totalMarketCap
                , moTotalVolume24h = totalVolume
                , moBtcDominance = btcDominance
                , moMarketCapChange24h = avgChange
                , moActiveCryptocurrencies = length cryptoAssets
                , moMarkets = 0  -- Would need additional data
                , moLastUpdated = now
                }
  where
    average xs = if null xs then 0 else sum xs / fromIntegral (length xs)

-- | Get popular assets with load balancing
getPopularAssets :: MarketDataService -> IO [MarketAsset]
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
    handleCoinGeckoError :: SomeException -> IO [CG.MarketAsset]
    handleCoinGeckoError _ = do
        -- Mark CoinGecko as rate limited
        atomically $ modifyTVar' (rateLimitState service) $ \s -> 
            s { coinGeckoLimited = True }
        return []
    
    convertCoinGeckoAsset :: CG.MarketAsset -> MarketAsset
    convertCoinGeckoAsset cg = MarketAsset
        { maId = CG.maSymbol cg  -- Use symbol as ID for now
        , maSymbol = CG.maSymbol cg
        , maName = CG.maName cg
        , maType = CG.maType cg
        , maPrice = CG.maPrice cg
        , maChange24h = Just $ CG.maChangePercent cg
        , maMarketCap = Nothing  -- CoinGecko asset doesn't have this
        , maVolume24h = Nothing
        , maImage = Nothing
        , maRank = Nothing
        , maSource = CoinGecko
        }
    
    createPredefinedAsset :: (Text, Text, Text) -> MarketAsset
    createPredefinedAsset (symbol, name, assetType) = MarketAsset
        { maId = T.toLower symbol
        , maSymbol = symbol
        , maName = name
        , maType = assetType
        , maPrice = 0
        , maChange24h = Nothing
        , maMarketCap = Nothing
        , maVolume24h = Nothing
        , maImage = Nothing
        , maRank = Nothing
        , maSource = Mixed
        }

-- | Enrich predefined assets with live price data
enrichPredefinedAssets :: MarketDataService -> [(Text, Text, Text)] -> IO [MarketAsset]
enrichPredefinedAssets service predefinedList = do
    -- Concurrently fetch prices for all assets
    enrichedAssets <- forConcurrently predefinedList $ \(symbol, name, assetType) -> do
        maybePrice <- getAssetPrice service symbol `catch` handleError
        return MarketAsset
            { maId = T.toLower symbol
            , maSymbol = symbol
            , maName = name
            , maType = assetType
            , maPrice = maybe 0 apPrice maybePrice
            , maChange24h = maybePrice >>= (Just . apChangePercent)
            , maMarketCap = maybePrice >>= apMarketCap
            , maVolume24h = maybePrice >>= apVolume24h
            , maImage = Nothing
            , maRank = Nothing
            , maSource = maybe Mixed apSource maybePrice
            }
    
    -- Filter out assets with zero prices (failed to fetch)
    let validAssets = filter (\a -> maPrice a > 0) enrichedAssets
    putStrLn $ "[MarketData] Successfully enriched " ++ show (length validAssets) ++ " assets"
    
    -- If we have few valid assets, include some with zero prices
    if length validAssets < 5
        then return $ take 10 enrichedAssets
        else return validAssets
  where
    handleError :: SomeException -> IO (Maybe AssetPrice)
    handleError e = do
        putStrLn $ "[MarketData] Error enriching asset: " ++ show e
        return Nothing

-- | Get asset price with failover
getAssetPrice :: MarketDataService -> Text -> IO (Maybe AssetPrice)
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
                                    return maybePrice
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
    getAssetType sym = 
        case lookup sym predefinedAssets of
            Just (_, _, t) -> t
            Nothing -> "cryptocurrency"  -- Default assumption
    
    handleCoinGeckoError :: SomeException -> IO (Maybe CG.AssetPrice)
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
    
    convertCoinGeckoPrice :: CG.AssetPrice -> AssetPrice
    convertCoinGeckoPrice cg = AssetPrice
        { apSymbol = CG.apSymbol cg
        , apName = CG.apName cg
        , apType = CG.apType cg
        , apPrice = CG.apPrice cg
        , apPriceInUSD = CG.apPriceInUSD cg
        , apPriceInBTC = CG.apPriceInBTC cg
        , apChange = CG.apChange cg
        , apChangePercent = CG.apChangePercent cg
        , apVolume24h = CG.apVolume24h cg
        , apMarketCap = CG.apMarketCap cg
        , apLastUpdated = CG.apLastUpdated cg
        , apSource = CoinGecko
        }
    
    convertAlphaVantagePrice :: AV.AssetData -> AssetPrice
    convertAlphaVantagePrice av = AssetPrice
        { apSymbol = AV.adSymbol av
        , apName = AV.adName av
        , apType = AV.adType av
        , apPrice = AV.adPrice av
        , apPriceInUSD = AV.adPriceInUSD av
        , apPriceInBTC = AV.adPriceInBTC av
        , apChange = AV.adChange av
        , apChangePercent = AV.adChangePercent av
        , apVolume24h = Nothing  -- AlphaVantage doesn't provide this
        , apMarketCap = Nothing
        , apLastUpdated = parseTimeOrError True defaultTimeLocale "%Y-%m-%d" (T.unpack $ AV.adLastUpdated av)
        , apSource = AlphaVantage
        }

-- | Get historical data with appropriate service selection
getHistoricalData :: MarketDataService -> Text -> Int -> IO [HistoricalDataPoint]
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
    getAssetType sym = 
        case lookup sym predefinedAssets of
            Just (_, _, t) -> t
            Nothing -> "cryptocurrency"
    
    handleError :: SomeException -> IO [a]
    handleError _ = return []
    
    convertCGHistoricalPoint :: CG.HistoricalDataPoint -> HistoricalDataPoint
    convertCGHistoricalPoint cg = HistoricalDataPoint
        { hdpTimestamp = CG.hdpTimestamp cg
        , hdpDate = CG.hdpDate cg
        , hdpPrice = CG.hdpPrice cg
        , hdpValue = CG.hdpValue cg
        , hdpOpen = CG.hdpOpen cg
        , hdpHigh = CG.hdpHigh cg
        , hdpLow = CG.hdpLow cg
        , hdpClose = CG.hdpClose cg
        , hdpVolume = CG.hdpVolume cg
        }
    
    convertAVHistoricalPoint :: AV.HistoricalDataPoint -> HistoricalDataPoint
    convertAVHistoricalPoint av = HistoricalDataPoint
        { hdpTimestamp = AV.hdpTimestamp av
        , hdpDate = AV.hdpDate av
        , hdpPrice = AV.hdpPrice av
        , hdpValue = AV.hdpValue av
        , hdpOpen = AV.hdpOpen av
        , hdpHigh = AV.hdpHigh av
        , hdpLow = AV.hdpLow av
        , hdpClose = AV.hdpClose av
        , hdpVolume = Just $ fromIntegral $ AV.hdpVolume av
        }

-- | Search assets across services
searchAssets :: MarketDataService -> Text -> Int -> IO [MarketAsset]
searchAssets service query limit = do
    -- Search in predefined assets first
    let searchLower = T.toLower query
        predefinedResults = filter (matchesQuery searchLower) $ 
            map createPredefinedAsset predefinedAssets
    
    -- If we have enough results, return them
    if length predefinedResults >= limit
        then return $ take limit predefinedResults
        else do
            -- Search using CoinGecko
            cgResults <- case coinGeckoService service of
                Just cg -> do
                    results <- CG.searchAssets cg query (limit - length predefinedResults) `catch` handleError
                    return $ map convertCoinGeckoAsset results
                Nothing -> return []
            
            -- Combine and deduplicate results
            let allResults = predefinedResults ++ cgResults
                deduped = nubBy (\a b -> maSymbol a == maSymbol b) allResults
            return $ take limit deduped
  where
    matchesQuery searchTerm (symbol, name, _) =
        T.isInfixOf searchTerm (T.toLower symbol) ||
        T.isInfixOf searchTerm (T.toLower name)
    
    createPredefinedAsset (symbol, name, assetType) = MarketAsset
        { maId = T.toLower symbol
        , maSymbol = symbol
        , maName = name
        , maType = assetType
        , maPrice = 0
        , maChange24h = Nothing
        , maMarketCap = Nothing
        , maVolume24h = Nothing
        , maImage = Nothing
        , maRank = Nothing
        , maSource = Mixed
        }
    
    convertCoinGeckoAsset cg = MarketAsset
        { maId = CG.maSymbol cg
        , maSymbol = CG.maSymbol cg
        , maName = CG.maName cg
        , maType = CG.maType cg
        , maPrice = CG.maPrice cg
        , maChange24h = Just $ CG.maChangePercent cg
        , maMarketCap = Nothing
        , maVolume24h = Nothing
        , maImage = Nothing
        , maRank = Nothing
        , maSource = CoinGecko
        }
    
    handleError :: SomeException -> IO [CG.MarketAsset]
    handleError _ = return []

-- | List available assets with pagination
listAvailableAssets :: MarketDataService -> ListOptions -> IO (Maybe ([(MarketAsset, Int)], Int))
listAvailableAssets service options = do
    let filteredAssets = applyFilters predefinedAssets
        page = fromMaybe 1 (loPage options)
        pageSize = fromMaybe 20 (loPageSize options)
        start = (page - 1) * pageSize
        paginatedAssets = take pageSize $ drop start filteredAssets
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
                , maPrice = maybe 0 apPrice maybePrice
                , maChange24h = apChangePercent <$> maybePrice
                , maMarketCap = maybePrice >>= apMarketCap
                , maVolume24h = maybePrice >>= apVolume24h
                , maImage = Nothing
                , maRank = Nothing
                , maSource = maybe Mixed apSource maybePrice
                }
        return baseAsset
    
    return $ Just (zip assets [start + 1..], totalCount)
  where
    applyFilters assets =
        let categoryFiltered = case loCategory options of
                Just cat -> filter (\(_, _, t) -> t == T.toLower cat) assets
                Nothing -> assets
            keywordFiltered = case loKeywords options of
                Just kw -> 
                    let kwLower = T.toLower kw
                    in filter (\(s, n, _) -> 
                        T.isInfixOf kwLower (T.toLower s) ||
                        T.isInfixOf kwLower (T.toLower n)) categoryFiltered
                Nothing -> categoryFiltered
        in keywordFiltered