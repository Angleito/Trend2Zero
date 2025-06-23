module API.Client
  ( APIConfig
  , APIError(..)
  , APIResult
  , RequestOptions
  , RetryConfig
  , defaultConfig
  , defaultRetryConfig
  , makeRequest
  , get
  , post
  , put
  , delete
  , setAuthToken
  , getAuthToken
  , clearAuthToken
  , isAuthenticated
  , withRetry
  , withAuth
  ) where

import Prelude

import Affjax as AX
import Affjax.RequestBody as RequestBody
import Affjax.RequestHeader (RequestHeader(..))
import Affjax.ResponseFormat as ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Control.Monad.Except (ExceptT(..), except, runExceptT, throwError)
import Data.Argonaut (class DecodeJson, class EncodeJson, Json, decodeJson, encodeJson, printJsonDecodeError, stringify)
import Data.Array ((:))
import Data.Either (Either(..), either)
import Data.HTTP.Method (Method(..))
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.String as String
import Data.Time.Duration (Milliseconds(..))
import Effect (Effect)
import Effect.Aff (Aff, attempt, delay)
import Effect.Aff.Class (class MonadAff, liftAff)
import Effect.Class (liftEffect)
import Effect.Ref as Ref
import Web.HTML (window)
import Web.HTML.Window (localStorage)
import Web.Storage.Storage as Storage

-- API Configuration
type APIConfig =
  { baseUrl :: String
  , timeout :: Maybe Milliseconds
  , headers :: Array RequestHeader
  , retryConfig :: RetryConfig
  }

type RetryConfig =
  { maxRetries :: Int
  , retryDelay :: Milliseconds
  , retryOn :: Array StatusCode
  }

-- API Error Types
data APIError
  = NetworkError String
  | DecodeError String
  | ServerError Int String
  | AuthError String
  | TimeoutError
  | UnknownError String

derive instance eqAPIError :: Eq APIError

instance showAPIError :: Show APIError where
  show (NetworkError msg) = "NetworkError: " <> msg
  show (DecodeError msg) = "DecodeError: " <> msg
  show (ServerError code msg) = "ServerError " <> show code <> ": " <> msg
  show (AuthError msg) = "AuthError: " <> msg
  show TimeoutError = "TimeoutError: Request timed out"
  show (UnknownError msg) = "UnknownError: " <> msg

type APIResult a = Either APIError a

-- Request Options
type RequestOptions =
  { headers :: Array RequestHeader
  , timeout :: Maybe Milliseconds
  , withCredentials :: Boolean
  , retry :: Maybe RetryConfig
  }

-- Default Configurations
defaultConfig :: APIConfig
defaultConfig =
  { baseUrl: "/api"
  , timeout: Just (Milliseconds 30000.0)
  , headers: [ ContentType (MediaType "application/json") ]
  , retryConfig: defaultRetryConfig
  }

defaultRetryConfig :: RetryConfig
defaultRetryConfig =
  { maxRetries: 3
  , retryDelay: Milliseconds 1000.0
  , retryOn: [ StatusCode 408, StatusCode 429, StatusCode 500, StatusCode 502, StatusCode 503, StatusCode 504 ]
  }

-- Token Management
authTokenKey :: String
authTokenKey = "token"

setAuthToken :: String -> Effect Unit
setAuthToken token = do
  win <- window
  store <- localStorage win
  Storage.setItem authTokenKey token store

getAuthToken :: Effect (Maybe String)
getAuthToken = do
  win <- window
  store <- localStorage win
  Storage.getItem authTokenKey store

clearAuthToken :: Effect Unit
clearAuthToken = do
  win <- window
  store <- localStorage win
  Storage.removeItem authTokenKey store

isAuthenticated :: Effect Boolean
isAuthenticated = do
  token <- getAuthToken
  pure $ maybe false (not <<< String.null) token

-- Request Interceptors
applyAuthHeader :: Array RequestHeader -> Effect (Array RequestHeader)
applyAuthHeader headers = do
  maybeToken <- getAuthToken
  pure $ case maybeToken of
    Just token | not (String.null token) -> 
      RequestHeader "Authorization" ("Bearer " <> token) : headers
    _ -> headers

-- Response Interceptors
handleAuthError :: forall a. AX.Response Json -> Effect Unit
handleAuthError response = 
  when (response.status == StatusCode 401) $ do
    clearAuthToken
    -- In a real app, you'd redirect to login here
    pure unit

-- Core Request Function
makeRequest :: forall a b. DecodeJson b => EncodeJson a =>
  APIConfig ->
  Method ->
  String ->
  Maybe a ->
  RequestOptions ->
  Aff (APIResult b)
makeRequest config method path body options = do
  headers <- liftEffect $ applyAuthHeader (config.headers <> options.headers)
  
  let url = config.baseUrl <> path
      timeout = options.timeout <|> config.timeout
      retryConfig = fromMaybe config.retryConfig options.retry
      
      request = AX.defaultRequest
        { url = url
        , method = Left method
        , headers = headers
        , content = RequestBody.json <$> (encodeJson <$> body)
        , timeout = timeout
        , responseFormat = ResponseFormat.json
        , withCredentials = options.withCredentials
        }
  
  result <- withRetry retryConfig $ attempt $ AX.request request
  
  case result of
    Left err -> pure $ Left $ NetworkError $ AX.printError err
    Right response -> do
      liftEffect $ handleAuthError response
      case response.status of
        StatusCode code | code >= 200 && code < 300 ->
          case decodeJson response.body of
            Left decodeErr -> pure $ Left $ DecodeError $ printJsonDecodeError decodeErr
            Right value -> pure $ Right value
        StatusCode 401 -> pure $ Left $ AuthError "Authentication required"
        StatusCode code -> do
          let errorMsg = case decodeJson response.body of
                Left _ -> "Server error"
                Right (errObj :: { error :: String }) -> errObj.error
          pure $ Left $ ServerError code errorMsg

-- Retry Logic
withRetry :: forall a. RetryConfig -> Aff a -> Aff a
withRetry config action = go config.maxRetries
  where
    go 0 = action
    go n = do
      result <- attempt action
      case result of
        Left _ -> do
          delay config.retryDelay
          go (n - 1)
        Right value -> pure value

-- Convenience Functions
get :: forall a. DecodeJson a =>
  APIConfig ->
  String ->
  RequestOptions ->
  Aff (APIResult a)
get config path options = makeRequest config GET path (Nothing :: Maybe Unit) options

post :: forall a b. DecodeJson b => EncodeJson a =>
  APIConfig ->
  String ->
  a ->
  RequestOptions ->
  Aff (APIResult b)
post config path body options = makeRequest config POST path (Just body) options

put :: forall a b. DecodeJson b => EncodeJson a =>
  APIConfig ->
  String ->
  a ->
  RequestOptions ->
  Aff (APIResult b)
put config path body options = makeRequest config PUT path (Just body) options

delete :: forall a. DecodeJson a =>
  APIConfig ->
  String ->
  RequestOptions ->
  Aff (APIResult a)
delete config path options = makeRequest config DELETE path (Nothing :: Maybe Unit) options

-- Higher-order function for authenticated requests
withAuth :: forall a. Aff (APIResult a) -> Aff (APIResult a)
withAuth action = do
  isAuth <- liftEffect isAuthenticated
  if isAuth
    then action
    else pure $ Left $ AuthError "Not authenticated"