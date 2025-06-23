{-# LANGUAGE DataKinds #-}
{-# LANGUAGE FlexibleContexts #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TypeOperators #-}

module Error.Handler where

import Control.Exception (Exception, SomeException, catch, throwIO, try)
import Control.Monad.Except (ExceptT, MonadError, throwError)
import Control.Monad.IO.Class (MonadIO, liftIO)
import Data.Aeson (encode)
import Data.ByteString.Lazy (ByteString)
import Data.Text (Text)
import qualified Data.Text as T
import Network.HTTP.Types.Header (hContentType)
import Network.HTTP.Types.Status
import Network.Wai (Application, Response, responseLBS)
import Servant
import System.Log.FastLogger (LoggerSet, pushLogStrLn, toLogStr)

import Error.AppError
import qualified Config.Environment as Env

-- | Custom exception type for throwing AppErrors
newtype AppException = AppException AppError
  deriving (Show, Eq)

instance Exception AppException

-- | Type class for converting various errors to AppError
class ToAppError e where
  toAppError :: e -> AppError

-- | Instance for ServantErr (Servant's built-in errors)
instance ToAppError ServerError where
  toAppError err = AppError
    { errorMessage = T.pack $ errReasonPhrase err
    , errorStatusCode = errHTTPCode err
    , errorStatus = if errHTTPCode err >= 400 && errHTTPCode err < 500 then "fail" else "error"
    , errorIsOperational = True
    , errorDetails = Nothing
    }

-- | Instance for AppException
instance ToAppError AppException where
  toAppError (AppException err) = err

-- | Instance for generic exceptions
instance ToAppError SomeException where
  toAppError e = mkInternalError ("An unexpected error occurred: " <> T.pack (show e)) Nothing

-- | Monad transformer for handling errors in Servant handlers
type HandlerT = ExceptT AppError Handler

-- | Convert AppError to Servant's ServerError
appErrorToServerError :: AppError -> ServerError
appErrorToServerError AppError{..} =
  ServerError
    { errHTTPCode = errorStatusCode
    , errReasonPhrase = T.unpack errorMessage
    , errBody = encode $ toJSON AppError{..}
    , errHeaders = [(hContentType, "application/json")]
    }

-- | Throw an AppError in a Servant handler
throwAppError :: MonadError ServerError m => AppError -> m a
throwAppError = throwError . appErrorToServerError

-- | Catch and convert exceptions to AppError
catchToAppError :: (MonadIO m, ToAppError e, Exception e) => m a -> m (Either AppError a)
catchToAppError action = liftIO $ catch (Right <$> action) (return . Left . toAppError)

-- | Run an action that might throw an AppException
runWithAppError :: MonadIO m => IO a -> m (Either AppError a)
runWithAppError action = liftIO $ try action >>= \case
  Left (AppException err) -> return $ Left err
  Right result -> return $ Right result

-- | Global error handling middleware for WAI
errorHandlingMiddleware :: LoggerSet -> Env.Environment -> Application -> Application
errorHandlingMiddleware logger env app req respond = app req respond `catch` handleException
  where
    handleException :: SomeException -> IO Response
    handleException e = do
      let appErr = toAppError e
      logError logger appErr req
      respond $ errorToResponse env appErr

-- | Convert AppError to WAI Response
errorToResponse :: Env.Environment -> AppError -> Response
errorToResponse env err@AppError{..} = responseLBS
  (toEnum errorStatusCode)
  [(hContentType, "application/json")]
  (encode $ if env == Env.Development then fullError else safeError)
  where
    fullError = object
      [ "status" .= errorStatus
      , "statusCode" .= errorStatusCode
      , "message" .= errorMessage
      , "details" .= errorDetails
      , "isOperational" .= errorIsOperational
      ]
    safeError = object
      [ "status" .= errorStatus
      , "statusCode" .= errorStatusCode
      , "message" .= errorMessage
      , "details" .= filterDetails errorDetails
      ]
    filterDetails Nothing = Nothing
    filterDetails (Just details) = Just $ details { detailsStackTrace = Nothing }

-- | Log errors with context
logError :: LoggerSet -> AppError -> Request -> IO ()
logError logger err@AppError{..} req = do
  let method = decodeUtf8 $ requestMethod req
      path = decodeUtf8 $ rawPathInfo req
      logMsg = T.concat
        [ "[ERROR] "
        , method, " ", path, " - "
        , "Status: ", T.pack (show errorStatusCode), " - "
        , "Message: ", errorMessage
        , case errorDetails of
            Nothing -> ""
            Just ErrorDetails{..} -> T.concat $ catMaybes
              [ (" - Field: " <>) <$> detailsField
              , (" - Context: " <>) <$> detailsContext
              ]
        ]
  pushLogStrLn logger $ toLogStr logMsg

-- | Helper function to handle validation errors
handleValidation :: Either [ValidationError] a -> HandlerT a
handleValidation (Left errors) = throwAppError $ mkValidationError "Validation failed" errors
handleValidation (Right value) = return value

-- | Helper to handle Maybe values with custom error
handleMaybe :: AppError -> Maybe a -> HandlerT a
handleMaybe err Nothing = throwAppError err
handleMaybe _ (Just value) = return value

-- | Helper to handle Either values
handleEither :: ToAppError e => Either e a -> HandlerT a
handleEither (Left err) = throwAppError $ toAppError err
handleEither (Right value) = return value

-- | Run IO action with error handling
liftIOWithError :: IO a -> HandlerT a
liftIOWithError action = do
  result <- liftIO $ try action
  case result of
    Left (e :: SomeException) -> throwAppError $ toAppError e
    Right value -> return value

-- | Transform validation results
validateOr :: AppError -> Bool -> HandlerT ()
validateOr err False = throwAppError err
validateOr _ True = return ()

-- | Ensure a condition is met
ensure :: Text -> Bool -> HandlerT ()
ensure msg condition = validateOr (mkBadRequest msg Nothing) condition

-- | Ensure a resource exists
ensureExists :: Text -> Maybe a -> HandlerT a
ensureExists resourceType = handleMaybe (mkNotFound (resourceType <> " not found") Nothing)

-- | Handle authentication
requireAuth :: Maybe Text -> HandlerT Text
requireAuth Nothing = throwAppError mkJWTError
requireAuth (Just token) = return token

-- | Handle authorization
requirePermission :: Bool -> Text -> HandlerT ()
requirePermission False resource = throwAppError $ mkForbidden ("Access denied to " <> resource) Nothing
requirePermission True _ = return ()

-- | Catch specific error types and transform them
catchErrorType :: (AppError -> Bool) -> HandlerT a -> (AppError -> HandlerT a) -> HandlerT a
catchErrorType predicate action handler = catchError action $ \err ->
  if predicate (serverErrorToAppError err)
  then handler (serverErrorToAppError err)
  else throwError err
  where
    serverErrorToAppError :: ServerError -> AppError
    serverErrorToAppError = toAppError

-- | Retry an action with exponential backoff
retryWithBackoff :: Int -> HandlerT a -> HandlerT a
retryWithBackoff 0 action = action
retryWithBackoff n action = catchErrorType isTransientError action $ \_ -> do
  liftIO $ threadDelay (1000000 * (4 - n)) -- Exponential backoff
  retryWithBackoff (n - 1) action
  where
    isTransientError err = errorStatusCode err == 503 || errorStatusCode err == 502

-- | Create a validation error from field errors
fieldErrors :: [(Text, Text)] -> AppError
fieldErrors errors = mkValidationError "Validation failed" validationErrors
  where
    validationErrors = map (\(field, msg) -> ValidationError field msg Nothing) errors

-- | Combine multiple validations
combineValidations :: [Either ValidationError a] -> Either AppError [a]
combineValidations results = case partitionEithers results of
  ([], values) -> Right values
  (errors, _) -> Left $ mkValidationError "Multiple validation errors" errors

-- | Helper imports
import Data.Bifunctor (first)
import Data.Either (partitionEithers)
import Data.Maybe (catMaybes)
import Data.Text.Encoding (decodeUtf8)
import Control.Concurrent (threadDelay)
import Control.Monad.Except (catchError)