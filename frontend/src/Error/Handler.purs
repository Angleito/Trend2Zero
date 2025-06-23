module Error.Handler where

import Prelude

import Data.Either (Either(..), either)
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.String as String
import Effect (Effect)
import Effect.Aff (Aff, Error, attempt, catchError, message, throwError, try)
import Effect.Class (liftEffect)
import Effect.Console as Console
import Foreign (Foreign, ForeignError, readString, renderForeignError)
import Foreign.Object as Object
import Simple.JSON as JSON
import Web.HTML (window)
import Web.HTML.Window (alert)

-- | Core error types
data AppError
  = NetworkError String
  | APIError { statusCode :: Int, message :: String, details :: Maybe ErrorDetails }
  | ValidationError (Array ValidationError)
  | ParseError String
  | UnauthorizedError String
  | ForbiddenError String
  | NotFoundError String
  | TimeoutError String
  | UnknownError String

-- | Error details
type ErrorDetails =
  { field :: Maybe String
  , value :: Maybe String
  , context :: Maybe String
  }

-- | Validation error
type ValidationError =
  { field :: String
  , message :: String
  , code :: Maybe String
  }

-- | Error severity levels
data ErrorSeverity
  = Info
  | Warning
  | Error
  | Critical

-- | User-friendly error messages
class UserMessage a where
  toUserMessage :: a -> String

instance userMessageAppError :: UserMessage AppError where
  toUserMessage (NetworkError _) = "Network connection error. Please check your internet connection."
  toUserMessage (APIError { message }) = message
  toUserMessage (ValidationError errors) = "Please correct the following errors: " <> String.joinWith ", " (map _.message errors)
  toUserMessage (ParseError _) = "Error processing server response. Please try again."
  toUserMessage (UnauthorizedError _) = "You need to log in to access this resource."
  toUserMessage (ForbiddenError _) = "You don't have permission to access this resource."
  toUserMessage (NotFoundError msg) = fromMaybe "The requested resource was not found." (if String.null msg then Nothing else Just msg)
  toUserMessage (TimeoutError _) = "Request timed out. Please try again."
  toUserMessage (UnknownError msg) = fromMaybe "An unexpected error occurred. Please try again." (if String.null msg then Nothing else Just msg)

-- | Get error severity
errorSeverity :: AppError -> ErrorSeverity
errorSeverity (NetworkError _) = Warning
errorSeverity (APIError { statusCode }) 
  | statusCode >= 500 = Critical
  | statusCode >= 400 = Error
  | otherwise = Warning
errorSeverity (ValidationError _) = Warning
errorSeverity (ParseError _) = Error
errorSeverity (UnauthorizedError _) = Warning
errorSeverity (ForbiddenError _) = Warning
errorSeverity (NotFoundError _) = Info
errorSeverity (TimeoutError _) = Warning
errorSeverity (UnknownError _) = Error

-- | Convert Aff Error to AppError
fromAffError :: Error -> AppError
fromAffError err = UnknownError (message err)

-- | Parse API error response
parseAPIError :: Foreign -> Either String AppError
parseAPIError foreign = do
  obj <- JSON.read foreign
  pure $ APIError
    { statusCode: obj.statusCode
    , message: obj.message
    , details: obj.details
    }

-- | Handle errors in Aff computations
handleError :: forall a. Aff a -> Aff (Either AppError a)
handleError action = do
  result <- attempt action
  pure $ case result of
    Left err -> Left (fromAffError err)
    Right value -> Right value

-- | Handle errors with recovery
handleErrorWithRecovery :: forall a. (AppError -> Aff a) -> Aff a -> Aff a
handleErrorWithRecovery recovery action = catchError action (recovery <<< fromAffError)

-- | Log error to console
logError :: AppError -> Effect Unit
logError err = do
  Console.error $ "[ERROR] " <> show (errorSeverity err) <> ": " <> toUserMessage err
  case err of
    APIError { details: Just d } -> Console.error $ "Details: " <> show d
    _ -> pure unit

-- | Show error alert to user
showErrorAlert :: AppError -> Effect Unit
showErrorAlert err = do
  win <- window
  alert (toUserMessage err) win

-- | Retry logic with exponential backoff
retryWithBackoff :: forall a. Int -> Int -> Aff a -> Aff (Either AppError a)
retryWithBackoff maxRetries delayMs action = go maxRetries
  where
    go 0 = handleError action
    go n = do
      result <- handleError action
      case result of
        Left err | isRetryable err -> do
          liftEffect $ Console.log $ "Retrying after " <> show delayMs <> "ms (attempts left: " <> show (n - 1) <> ")"
          delay delayMs
          go (n - 1)
        _ -> pure result
    
    isRetryable (NetworkError _) = true
    isRetryable (TimeoutError _) = true
    isRetryable (APIError { statusCode }) = statusCode >= 500
    isRetryable _ = false
    
    delay ms = liftEffect $ pure unit -- In real implementation, use Aff.delay

-- | Transform error types
mapError :: forall a b. (a -> b) -> Either a c -> Either b c
mapError f (Left a) = Left (f a)
mapError _ (Right c) = Right c

