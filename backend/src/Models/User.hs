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

module Models.User where

import Control.Monad.IO.Class (MonadIO, liftIO)
import Crypto.BCrypt (hashPasswordUsingPolicy, slowerBcryptHashingPolicy, validatePassword)
import Data.ByteString (ByteString)
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE
import Data.Time (UTCTime, diffUTCTime, getCurrentTime)
import Database.Persist
import Database.Persist.Sql
import Database.Persist.TH
import Text.Regex.TDFA ((=~))

-- User Role Enumeration
data UserRole = RegularUser | AdminRole
  deriving stock (Show, Read, Eq, Ord)

derivePersistField "UserRole"

-- Define the User entity using Persistent Template Haskell
share [mkPersist sqlSettings, mkMigrate "migrateUser"] [persistLowerCase|
User
    name Text
    email Text
    password ByteString
    passwordChangedAt UTCTime Maybe
    role UserRole default='RegularUser'
    active Bool default=True
    createdAt UTCTime default=CURRENT_TIME
    updatedAt UTCTime default=CURRENT_TIME
    UniqueUserEmail email
    deriving Eq Show
|]

-- Email validation helper
isValidEmail :: Text -> Bool
isValidEmail email = T.unpack email =~ ("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" :: String)

-- | Hash a password using bcrypt
hashPassword :: Text -> IO (Maybe ByteString)
hashPassword plainText = do
    let policy = slowerBcryptHashingPolicy
    hashPasswordUsingPolicy policy (TE.encodeUtf8 plainText)

-- | Verify a password against a hash
checkPassword :: Text -> ByteString -> Bool
checkPassword candidatePassword hashedPassword =
    validatePassword hashedPassword (TE.encodeUtf8 candidatePassword)

-- | Check if password was changed after a given timestamp (for JWT validation)
changedPasswordAfter :: User -> UTCTime -> Bool
changedPasswordAfter user jwtTimestamp =
    case userPasswordChangedAt user of
        Nothing -> False
        Just changedAt -> changedAt > jwtTimestamp

-- | Create a new user with hashed password
createUser :: MonadIO m => Text -> Text -> Text -> UserRole -> SqlPersistT m (Maybe (Key User))
createUser name email password role = do
    if not (isValidEmail email)
        then return Nothing
        else do
            hashedPwd <- liftIO $ hashPassword password
            case hashedPwd of
                Nothing -> return Nothing
                Just hashed -> do
                    currentTime <- liftIO getCurrentTime
                    maybeUserId <- insertUnique $ User
                        { userName = name
                        , userEmail = email
                        , userPassword = hashed
                        , userPasswordChangedAt = Nothing
                        , userRole = role
                        , userActive = True
                        , userCreatedAt = currentTime
                        , userUpdatedAt = currentTime
                        }
                    return maybeUserId

-- | Update user password
updateUserPassword :: MonadIO m => Key User -> Text -> SqlPersistT m Bool
updateUserPassword userId newPassword = do
    hashedPwd <- liftIO $ hashPassword newPassword
    case hashedPwd of
        Nothing -> return False
        Just hashed -> do
            currentTime <- liftIO getCurrentTime
            update userId
                [ UserPassword =. hashed
                , UserPasswordChangedAt =. Just currentTime
                , UserUpdatedAt =. currentTime
                ]
            return True

-- | Find user by email (active users only)
findByEmail :: MonadIO m => Text -> SqlPersistT m (Maybe (Entity User))
findByEmail email = 
    selectFirst [UserEmail ==. email, UserActive ==. True] []

-- | Find all active users
findActiveUsers :: MonadIO m => SqlPersistT m [Entity User]
findActiveUsers = 
    selectList [UserActive ==. True] [Asc UserCreatedAt]

-- | Soft delete a user (set active to False)
deactivateUser :: MonadIO m => Key User -> SqlPersistT m ()
deactivateUser userId = do
    currentTime <- liftIO getCurrentTime
    update userId
        [ UserActive =. False
        , UserUpdatedAt =. currentTime
        ]

-- | Reactivate a user
reactivateUser :: MonadIO m => Key User -> SqlPersistT m ()
reactivateUser userId = do
    currentTime <- liftIO getCurrentTime
    update userId
        [ UserActive =. True
        , UserUpdatedAt =. currentTime
        ]

-- Note: Watchlist functionality is moved to the Watchlist entity
-- to maintain proper relational structure in SQL databases