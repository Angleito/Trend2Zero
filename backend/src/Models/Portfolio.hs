{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DerivingStrategies #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE QuasiQuotes #-}
{-# LANGUAGE StandaloneDeriving #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE UndecidableInstances #-}

module Models.Portfolio where

import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (UTCTime, getCurrentTime)
import Database.Persist
import Database.Persist.Sql
import Database.Persist.TH
import Models.User (UserId)

-- Portfolio Asset Type (simplified from Asset model)
data PortfolioAssetType = PortfolioStock | PortfolioCrypto
  deriving stock (Show, Read, Eq, Ord)

derivePersistField "PortfolioAssetType"

-- Define the entities using Persistent Template Haskell
share [mkPersist sqlSettings, mkMigrate "migratePortfolio"] [persistLowerCase|
Portfolio
    userId UserId
    symbol Text
    shares Double default=0      -- For stocks
    amount Double default=0      -- For crypto
    averagePrice Double
    assetType PortfolioAssetType
    notes Text Maybe
    lastUpdated UTCTime default=CURRENT_TIME
    createdAt UTCTime default=CURRENT_TIME
    updatedAt UTCTime default=CURRENT_TIME
    UniquePortfolioUserSymbol userId symbol
    deriving Eq Show

PortfolioTag
    portfolioId PortfolioId
    tag Text
    UniquePortfolioTag portfolioId tag
    deriving Eq Show
|]

-- | Calculate total value of a portfolio position
totalValue :: Portfolio -> Double
totalValue portfolio = 
    case portfolioAssetType portfolio of
        PortfolioStock -> portfolioShares portfolio * portfolioAveragePrice portfolio
        PortfolioCrypto -> portfolioAmount portfolio * portfolioAveragePrice portfolio

-- | Update a portfolio position (buy/sell)
updatePosition :: MonadIO m => Key Portfolio -> Double -> Double -> Bool -> SqlPersistT m ()
updatePosition portfolioId quantity price isStock = do
    maybePortfolio <- get portfolioId
    case maybePortfolio of
        Nothing -> return ()
        Just portfolio -> do
            currentTime <- liftIO getCurrentTime
            let field = if isStock then portfolioShares else portfolioAmount
                currentQuantity = field portfolio
                currentAvgPrice = portfolioAveragePrice portfolio
                oldTotal = currentQuantity * currentAvgPrice
                newQuantity = currentQuantity + quantity
                newTotal = oldTotal + (quantity * price)
                newAvgPrice = if newQuantity /= 0 
                              then newTotal / newQuantity
                              else 0
            
            if isStock
                then update portfolioId
                    [ PortfolioShares =. newQuantity
                    , PortfolioAveragePrice =. newAvgPrice
                    , PortfolioLastUpdated =. currentTime
                    , PortfolioUpdatedAt =. currentTime
                    ]
                else update portfolioId
                    [ PortfolioAmount =. newQuantity
                    , PortfolioAveragePrice =. newAvgPrice
                    , PortfolioLastUpdated =. currentTime
                    , PortfolioUpdatedAt =. currentTime
                    ]

-- | Add tags to a portfolio position
addTags :: MonadIO m => Key Portfolio -> [Text] -> SqlPersistT m ()
addTags portfolioId tags = do
    forM_ tags $ \tag -> do
        insertUnique $ PortfolioTag portfolioId tag
    return ()

-- | Remove tags from a portfolio position
removeTags :: MonadIO m => Key Portfolio -> [Text] -> SqlPersistT m ()
removeTags portfolioId tags = do
    deleteWhere [ PortfolioTagPortfolioId ==. portfolioId
                , PortfolioTagTag <-. tags
                ]

-- | Get total portfolio value by type
getTotalValue :: MonadIO m => Key User -> PortfolioAssetType -> SqlPersistT m Double
getTotalValue userId assetType = do
    positions <- selectList [ PortfolioUserId ==. userId
                            , PortfolioAssetType ==. assetType
                            ] []
    return $ sum $ map (totalValue . entityVal) positions

-- | Get portfolio positions by type
getPositionsByType :: MonadIO m => Key User -> PortfolioAssetType -> SqlPersistT m [Entity Portfolio]
getPositionsByType userId assetType = 
    selectList [ PortfolioUserId ==. userId
               , PortfolioAssetType ==. assetType
               ] [Desc PortfolioAveragePrice]  -- Sort by value (approximation)

-- | Get top portfolio positions
getTopPositions :: MonadIO m => Key User -> Int -> SqlPersistT m [Entity Portfolio]
getTopPositions userId limit = do
    -- Get all positions and sort by calculated total value
    allPositions <- selectList [PortfolioUserId ==. userId] []
    let sortedPositions = sortBy (\a b -> compare 
                                    (totalValue $ entityVal b) 
                                    (totalValue $ entityVal a)) allPositions
    return $ take limit sortedPositions

-- | Create a new portfolio position
createPosition :: MonadIO m => Key User -> Text -> Double -> Double -> PortfolioAssetType -> Maybe Text -> [Text] -> SqlPersistT m (Maybe (Key Portfolio))
createPosition userId symbol quantity price assetType notes tags = do
    currentTime <- liftIO getCurrentTime
    maybePortfolioId <- insertUnique $ Portfolio
        { portfolioUserId = userId
        , portfolioSymbol = T.toUpper symbol
        , portfolioShares = if assetType == PortfolioStock then quantity else 0
        , portfolioAmount = if assetType == PortfolioCrypto then quantity else 0
        , portfolioAveragePrice = price
        , portfolioAssetType = assetType
        , portfolioNotes = notes
        , portfolioLastUpdated = currentTime
        , portfolioCreatedAt = currentTime
        , portfolioUpdatedAt = currentTime
        }
    
    case maybePortfolioId of
        Just portfolioId -> do
            addTags portfolioId tags
            return $ Just portfolioId
        Nothing -> return Nothing

-- | Get all tags for a portfolio position
getPortfolioTags :: MonadIO m => Key Portfolio -> SqlPersistT m [Text]
getPortfolioTags portfolioId = do
    tags <- selectList [PortfolioTagPortfolioId ==. portfolioId] []
    return $ map (portfolioTagTag . entityVal) tags

-- Helper imports needed for sorting
import Data.List (sortBy)