{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TypeApplications #-}

module Auth.JWT 
  ( generateToken
  , verifyToken
  , JWTPayload(..)
  , AppJWTError(..)
  , TokenConfig(..)
  , defaultTokenConfig
  , extractBearerToken
  ) where

import Control.Monad (when)
import Control.Monad.Except
import Control.Monad.IO.Class (liftIO)
import Crypto.JWT hiding (JWTError)
import Crypto.JOSE.Error (Error)
import Crypto.JOSE.JWS (JWS, JWSHeader)
import Data.Aeson
import Data.ByteString.Lazy (ByteString)
import qualified Data.ByteString.Lazy as LBS
import qualified Data.ByteString.Lazy.Char8 as L8
import Data.Text (Text)
import qualified Data.Text as T
import Data.Text.Encoding (encodeUtf8, decodeUtf8)
import Data.Time
import Data.Time.Clock.POSIX (utcTimeToPOSIXSeconds, posixSecondsToUTCTime) 
import Data.UUID (UUID)
import qualified Data.UUID as UUID
import GHC.Generics (Generic)
import qualified Data.Aeson.KeyMap as KM
import Data.Aeson.Key (fromText)
import Data.Functor.Identity (Identity(..))

-- | JWT payload structure
data JWTPayload = JWTPayload
  { userId :: UUID
  , userEmail :: Text
  , issuedAt :: UTCTime
  , expiresAt :: UTCTime
  } deriving (Show, Eq, Generic)

instance FromJSON JWTPayload
instance ToJSON JWTPayload

-- | JWT errors
data AppJWTError
  = InvalidToken Text
  | TokenExpired
  | MissingSecret
  | SignatureVerificationFailed
  | InvalidClaims Text
  deriving (Show, Eq)

-- | Configuration for JWT tokens
data TokenConfig = TokenConfig
  { jwtSecret :: ByteString
  , jwtExpiresIn :: Int  -- Days
  , jwtIssuer :: Text
  , jwtAudience :: Text
  } deriving (Show)

-- | Default token configuration
defaultTokenConfig :: ByteString -> TokenConfig
defaultTokenConfig secret = TokenConfig
  { jwtSecret = secret
  , jwtExpiresIn = 90  -- 90 days default
  , jwtIssuer = "trend2zero-auth"
  , jwtAudience = "trend2zero-api"
  }

-- | Generate a JWT token for a user
generateToken :: TokenConfig -> UUID -> Text -> IO (Either AppJWTError Text)
generateToken TokenConfig{..} uid email = runExceptT $ do
  currentTime <- liftIO getCurrentTime
  let expTime = addUTCTime (fromIntegral jwtExpiresIn * nominalDay) currentTime
      
  -- Create JWK for signing
  let jwk = fromOctets $ LBS.toStrict jwtSecret
      
  -- Create claims set with custom approach
  let claimsValue = object
        [ "iss" .= jwtIssuer
        , "aud" .= jwtAudience
        , "iat" .= (floor (utcTimeToPOSIXSeconds currentTime) :: Integer)
        , "exp" .= (floor (utcTimeToPOSIXSeconds expTime) :: Integer)
        , "sub" .= UUID.toString uid
        , "userId" .= UUID.toString uid
        , "email" .= email
        ]
  
  -- Create a signed JWT
  result <- liftIO $ runJOSE @Error $ do
    alg <- bestJWSAlg jwk
    let header = newJWSHeader ((), alg)
    signJWS (encode claimsValue) (Identity (header, jwk))
  
  case result of
    Left err -> throwError $ InvalidToken $ T.pack $ show err
    Right jwt -> return $ decodeUtf8 $ LBS.toStrict $ encodeCompact jwt

-- | Verify and decode a JWT token
verifyToken :: TokenConfig -> Text -> IO (Either AppJWTError JWTPayload)
verifyToken TokenConfig{..} token = runExceptT $ do
  currentTime <- liftIO getCurrentTime
  
  -- Parse the JWT
  let tokenBS = L8.fromStrict $ encodeUtf8 token
  jwt <- case decodeCompact @(JWS Identity () JWSHeader) @Error tokenBS of
    Left err -> throwError $ InvalidToken $ T.pack $ show err
    Right jwt -> return jwt
  
  -- Create JWK for verification
  let jwk = fromOctets $ LBS.toStrict jwtSecret
  
  -- Verify the JWT and extract payload
  result <- liftIO $ runJOSE @Error $ do
    verifyJWS' jwk jwt
  
  case result of
    Left err -> throwError SignatureVerificationFailed
    Right payload -> do
      -- Parse the payload
      case decode payload of
        Nothing -> throwError $ InvalidClaims "Failed to decode payload"
        Just (Object claims) -> do
          -- Extract fields
          let getField :: FromJSON a => Text -> Maybe a
              getField field = KM.lookup (fromText field) claims >>= \v -> case fromJSON v of
                Success x -> Just x
                _ -> Nothing
          
          case (getField "exp", getField "userId", getField "email", getField "iat") of
            (Just (expTime :: Integer), Just (userIdStr :: Text), Just email, Just (iatTime :: Integer)) -> do
              let expUtc = posixSecondsToUTCTime $ fromIntegral expTime
              let iatUtc = posixSecondsToUTCTime $ fromIntegral iatTime
              
              -- Check expiration
              when (currentTime > expUtc) $ throwError TokenExpired
              
              -- Parse UUID
              case UUID.fromString (T.unpack userIdStr) of
                Just uid -> return $ JWTPayload
                  { userId = uid
                  , userEmail = email
                  , issuedAt = iatUtc
                  , expiresAt = expUtc
                  }
                Nothing -> throwError $ InvalidClaims "Invalid user ID format"
            _ -> throwError $ InvalidClaims "Missing required claims"
        _ -> throwError $ InvalidClaims "Invalid claims format"

-- | Extract token from Authorization header
extractBearerToken :: Text -> Maybe Text
extractBearerToken authHeader =
  case T.words authHeader of
    ["Bearer", token] -> Just token
    _ -> Nothing