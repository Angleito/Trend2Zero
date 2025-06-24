{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module Error.AppError where

import Data.Aeson (FromJSON(..), ToJSON(..), object, withObject, (.:), (.:?), (.=), (.!=))
import Data.Text (Text)
import GHC.Generics (Generic)
import Network.HTTP.Types.Status

-- | Core error type representing application errors
data AppError = AppError
  { errorMessage :: Text
  , errorStatusCode :: Int
  , errorStatus :: Text
  , errorIsOperational :: Bool
  , errorDetails :: Maybe ErrorDetails
  } deriving (Show, Eq, Generic)

-- | Additional error details
data ErrorDetails = ErrorDetails
  { detailsField :: Maybe Text
  , detailsValue :: Maybe Text
  , detailsValidationErrors :: Maybe [ValidationError]
  , detailsStackTrace :: Maybe Text
  , detailsContext :: Maybe Text
  } deriving (Show, Eq, Generic)

-- | Validation error for field-specific errors
data ValidationError = ValidationError
  { validationField :: Text
  , validationMessage :: Text
  , validationCode :: Maybe Text
  } deriving (Show, Eq, Generic)

-- | Error types for pattern matching
data ErrorType
  = BadRequestError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | ConflictError
  | ValidationErrorType
  | InternalError
  | ServiceUnavailableError
  deriving (Show, Eq)

-- JSON instances
instance ToJSON AppError where
  toJSON AppError{..} = object $ filter notNull
    [ "status" .= errorStatus
    , "statusCode" .= errorStatusCode
    , "message" .= errorMessage
    , "details" .= errorDetails
    ]
    where
      notNull (_, v) = v /= toJSON (Nothing :: Maybe Text)

instance FromJSON AppError where
  parseJSON = withObject "AppError" $ \v -> AppError
    <$> v .: "message"
    <*> v .: "statusCode"
    <*> v .: "status"
    <*> v .:? "isOperational" .!= True
    <*> v .:? "details"

instance ToJSON ErrorDetails where
  toJSON ErrorDetails{..} = object $ filter notNull
    [ "field" .= detailsField
    , "value" .= detailsValue
    , "validationErrors" .= detailsValidationErrors
    , "stackTrace" .= detailsStackTrace
    , "context" .= detailsContext
    ]
    where
      notNull (_, v) = v /= toJSON (Nothing :: Maybe Text)

instance FromJSON ErrorDetails where
  parseJSON = withObject "ErrorDetails" $ \v -> ErrorDetails
    <$> v .:? "field"
    <*> v .:? "value"
    <*> v .:? "validationErrors"
    <*> v .:? "stackTrace"
    <*> v .:? "context"

instance ToJSON ValidationError
instance FromJSON ValidationError

-- | Smart constructors for common error types
mkBadRequest :: Text -> Maybe ErrorDetails -> AppError
mkBadRequest msg details = AppError
  { errorMessage = msg
  , errorStatusCode = 400
  , errorStatus = "fail"
  , errorIsOperational = True
  , errorDetails = details
  }

mkUnauthorized :: Text -> Maybe ErrorDetails -> AppError
mkUnauthorized msg details = AppError
  { errorMessage = msg
  , errorStatusCode = 401
  , errorStatus = "fail"
  , errorIsOperational = True
  , errorDetails = details
  }

mkForbidden :: Text -> Maybe ErrorDetails -> AppError
mkForbidden msg details = AppError
  { errorMessage = msg
  , errorStatusCode = 403
  , errorStatus = "fail"
  , errorIsOperational = True
  , errorDetails = details
  }

mkNotFound :: Text -> Maybe ErrorDetails -> AppError
mkNotFound msg details = AppError
  { errorMessage = msg
  , errorStatusCode = 404
  , errorStatus = "fail"
  , errorIsOperational = True
  , errorDetails = details
  }

mkConflict :: Text -> Maybe ErrorDetails -> AppError
mkConflict msg details = AppError
  { errorMessage = msg
  , errorStatusCode = 409
  , errorStatus = "fail"
  , errorIsOperational = True
  , errorDetails = details
  }

mkValidationError :: Text -> [ValidationError] -> AppError
mkValidationError msg validationErrors = AppError
  { errorMessage = msg
  , errorStatusCode = 422
  , errorStatus = "fail"
  , errorIsOperational = True
  , errorDetails = Just $ ErrorDetails
      { detailsField = Nothing
      , detailsValue = Nothing
      , detailsValidationErrors = Just validationErrors
      , detailsStackTrace = Nothing
      , detailsContext = Nothing
      }
  }

mkInternalError :: Text -> Maybe ErrorDetails -> AppError
mkInternalError msg details = AppError
  { errorMessage = msg
  , errorStatusCode = 500
  , errorStatus = "error"
  , errorIsOperational = False
  , errorDetails = details
  }

mkServiceUnavailable :: Text -> Maybe ErrorDetails -> AppError
mkServiceUnavailable msg details = AppError
  { errorMessage = msg
  , errorStatusCode = 503
  , errorStatus = "error"
  , errorIsOperational = True
  , errorDetails = details
  }

-- | Create error with context
withContext :: AppError -> Text -> AppError
withContext err ctx = err
  { errorDetails = Just $ case errorDetails err of
      Nothing -> ErrorDetails Nothing Nothing Nothing Nothing (Just ctx)
      Just details -> details { detailsContext = Just ctx }
  }

-- | Create error with field information
withField :: AppError -> Text -> Text -> AppError
withField err field value = err
  { errorDetails = Just $ case errorDetails err of
      Nothing -> ErrorDetails (Just field) (Just value) Nothing Nothing Nothing
      Just details -> details { detailsField = Just field, detailsValue = Just value }
  }

-- | Convert error type to appropriate error
errorTypeToError :: ErrorType -> Text -> Maybe ErrorDetails -> AppError
errorTypeToError BadRequestError = mkBadRequest
errorTypeToError UnauthorizedError = mkUnauthorized
errorTypeToError ForbiddenError = mkForbidden
errorTypeToError NotFoundError = mkNotFound
errorTypeToError ConflictError = mkConflict
errorTypeToError ValidationErrorType = \msg _ -> mkValidationError msg []
errorTypeToError InternalError = mkInternalError
errorTypeToError ServiceUnavailableError = mkServiceUnavailable

-- | Get HTTP status from error
errorToStatus :: AppError -> Status
errorToStatus err = toEnum $ errorStatusCode err

-- | Check if error is client error (4xx)
isClientError :: AppError -> Bool
isClientError err = errorStatusCode err >= 400 && errorStatusCode err < 500

-- | Check if error is server error (5xx)
isServerError :: AppError -> Bool
isServerError err = errorStatusCode err >= 500

-- | Create a duplicate key error
mkDuplicateKeyError :: Text -> Text -> AppError
mkDuplicateKeyError field value = mkConflict msg (Just details)
  where
    msg = "Duplicate field value: " <> field <> ". Please use another value."
    details = ErrorDetails (Just field) (Just value) Nothing Nothing Nothing

-- | Create a JWT error
mkJWTError :: AppError
mkJWTError = mkUnauthorized "Invalid token. Please log in again." Nothing

-- | Create a JWT expired error
mkJWTExpiredError :: AppError
mkJWTExpiredError = mkUnauthorized "Your token has expired. Please log in again." Nothing

-- | Create a network error
mkNetworkError :: Text -> Text -> AppError
mkNetworkError service operation = mkServiceUnavailable msg (Just details)
  where
    msg = "Network error occurred while " <> operation <> " in " <> service
    details = ErrorDetails Nothing Nothing Nothing Nothing (Just $ "Service: " <> service <> ", Operation: " <> operation)

-- | Create an API error
mkAPIError :: Text -> Text -> Int -> AppError
mkAPIError service operation statusCode = AppError
  { errorMessage = "Failed to " <> operation <> " in " <> service
  , errorStatusCode = statusCode
  , errorStatus = if statusCode >= 400 && statusCode < 500 then "fail" else "error"
  , errorIsOperational = True
  , errorDetails = Just $ ErrorDetails Nothing Nothing Nothing Nothing (Just $ "Service: " <> service <> ", Operation: " <> operation)
  }