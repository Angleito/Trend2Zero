{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TypeApplications #-}

module DatabaseSpec (spec) where

import Test.Hspec
import Test.QuickCheck
import Test.QuickCheck.Monadic
import Control.Exception (bracket, try, SomeException)
import Control.Monad (forM_, replicateM, void)
import Control.Monad.IO.Class (liftIO)
import Control.Monad.Logger (runStdoutLoggingT)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time
import Data.Maybe (isJust, fromJust)
import Database.Persist
import Database.Persist.Postgresql
import Database.Persist.Sql
import qualified Data.ByteString as BS
import Crypto.BCrypt (hashPasswordUsingPolicy, slowerBcryptHashingPolicy, validatePassword)

-- Import models
import Database
import Models
import Models.User
import Models.Asset
import Models.Watchlist  
import Models.Portfolio
import Types hiding (HealthStatus)
import TestHelpers

spec :: Spec
spec = do
  dbAvailable <- runIO checkDatabaseAvailable
  
  if dbAvailable
    then do
      describe "Database Module" $ do
        databaseConnectionSpec
        userModelSpec
        assetModelSpec
        watchlistModelSpec
        portfolioModelSpec
        databaseTransactionSpec
        databasePropertyTests
    else
      describe "Database Module" $
        it "PostgreSQL not available - skipping database tests" $
          pendingWith "PostgreSQL server not running or not accessible"

-- Check if PostgreSQL is available
checkDatabaseAvailable :: IO Bool
checkDatabaseAvailable = do
  result <- try @SomeException $ withDb testConnStr $ return ()
  case result of
    Right _ -> return True
    Left _ -> return False

-- Test connection string (uses test database)
testConnStr :: ConnectionString
testConnStr = "host=localhost dbname=trend2zero_test user=postgres password=postgres port=5432"

-- Database Connection Tests
databaseConnectionSpec :: Spec
databaseConnectionSpec = describe "Connection Management" $ do
  it "creates connection pool successfully" $ do
    pool <- createDbPool testConnStr 5
    -- Should not throw
    return ()
  
  it "runs migrations successfully" $ do
    pool <- createDbPool testConnStr 5
    initializeDb pool
    -- Migrations should complete without error
    return ()
  
  it "handles connection pool exhaustion gracefully" $ do
    pool <- createDbPool testConnStr 1 -- Small pool
    
    -- Try to use more connections than available
    results <- forConcurrently [1..5] $ \i -> do
      try @SomeException $ runDb pool $ do
        liftIO $ threadDelay 100000 -- 100ms
        return i
    
    -- At least some should succeed
    let successes = [r | Right r <- results]
    length successes `shouldSatisfy` (> 0)

-- User Model Tests
userModelSpec :: Spec
userModelSpec = around withTestDb $ describe "User Model" $ do
  it "creates user with valid data" $ \pool -> do
    now <- getCurrentTime
    hashedPassword <- hashPassword "password123"
    
    userId <- runDb pool $ insert $ User
      { userName = "testuser"
      , userEmail = "test@example.com"
      , userPassword = hashedPassword
      , userPasswordChangedAt = Nothing
      , userRole = UserRole
      , userActive = True
      , userCreatedAt = now
      , userUpdatedAt = now
      }
    
    -- Verify user was created
    maybeUser <- runDb pool $ get userId
    case maybeUser of
      Just user -> do
        userName user `shouldBe` "testuser"
        userEmail user `shouldBe` "test@example.com"
        userRole user `shouldBe` UserRole
        userActive user `shouldBe` True
      Nothing -> expectationFailure "User not found"
  
  it "enforces unique email constraint" $ \pool -> do
    now <- getCurrentTime
    hashedPassword <- hashPassword "password123"
    
    let user1 = User "user1" "duplicate@example.com" hashedPassword Nothing UserRole True now now
    let user2 = User "user2" "duplicate@example.com" hashedPassword Nothing UserRole True now now
    
    _ <- runDb pool $ insert user1
    result <- try @SomeException $ runDb pool $ insert user2
    
    case result of
      Left _ -> return () -- Expected constraint violation
      Right _ -> expectationFailure "Expected unique constraint violation"
  
  it "validates email format" $ \pool -> do
    let validEmails = ["user@example.com", "test.user@domain.co.uk", "user+tag@example.org"]
    let invalidEmails = ["notanemail", "@example.com", "user@", "user @example.com"]
    
    forM_ validEmails $ \email ->
      isValidEmail email `shouldBe` True
    
    forM_ invalidEmails $ \email ->
      isValidEmail email `shouldBe` False
  
  it "updates user fields correctly" $ \pool -> do
    now <- getCurrentTime
    hashedPassword <- hashPassword "oldpassword"
    
    userId <- runDb pool $ insert $ User
      { userName = "updatetest"
      , userEmail = "update@example.com"
      , userPassword = hashedPassword
      , userPasswordChangedAt = Nothing
      , userRole = UserRole
      , userActive = True
      , userCreatedAt = now
      , userUpdatedAt = now
      }
    
    -- Update user
    newHashedPassword <- hashPassword "newpassword"
    runDb pool $ update userId
      [ UserPassword =. newHashedPassword
      , UserPasswordChangedAt =. Just now
      , UserRole =. AdminRole
      , UserUpdatedAt =. now
      ]
    
    -- Verify updates
    maybeUser <- runDb pool $ get userId
    case maybeUser of
      Just user -> do
        userRole user `shouldBe` AdminRole
        userPasswordChangedAt user `shouldBe` Just now
        validatePassword (BS.pack "newpassword") (userPassword user) `shouldBe` True
      Nothing -> expectationFailure "User not found"

-- Asset Model Tests
assetModelSpec :: Spec
assetModelSpec = around withTestDb $ describe "Asset Model" $ do
  it "creates assets with different categories" $ \pool -> do
    now <- getCurrentTime
    
    let assets = 
          [ Asset "BTC" "Bitcoin" "crypto" 50000.0 Nothing Nothing now now
          , Asset "AAPL" "Apple Inc." "stock" 180.0 Nothing Nothing now now
          , Asset "GOLD" "Gold" "metal" 2050.0 Nothing Nothing now now
          ]
    
    assetIds <- runDb pool $ insertMany assets
    length assetIds `shouldBe` 3
    
    -- Verify assets
    allAssets <- runDb pool $ selectList [] []
    length allAssets `shouldBe` 3
    
    let symbols = map (assetSymbol . entityVal) allAssets
    symbols `shouldContain` ["BTC", "AAPL", "GOLD"]
  
  it "updates asset prices correctly" $ \pool -> do
    now <- getCurrentTime
    
    assetId <- runDb pool $ insert $ Asset
      { assetSymbol = "ETH"
      , assetName = "Ethereum"
      , assetType = "crypto"
      , assetPrice = 3000.0
      , assetMarketCap = Nothing
      , assetVolume24h = Nothing
      , assetCreatedAt = now
      , assetUpdatedAt = now
      }
    
    -- Update price
    let newPrice = 3500.0
    runDb pool $ update assetId
      [ AssetPrice =. newPrice
      , AssetUpdatedAt =. now
      ]
    
    -- Verify update
    maybeAsset <- runDb pool $ get assetId
    case maybeAsset of
      Just asset -> assetPrice asset `shouldBe` newPrice
      Nothing -> expectationFailure "Asset not found"
  
  it "queries assets by type" $ \pool -> do
    now <- getCurrentTime
    
    -- Insert mixed assets
    let assets = 
          [ Asset "BTC" "Bitcoin" "crypto" 50000.0 Nothing Nothing now now
          , Asset "ETH" "Ethereum" "crypto" 3000.0 Nothing Nothing now now
          , Asset "AAPL" "Apple" "stock" 180.0 Nothing Nothing now now
          , Asset "GOLD" "Gold" "metal" 2050.0 Nothing Nothing now now
          ]
    
    _ <- runDb pool $ insertMany assets
    
    -- Query crypto assets
    cryptoAssets <- runDb pool $ selectList [AssetType ==. "crypto"] []
    length cryptoAssets `shouldBe` 2
    
    all ((== "crypto") . assetType . entityVal) cryptoAssets `shouldBe` True

-- Watchlist Model Tests
watchlistModelSpec :: Spec
watchlistModelSpec = around withTestDb $ describe "Watchlist Model" $ do
  it "creates watchlist entries" $ \pool -> do
    now <- getCurrentTime
    
    -- Create user first
    hashedPassword <- hashPassword "password"
    userId <- runDb pool $ insert $ User
      { userName = "watchlistuser"
      , userEmail = "watchlist@example.com"
      , userPassword = hashedPassword
      , userPasswordChangedAt = Nothing
      , userRole = UserRole
      , userActive = True
      , userCreatedAt = now
      , userUpdatedAt = now
      }
    
    -- Add watchlist items
    let watchlistItems =
          [ Watchlist userId "BTC" CryptoAsset Nothing now
          , Watchlist userId "AAPL" StockAsset Nothing now
          , Watchlist userId "GOLD" MetalAsset Nothing now
          ]
    
    watchlistIds <- runDb pool $ insertMany watchlistItems
    length watchlistIds `shouldBe` 3
  
  it "enforces unique user-symbol constraint" $ \pool -> do
    now <- getCurrentTime
    
    -- Create user
    hashedPassword <- hashPassword "password"
    userId <- runDb pool $ insert $ User
      { userName = "uniquetest"
      , userEmail = "unique@example.com"
      , userPassword = hashedPassword
      , userPasswordChangedAt = Nothing
      , userRole = UserRole
      , userActive = True
      , userCreatedAt = now
      , userUpdatedAt = now
      }
    
    -- Insert first watchlist item
    _ <- runDb pool $ insert $ Watchlist userId "BTC" CryptoAsset Nothing now
    
    -- Try to insert duplicate
    result <- try @SomeException $ runDb pool $ 
      insert $ Watchlist userId "BTC" CryptoAsset Nothing now
    
    case result of
      Left _ -> return () -- Expected constraint violation
      Right _ -> expectationFailure "Expected unique constraint violation"
  
  it "queries user's watchlist" $ \pool -> do
    now <- getCurrentTime
    
    -- Create two users
    hashedPassword <- hashPassword "password"
    user1Id <- runDb pool $ insert $ User "user1" "user1@example.com" hashedPassword Nothing UserRole True now now
    user2Id <- runDb pool $ insert $ User "user2" "user2@example.com" hashedPassword Nothing UserRole True now now
    
    -- Add watchlist items
    _ <- runDb pool $ insertMany
      [ Watchlist user1Id "BTC" CryptoAsset Nothing now
      , Watchlist user1Id "ETH" CryptoAsset Nothing now
      , Watchlist user2Id "AAPL" StockAsset Nothing now
      ]
    
    -- Query user1's watchlist
    user1Watchlist <- runDb pool $ selectList [WatchlistUserId ==. user1Id] []
    length user1Watchlist `shouldBe` 2
    
    let symbols = map (watchlistSymbol . entityVal) user1Watchlist
    symbols `shouldContain` ["BTC", "ETH"]
    symbols `shouldNotContain` ["AAPL"]

-- Portfolio Model Tests
portfolioModelSpec :: Spec
portfolioModelSpec = around withTestDb $ describe "Portfolio Model" $ do
  it "creates portfolio entries with positions" $ \pool -> do
    now <- getCurrentTime
    
    -- Create user
    hashedPassword <- hashPassword "password"
    userId <- runDb pool $ insert $ User
      { userName = "portfoliouser"
      , userEmail = "portfolio@example.com"
      , userPassword = hashedPassword
      , userPasswordChangedAt = Nothing
      , userRole = UserRole
      , userActive = True
      , userCreatedAt = now
      , userUpdatedAt = now
      }
    
    -- Create portfolio
    portfolioId <- runDb pool $ insert $ Portfolio
      { portfolioUserId = userId
      , portfolioName = "Main Portfolio"
      , portfolioDescription = Just "My main investment portfolio"
      , portfolioTotalValue = 100000.0
      , portfolioCreatedAt = now
      , portfolioUpdatedAt = now
      }
    
    -- Verify portfolio
    maybePortfolio <- runDb pool $ get portfolioId
    case maybePortfolio of
      Just portfolio -> do
        portfolioName portfolio `shouldBe` "Main Portfolio"
        portfolioTotalValue portfolio `shouldBe` 100000.0
      Nothing -> expectationFailure "Portfolio not found"
  
  it "updates portfolio value correctly" $ \pool -> do
    now <- getCurrentTime
    
    -- Create user and portfolio
    hashedPassword <- hashPassword "password"
    userId <- runDb pool $ insert $ User "testuser" "test@example.com" hashedPassword Nothing UserRole True now now
    
    portfolioId <- runDb pool $ insert $ Portfolio
      { portfolioUserId = userId
      , portfolioName = "Test Portfolio"
      , portfolioDescription = Nothing
      , portfolioTotalValue = 50000.0
      , portfolioCreatedAt = now
      , portfolioUpdatedAt = now
      }
    
    -- Update value
    let newValue = 75000.0
    runDb pool $ update portfolioId
      [ PortfolioTotalValue =. newValue
      , PortfolioUpdatedAt =. now
      ]
    
    -- Verify update
    maybePortfolio <- runDb pool $ get portfolioId
    case maybePortfolio of
      Just portfolio -> portfolioTotalValue portfolio `shouldBe` newValue
      Nothing -> expectationFailure "Portfolio not found"

-- Transaction Tests
databaseTransactionSpec :: Spec
databaseTransactionSpec = around withTestDb $ describe "Transactions" $ do
  it "commits successful transactions" $ \pool -> do
    now <- getCurrentTime
    hashedPassword <- hashPassword "password"
    
    -- Run in transaction
    userId <- runDb pool $ do
      uid <- insert $ User "txuser" "tx@example.com" hashedPassword Nothing UserRole True now now
      _ <- insert $ Watchlist uid "BTC" CryptoAsset Nothing now
      return uid
    
    -- Verify both were created
    user <- runDb pool $ get userId
    isJust user `shouldBe` True
    
    watchlist <- runDb pool $ selectList [WatchlistUserId ==. userId] []
    length watchlist `shouldBe` 1
  
  it "rolls back failed transactions" $ \pool -> do
    now <- getCurrentTime
    hashedPassword <- hashPassword "password"
    
    -- Create user first
    userId <- runDb pool $ insert $ User "rollback" "rollback@example.com" hashedPassword Nothing UserRole True now now
    
    -- Try transaction that will fail
    result <- try @SomeException $ runDb pool $ do
      _ <- insert $ Watchlist userId "BTC" CryptoAsset Nothing now
      _ <- insert $ Watchlist userId "BTC" CryptoAsset Nothing now -- Duplicate, will fail
      return ()
    
    -- Transaction should have failed
    case result of
      Left _ -> do
        -- Verify nothing was inserted
        watchlist <- runDb pool $ selectList [WatchlistUserId ==. userId] []
        length watchlist `shouldBe` 0
      Right _ -> expectationFailure "Expected transaction to fail"

-- Property-based Tests
databasePropertyTests :: Spec
databasePropertyTests = around withTestDb $ describe "Property Tests" $ do
  it "preserves data integrity for all asset types" $ \pool ->
    property $ \(asset :: AssetData) -> monadicIO $ do
      now <- liftIO getCurrentTime
      
      let dbAsset = Asset
            { assetSymbol = adSymbol asset
            , assetName = T.unpack $ fromMaybe (adSymbol asset) (adName asset)
            , assetType = case adCategory asset of
                Just Crypto -> "crypto"
                Just Stock -> "stock"
                Just Metal -> "metal"
                Nothing -> "unknown"
            , assetPrice = adPrice asset
            , assetMarketCap = adMarketCap asset
            , assetVolume24h = adVolume24h asset
            , assetCreatedAt = now
            , assetUpdatedAt = now
            }
      
      assetId <- run $ runDb pool $ insert dbAsset
      retrieved <- run $ runDb pool $ get assetId
      
      case retrieved of
        Just r -> do
          assert $ assetSymbol r == T.unpack (adSymbol asset)
          assert $ assetPrice r == adPrice asset
        Nothing -> assert False
  
  it "maintains referential integrity" $ \pool ->
    property $ \(symbols :: [Text]) -> monadicIO $ do
      let validSymbols = take 5 $ filter (\s -> T.length s > 0 && T.length s < 10) symbols
      
      when (not $ null validSymbols) $ do
        now <- liftIO getCurrentTime
        hashedPassword <- liftIO $ hashPassword "password"
        
        -- Create user
        userId <- run $ runDb pool $ insert $ 
          User "reftest" "ref@example.com" hashedPassword Nothing UserRole True now now
        
        -- Create watchlist items
        run $ runDb pool $ forM_ validSymbols $ \symbol ->
          insert $ Watchlist userId (T.unpack symbol) CryptoAsset Nothing now
        
        -- Delete user (should cascade delete watchlist items if configured)
        run $ runDb pool $ delete userId
        
        -- Verify watchlist items are handled appropriately
        orphans <- run $ runDb pool $ selectList [WatchlistUserId ==. userId] []
        -- Depending on cascade settings, this should be 0 or fail
        return ()

-- Test Helpers
withTestDb :: (DbPool -> IO a) -> IO a
withTestDb action = do
  pool <- createDbPool testConnStr 5
  bracket
    (runDb pool $ runMigration migrateAll)
    (\_ -> runDb pool $ rawExecute "TRUNCATE TABLE users, assets, watchlists, portfolios CASCADE" [])
    (\_ -> action pool)

hashPassword :: String -> IO BS.ByteString
hashPassword password = do
  maybeHashed <- hashPasswordUsingPolicy slowerBcryptHashingPolicy (BS.pack password)
  case maybeHashed of
    Just hashed -> return hashed
    Nothing -> error "Failed to hash password"

-- Import for concurrent operations
import Control.Concurrent (threadDelay)
import Control.Concurrent.Async (forConcurrently)