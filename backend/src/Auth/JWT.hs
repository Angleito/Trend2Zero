{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}

module Auth.JWT 
  ( generateToken
  , verifyToken
  , JWTPayload(..)
  , JWTError(..)
  , TokenConfig(..)
  , defaultTokenConfig
  ) where

import Control.Monad.Except
import Control.Monad.IO.Class (liftIO)
import Crypto.JWT
import Data.Aeson (FromJSON, ToJSON)
import Data.ByteString.Lazy (ByteString)
import Data.ByteString.Lazy.Char8 as L8
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (UTCTime, getCurrentTime, addUTCTime, nominalDay)
import Data.UUID (UUID)
import qualified Data.UUID as UUID
import GHC.Generics (Generic)

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
data JWTError
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
generateToken :: TokenConfig -> UUID -> Text -> IO (Either JWTError Text)
generateToken TokenConfig{..} uid email = runExceptT $ do
  currentTime <- liftIO getCurrentTime
  let expTime = addUTCTime (fromIntegral jwtExpiresIn * nominalDay) currentTime
      
  -- Create claims set
  let claimsSet = emptyClaimsSet
        & claimIss ?~ fromString (T.unpack jwtIssuer)
        & claimAud ?~ Audience [fromString (T.unpack jwtAudience)]
        & claimIat ?~ NumericDate currentTime
        & claimExp ?~ NumericDate expTime
        & claimSub ?~ fromString (UUID.toString uid)
        & unregisteredClaims .~ 
            [ ("email", toJSON email)
            , ("userId", toJSON $ UUID.toString uid)
            ]

  -- Create JWK for signing
  let jwk = fromOctets jwtSecret
      jwtAlg = HS256
  
  -- Sign the token
  signedJWT <- liftIO $ runJOSE $ do
    alg <- bestJWSAlg jwk
    signJWT jwk (newJWSHeader ((), alg)) claimsSet
  
  case signedJWT of
    Left err -> throwError $ InvalidToken $ T.pack $ show err
    Right jwt -> return $ T.pack $ L8.unpack $ encodeCompact jwt

-- | Verify and decode a JWT token
verifyToken :: TokenConfig -> Text -> IO (Either JWTError JWTPayload)
verifyToken TokenConfig{..} token = runExceptT $ do
  currentTime <- liftIO getCurrentTime
  
  -- Parse the JWT
  let tokenBS = L8.pack $ T.unpack token
  jwt <- case decodeCompact tokenBS of
    Left err -> throwError $ InvalidToken $ T.pack $ show err
    Right jwt -> return jwt
  
  -- Create JWK for verification
  let jwk = fromOctets jwtSecret
      config = defaultJWTValidationSettings (== jwtAudience)
  
  -- Verify the token
  verifiedJWT <- liftIO $ runJOSE $ do
    verifyJWT config jwk jwt
  
  case verifiedJWT of
    Left err -> throwError $ SignatureVerificationFailed
    Right claimsSet -> do
      -- Extract claims
      case (claimSub claimsSet, claimExp claimsSet, claimIat claimsSet) of
        (Just subj, Just (NumericDate expTime), Just (NumericDate iatTime)) -> do
          -- Check expiration
          when (currentTime > expTime) $ throwError TokenExpired
          
          -- Extract custom claims
          let claims = unregisteredClaims claimsSet
          case (lookup "email" claims, lookup "userId" claims) of
            (Just emailVal, Just userIdVal) -> do
              case (fromJSON emailVal, fromJSON userIdVal) of
                (Success email, Success userIdStr) -> do
                  case UUID.fromString userIdStr of
                    Just uid -> return $ JWTPayload
                      { userId = uid
                      , userEmail = email
                      , issuedAt = iatTime
                      , expiresAt = expTime
                      }
                    Nothing -> throwError $ InvalidClaims "Invalid user ID format"
                _ -> throwError $ InvalidClaims "Failed to parse claims"
            _ -> throwError $ InvalidClaims "Missing required claims"
        _ -> throwError $ InvalidClaims "Missing standard claims"

-- | Extract token from Authorization header
extractBearerToken :: Text -> Maybe Text
extractBearerToken authHeader =
  case T.words authHeader of
    ["Bearer", token] -> Just token
    _ -> Nothing