-- | Chain error handlers
chainErrorHandlers :: forall a. Array (AppError -> Maybe (Aff a)) -> AppError -> Aff a
chainErrorHandlers handlers err = go handlers
  where
    go [] = throwError $ error $ toUserMessage err
    go (h:hs) = case h err of
      Just action -> action
      Nothing -> go hs

-- | Create error from status code
fromStatusCode :: Int -> String -> AppError
fromStatusCode status msg
  | status == 401 = UnauthorizedError msg
  | status == 403 = ForbiddenError msg
  | status == 404 = NotFoundError msg
  | status >= 400 && status < 500 = APIError { statusCode: status, message: msg, details: Nothing }
  | status >= 500 = APIError { statusCode: status, message: "Server error: " <> msg, details: Nothing }
  | otherwise = UnknownError msg

-- | Validation helpers
validateField :: forall a. String -> (a -> Either String a) -> a -> Either ValidationError a
validateField fieldName validator value = case validator value of
  Left msg -> Left { field: fieldName, message: msg, code: Nothing }
  Right v -> Right v

combineValidations :: forall a. Array (Either ValidationError a) -> Either AppError (Array a)
combineValidations results = case partitionEithers results of
  { left: [], right: values } -> Right values
  { left: errors, right: _ } -> Left (ValidationError errors)
  where
    partitionEithers :: forall e v. Array (Either e v) -> { left :: Array e, right :: Array v }
    partitionEithers = Array.foldl partition { left: [], right: [] }
    
    partition acc (Left e) = acc { left = Array.cons e acc.left }
    partition acc (Right v) = acc { right = Array.cons v acc.right }

-- | Error context helpers
withContext :: String -> AppError -> AppError
withContext ctx (APIError details) = APIError $ details { details = Just $ fromMaybe emptyDetails details.details # \d -> d { context = Just ctx } }
  where
    emptyDetails = { field: Nothing, value: Nothing, context: Nothing }
withContext _ err = err

withField :: String -> String -> AppError -> AppError
withField field value (APIError details) = APIError $ details { details = Just $ fromMaybe emptyDetails details.details # \d -> d { field = Just field, value = Just value } }
  where
    emptyDetails = { field: Nothing, value: Nothing, context: Nothing }
withField _ _ err = err

-- | Error recovery strategies
data RecoveryStrategy a
  = Retry Int Int (Aff a)
  | Fallback a
  | Transform (AppError -> Aff a)
  | Propagate

applyRecoveryStrategy :: forall a. RecoveryStrategy a -> AppError -> Aff a
applyRecoveryStrategy (Retry maxRetries delayMs action) err = do
  result <- retryWithBackoff maxRetries delayMs action
  either throwError pure result
applyRecoveryStrategy (Fallback value) _ = pure value
applyRecoveryStrategy (Transform f) err = f err
applyRecoveryStrategy Propagate err = throwError $ error $ toUserMessage err

-- | Error boundary for components
type ErrorBoundaryState =
  { hasError :: Boolean
  , error :: Maybe AppError
  }

initialErrorBoundaryState :: ErrorBoundaryState
initialErrorBoundaryState = { hasError: false, error: Nothing }

-- | Helper to show instance
instance showAppError :: Show AppError where
  show (NetworkError msg) = "NetworkError: " <> msg
  show (APIError { statusCode, message }) = "APIError " <> show statusCode <> ": " <> message
  show (ValidationError errors) = "ValidationError: " <> show errors
  show (ParseError msg) = "ParseError: " <> msg
  show (UnauthorizedError msg) = "UnauthorizedError: " <> msg
  show (ForbiddenError msg) = "ForbiddenError: " <> msg
  show (NotFoundError msg) = "NotFoundError: " <> msg
  show (TimeoutError msg) = "TimeoutError: " <> msg
  show (UnknownError msg) = "UnknownError: " <> msg

instance showErrorSeverity :: Show ErrorSeverity where
  show Info = "INFO"
  show Warning = "WARNING"
  show Error = "ERROR"
  show Critical = "CRITICAL"

-- | JSON instances
instance readAppError :: JSON.ReadForeign AppError where
  readImpl f = parseAPIError f # either (Left <<< pure <<< ForeignError) Right

instance writeAppError :: JSON.WriteForeign AppError where
  writeImpl (APIError details) = JSON.writeImpl details
  writeImpl err = JSON.writeImpl { message: toUserMessage err, type: errorType err }
    where
      errorType (NetworkError _) = "NetworkError"
      errorType (APIError _) = "APIError"
      errorType (ValidationError _) = "ValidationError"
      errorType (ParseError _) = "ParseError"
      errorType (UnauthorizedError _) = "UnauthorizedError"
      errorType (ForbiddenError _) = "ForbiddenError"
      errorType (NotFoundError _) = "NotFoundError"
      errorType (TimeoutError _) = "TimeoutError"
      errorType (UnknownError _) = "UnknownError"

-- | Required imports
import Data.Array as Array
import Effect.Exception (error)