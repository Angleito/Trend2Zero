{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE FlexibleContexts #-}

module Handlers.Auth
  ( AuthAPI
  , authHandlers
  , AuthContext(..)
  , RegisterRequest(..)
  , LoginRequest(..)
  , UpdatePasswordRequest(..)
  , AuthResponse(..)
  , requireAuth
  ) where

import Auth.JWT hiding (userId, userEmail)
import qualified Auth.JWT as JWT
import Control.Monad.Except
import Control.Monad.IO.Class (liftIO)
-- import Control.Monad.Reader  -- Not used currently
import Crypto.BCrypt
import Data.Aeson
import Data.ByteString (ByteString)
import qualified Data.ByteString.Char8 as BS
import qualified Data.ByteString.Lazy.Char8 as LBS
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE
import Data.Time
import Data.UUID (UUID)
import qualified Data.UUID.V4 as UUID
import GHC.Generics (Generic)
import Network.HTTP.Types.Status
import Network.Wai
import Servant
import Servant.Auth.Server
import Servant.Server.Experimental.Auth

-- | Authentication API type
type AuthAPI = 
       "register" :> ReqBody '[JSON] RegisterRequest :> Post '[JSON] AuthResponse
  :<|> "login" :> ReqBody '[JSON] LoginRequest :> Post '[JSON] AuthResponse
  :<|> "logout" :> Header "Authorization" Text :> Post '[JSON] NoContent
  :<|> "me" :> Header' '[Required, Strict] "Authorization" Text :> Get '[JSON] UserInfo
  :<|> "update-password" :> Header' '[Required, Strict] "Authorization" Text 
                         :> ReqBody '[JSON] UpdatePasswordRequest 
                         :> Post '[JSON] AuthResponse

-- | Request types
data RegisterRequest = RegisterRequest
  { regName :: Text
  , regEmail :: Text
  , regPassword :: Text
  , regPasswordConfirm :: Text
  } deriving (Show, Generic)

instance FromJSON RegisterRequest where
  parseJSON = withObject "RegisterRequest" $ \v -> RegisterRequest
    <$> v .: "name"
    <*> v .: "email"
    <*> v .: "password"
    <*> v .: "passwordConfirm"

data LoginRequest = LoginRequest
  { loginEmail :: Text
  , loginPassword :: Text
  } deriving (Show, Generic)

instance FromJSON LoginRequest where
  parseJSON = withObject "LoginRequest" $ \v -> LoginRequest
    <$> v .: "email"
    <*> v .: "password"

data UpdatePasswordRequest = UpdatePasswordRequest
  { currentPassword :: Text
  , newPassword :: Text
  , newPasswordConfirm :: Text
  } deriving (Show, Generic)

instance FromJSON UpdatePasswordRequest where
  parseJSON = withObject "UpdatePasswordRequest" $ \v -> UpdatePasswordRequest
    <$> v .: "passwordCurrent"
    <*> v .: "password"
    <*> v .: "passwordConfirm"

-- | Response types
data AuthResponse = AuthResponse
  { authStatus :: Text
  , authToken :: Text
  , authUser :: UserInfo
  } deriving (Show, Generic)

instance ToJSON AuthResponse where
  toJSON AuthResponse{..} = object
    [ "status" .= authStatus
    , "token" .= authToken
    , "data" .= object ["user" .= authUser]
    ]

data UserInfo = UserInfo
  { userId :: UUID
  , userEmail :: Text
  , userName :: Maybe Text
  , userRole :: Text
  } deriving (Show, Generic)

instance FromJSON UserInfo
instance ToJSON UserInfo where
  toJSON UserInfo{..} = object
    [ "_id" .= userId
    , "email" .= userEmail
    , "name" .= userName
    , "role" .= userRole
    ]

-- | Authentication context
data AuthContext = AuthContext
  { authTokenConfig :: TokenConfig
  , authUserStore :: UserStore
  }

-- | Simple in-memory user store (replace with database in production)
data UserStore = UserStore
  { findUserByEmail :: Text -> IO (Maybe StoredUser)
  , createUser :: StoredUser -> IO (Either Text StoredUser)
  , updateUserPassword :: UUID -> Text -> IO (Either Text ())
  }

data StoredUser = StoredUser
  { storedUserId :: UUID
  , storedUserEmail :: Text
  , storedUserName :: Maybe Text
  , storedUserPasswordHash :: Text
  , storedUserRole :: Text
  , storedUserCreatedAt :: UTCTime
  , storedUserPasswordChangedAt :: Maybe UTCTime
  } deriving (Show, Generic)

-- | Authentication handlers
authHandlers :: AuthContext -> Server AuthAPI
authHandlers ctx = 
       registerHandler ctx
  :<|> loginHandler ctx
  :<|> logoutHandler
  :<|> getMeHandler ctx
  :<|> updatePasswordHandler ctx

-- | User registration handler
registerHandler :: AuthContext -> RegisterRequest -> Handler AuthResponse
registerHandler AuthContext{..} RegisterRequest{..} = do
  -- Validate password confirmation
  when (regPassword /= regPasswordConfirm) $
    throwError err400 { errBody = "Passwords do not match" }
  
  -- Validate password strength
  when (T.length regPassword < 8) $
    throwError err400 { errBody = "Password must be at least 8 characters" }
  
  -- Hash password
  let passwordBS = TE.encodeUtf8 regPassword
  hashedPassword <- liftIO $ hashPasswordUsingPolicy slowerBcryptHashingPolicy passwordBS
  case hashedPassword of
    Nothing -> throwError err500 { errBody = "Failed to hash password" }
    Just hash -> do
      -- Generate user ID
      uid <- liftIO UUID.nextRandom
      currentTime <- liftIO getCurrentTime
      
      -- Create user
      let newUser = StoredUser
            { storedUserId = uid
            , storedUserEmail = regEmail
            , storedUserName = Just regName
            , storedUserPasswordHash = TE.decodeUtf8 hash
            , storedUserRole = "user"
            , storedUserCreatedAt = currentTime
            , storedUserPasswordChangedAt = Nothing
            }
      
      result <- liftIO $ createUser authUserStore newUser
      case result of
        Left err -> throwError err400 { errBody = LBS.pack $ T.unpack err }
        Right user -> do
          -- Generate token
          tokenResult <- liftIO $ generateToken authTokenConfig uid regEmail
          case tokenResult of
            Left err -> throwError err500 { errBody = "Failed to generate token" }
            Right token -> return $ AuthResponse
              { authStatus = "success"
              , authToken = token
              , authUser = UserInfo
                  { userId = storedUserId user
                  , userEmail = storedUserEmail user
                  , userName = storedUserName user
                  , userRole = storedUserRole user
                  }
              }

-- | User login handler
loginHandler :: AuthContext -> LoginRequest -> Handler AuthResponse
loginHandler AuthContext{..} LoginRequest{..} = do
  -- Find user by email
  maybeUser <- liftIO $ findUserByEmail authUserStore loginEmail
  case maybeUser of
    Nothing -> throwError err401 { errBody = "Incorrect email or password" }
    Just user -> do
      -- Verify password
      let passwordBS = TE.encodeUtf8 loginPassword
          hashBS = TE.encodeUtf8 $ storedUserPasswordHash user
      if validatePassword hashBS passwordBS
        then do
          -- Generate token
          tokenResult <- liftIO $ generateToken authTokenConfig (storedUserId user) (storedUserEmail user)
          case tokenResult of
            Left err -> throwError err500 { errBody = "Failed to generate token" }
            Right token -> return $ AuthResponse
              { authStatus = "success"
              , authToken = token
              , authUser = UserInfo
                  { userId = storedUserId user
                  , userEmail = storedUserEmail user
                  , userName = storedUserName user
                  , userRole = storedUserRole user
                  }
              }
        else throwError err401 { errBody = "Incorrect email or password" }

-- | Logout handler
logoutHandler :: Maybe Text -> Handler NoContent
logoutHandler _ = return NoContent

-- | Get current user handler
getMeHandler :: AuthContext -> Text -> Handler UserInfo
getMeHandler ctx authHeader = do
  user <- requireAuth ctx authHeader
  return user

-- | Update password handler
updatePasswordHandler :: AuthContext -> Text -> UpdatePasswordRequest -> Handler AuthResponse
updatePasswordHandler ctx@AuthContext{..} authHeader UpdatePasswordRequest{..} = do
  -- Verify authentication
  userInfo <- requireAuth ctx authHeader
  
  -- Validate new password confirmation
  when (newPassword /= newPasswordConfirm) $
    throwError err400 { errBody = "New passwords do not match" }
  
  -- Validate new password strength
  when (T.length newPassword < 8) $
    throwError err400 { errBody = "Password must be at least 8 characters" }
  
  -- Find user
  maybeUser <- liftIO $ findUserByEmail authUserStore (userEmail userInfo)
  case maybeUser of
    Nothing -> throwError err404 { errBody = "User not found" }
    Just user -> do
      -- Verify current password
      let currentPassBS = TE.encodeUtf8 currentPassword
          hashBS = TE.encodeUtf8 $ storedUserPasswordHash user
      if validatePassword hashBS currentPassBS
        then do
          -- Hash new password
          let newPassBS = TE.encodeUtf8 newPassword
          hashedPassword <- liftIO $ hashPasswordUsingPolicy slowerBcryptHashingPolicy newPassBS
          case hashedPassword of
            Nothing -> throwError err500 { errBody = "Failed to hash password" }
            Just hash -> do
              -- Update password
              result <- liftIO $ updateUserPassword authUserStore (userId userInfo) (TE.decodeUtf8 hash)
              case result of
                Left err -> throwError err500 { errBody = LBS.pack $ T.unpack err }
                Right _ -> do
                  -- Generate new token
                  tokenResult <- liftIO $ generateToken authTokenConfig (userId userInfo) (userEmail userInfo)
                  case tokenResult of
                    Left err -> throwError err500 { errBody = "Failed to generate token" }
                    Right token -> return $ AuthResponse
                      { authStatus = "success"
                      , authToken = token
                      , authUser = userInfo
                      }
        else throwError err401 { errBody = "Current password is incorrect" }

-- | Authentication middleware
requireAuth :: AuthContext -> Text -> Handler UserInfo
requireAuth AuthContext{..} authHeader = do
  -- Extract token from header
  let maybeToken = JWT.extractBearerToken authHeader
  case maybeToken of
    Nothing -> throwError err401 { errBody = "Invalid authorization header" }
    Just token -> do
      -- Verify token
      result <- liftIO $ verifyToken authTokenConfig token
      case result of
        Left TokenExpired -> throwError err401 { errBody = "Token expired" }
        Left _ -> throwError err401 { errBody = "Invalid token" }
        Right payload -> do
          -- Find user
          maybeUser <- liftIO $ findUserByEmail authUserStore (JWT.userEmail payload)
          case maybeUser of
            Nothing -> throwError err401 { errBody = "User not found" }
            Just user -> do
              -- Check if password changed after token issued
              case storedUserPasswordChangedAt user of
                Just changedAt | changedAt > JWT.issuedAt payload ->
                  throwError err401 { errBody = "Password changed, please login again" }
                _ -> return UserInfo
                  { userId = storedUserId user
                  , userEmail = storedUserEmail user
                  , userName = storedUserName user
                  , userRole = storedUserRole user
                  }

-- extractBearerToken is now imported from Auth.JWT module