module Hooks.UseAuth
  ( useAuth
  , AuthState
  , AuthActions
  , User
  , AuthHook
  , AuthError(..)
  ) where

import Prelude

import Affjax as AX
import Affjax.RequestBody as RequestBody
import Affjax.ResponseFormat as ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut (Json, decodeJson, encodeJson, jsonEmptyObject, (.:), (:=), (~>))
import Data.Argonaut.Decode.Class (class DecodeJson)
import Data.Argonaut.Encode.Class (class EncodeJson)
import Data.Either (Either(..), either)
import Data.Maybe (Maybe(..), fromMaybe, isJust)
import Data.Newtype (class Newtype)
import Effect (Effect)
import Effect.Aff (Aff, Error, attempt, launchAff_, message)
import Effect.Class (liftEffect)
import Effect.Ref as Ref
import Halogen.Hooks as Hooks
import Halogen.Hooks.Hook (Hook)
import Web.HTML (window)
import Web.HTML.Window (localStorage)
import Web.Storage.Storage (getItem, setItem, removeItem)

-- | User type
type User =
  { _id :: String
  , email :: String
  , name :: Maybe String
  , role :: String
  }

-- | Authentication state
type AuthState =
  { user :: Maybe User
  , isAuthenticated :: Boolean
  , loading :: Boolean
  , error :: Maybe String
  }

-- | Authentication error types
data AuthError
  = NetworkError String
  | ParseError String
  , Unauthorized
  | BadRequest String
  | ServerError String

instance showAuthError :: Show AuthError where
  show (NetworkError msg) = "Network error: " <> msg
  show (ParseError msg) = "Parse error: " <> msg
  show Unauthorized = "Unauthorized"
  show (BadRequest msg) = "Bad request: " <> msg
  show (ServerError msg) = "Server error: " <> msg

-- | Authentication actions
type AuthActions =
  { login :: String -> String -> Aff (Either AuthError User)
  , logout :: Aff Unit
  , register :: String -> String -> String -> String -> Aff (Either AuthError User)
  , checkAuthStatus :: Aff (Maybe User)
  }

-- | Authentication hook return type
type AuthHook =
  { state :: AuthState
  , actions :: AuthActions
  }

-- | Authentication configuration
type AuthConfig =
  { apiBaseUrl :: String
  , tokenKey :: String
  }

-- | Default authentication configuration
defaultAuthConfig :: AuthConfig
defaultAuthConfig =
  { apiBaseUrl: "/api/v1"
  , tokenKey: "auth-token"
  }

-- | Login request type
newtype LoginRequest = LoginRequest
  { email :: String
  , password :: String
  }

derive instance newtypeLoginRequest :: Newtype LoginRequest _

instance encodeJsonLoginRequest :: EncodeJson LoginRequest where
  encodeJson (LoginRequest req) = 
    "email" := req.email
    ~> "password" := req.password
    ~> jsonEmptyObject

-- | Register request type
newtype RegisterRequest = RegisterRequest
  { email :: String
  , password :: String
  , name :: String
  , passwordConfirm :: String
  }

derive instance newtypeRegisterRequest :: Newtype RegisterRequest _

instance encodeJsonRegisterRequest :: EncodeJson RegisterRequest where
  encodeJson (RegisterRequest req) = 
    "email" := req.email
    ~> "password" := req.password
    ~> "name" := req.name
    ~> "passwordConfirm" := req.passwordConfirm
    ~> jsonEmptyObject

-- | Authentication response type
type AuthResponse =
  { status :: String
  , token :: String
  , data :: { user :: User }
  }

-- | Decode JSON instances
instance decodeJsonUser :: DecodeJson User where
  decodeJson json = do
    obj <- decodeJson json
    _id <- obj .: "_id"
    email <- obj .: "email"
    name <- obj .: "name"
    role <- obj .: "role"
    pure { _id, email, name, role }

instance decodeJsonAuthResponse :: DecodeJson AuthResponse where
  decodeJson json = do
    obj <- decodeJson json
    status <- obj .: "status"
    token <- obj .: "token"
    userData <- obj .: "data"
    user <- userData .: "user"
    pure { status, token, data: { user } }

-- | Store auth token in localStorage
storeAuthToken :: String -> Effect Unit
storeAuthToken token = do
  win <- window
  storage <- localStorage win
  setItem defaultAuthConfig.tokenKey token storage

-- | Retrieve auth token from localStorage
getAuthToken :: Effect (Maybe String)
getAuthToken = do
  win <- window
  storage <- localStorage win
  getItem defaultAuthConfig.tokenKey storage

-- | Remove auth token from localStorage
removeAuthToken :: Effect Unit
removeAuthToken = do
  win <- window
  storage <- localStorage win
  removeItem defaultAuthConfig.tokenKey storage

-- | Make authenticated request
makeAuthRequest :: forall a. DecodeJson a => AX.Request Json -> Aff (Either AuthError a)
makeAuthRequest req = do
  tokenMaybe <- liftEffect getAuthToken
  let headers = case tokenMaybe of
        Just token -> req.headers <> [AX.RequestHeader "Authorization" ("Bearer " <> token)]
        Nothing -> req.headers
      authReq = req { headers = headers }
  
  result <- attempt $ AX.request authReq
  case result of
    Left err -> pure $ Left $ NetworkError $ message err
    Right response -> 
      case response.status of
        StatusCode 200 -> 
          case decodeJson response.body of
            Left err -> pure $ Left $ ParseError $ show err
            Right value -> pure $ Right value
        StatusCode 201 -> 
          case decodeJson response.body of
            Left err -> pure $ Left $ ParseError $ show err
            Right value -> pure $ Right value
        StatusCode 401 -> pure $ Left Unauthorized
        StatusCode 400 -> pure $ Left $ BadRequest "Invalid request"
        _ -> pure $ Left $ ServerError $ "Unexpected status: " <> show response.status

-- | Authentication hook
useAuth :: forall m. Hooks.MonadHook m => Hook m Unit AuthHook
useAuth = Hooks.do
  -- Initialize state
  stateRef <- Hooks.useRef initialState
  
  -- Create actions
  let actions = createActions stateRef
  
  -- Check auth status on mount
  Hooks.useLifecycleEffect do
    launchAff_ $ void $ actions.checkAuthStatus
    pure Nothing
  
  -- Return hook interface
  state <- Hooks.useRefEq stateRef
  pure { state, actions }
  
  where
    initialState :: AuthState
    initialState =
      { user: Nothing
      , isAuthenticated: false
      , loading: true
      , error: Nothing
      }
    
    createActions :: Ref.Ref AuthState -> AuthActions
    createActions stateRef =
      { login: login stateRef
      , logout: logout stateRef
      , register: register stateRef
      , checkAuthStatus: checkAuthStatus stateRef
      }
    
    -- Login action
    login :: Ref.Ref AuthState -> String -> String -> Aff (Either AuthError User)
    login stateRef email password = do
      liftEffect $ Ref.modify_ (_ { loading = true, error = Nothing }) stateRef
      
      let loginReq = AX.defaultRequest
            { url = defaultAuthConfig.apiBaseUrl <> "/auth/login"
            , method = Left AX.POST
            , content = Just $ RequestBody.json $ encodeJson $ LoginRequest { email, password }
            , responseFormat = ResponseFormat.json
            }
      
      result <- makeAuthRequest loginReq
      case result of
        Left err -> do
          liftEffect $ Ref.modify_ (_ { loading = false, error = Just $ show err, user = Nothing, isAuthenticated = false }) stateRef
          pure $ Left err
        Right (response :: AuthResponse) -> do
          liftEffect $ storeAuthToken response.token
          liftEffect $ Ref.modify_ (_ { loading = false, error = Nothing, user = Just response.data.user, isAuthenticated = true }) stateRef
          pure $ Right response.data.user
    
    -- Logout action
    logout :: Ref.Ref AuthState -> Aff Unit
    logout stateRef = do
      liftEffect $ removeAuthToken
      liftEffect $ Ref.modify_ (_ { user = Nothing, isAuthenticated = false, error = Nothing, loading = false }) stateRef
    
    -- Register action
    register :: Ref.Ref AuthState -> String -> String -> String -> String -> Aff (Either AuthError User)
    register stateRef email password name passwordConfirm = do
      liftEffect $ Ref.modify_ (_ { loading = true, error = Nothing }) stateRef
      
      let registerReq = AX.defaultRequest
            { url = defaultAuthConfig.apiBaseUrl <> "/auth/register"
            , method = Left AX.POST
            , content = Just $ RequestBody.json $ encodeJson $ RegisterRequest { email, password, name, passwordConfirm }
            , responseFormat = ResponseFormat.json
            }
      
      result <- makeAuthRequest registerReq
      case result of
        Left err -> do
          liftEffect $ Ref.modify_ (_ { loading = false, error = Just $ show err, user = Nothing, isAuthenticated = false }) stateRef
          pure $ Left err
        Right (response :: AuthResponse) -> do
          liftEffect $ storeAuthToken response.token
          liftEffect $ Ref.modify_ (_ { loading = false, error = Nothing, user = Just response.data.user, isAuthenticated = true }) stateRef
          pure $ Right response.data.user
    
    -- Check authentication status
    checkAuthStatus :: Ref.Ref AuthState -> Aff (Maybe User)
    checkAuthStatus stateRef = do
      tokenMaybe <- liftEffect getAuthToken
      case tokenMaybe of
        Nothing -> do
          liftEffect $ Ref.modify_ (_ { loading = false, user = Nothing, isAuthenticated = false }) stateRef
          pure Nothing
        Just _ -> do
          let meReq = AX.defaultRequest
                { url = defaultAuthConfig.apiBaseUrl <> "/auth/me"
                , method = Left AX.GET
                , responseFormat = ResponseFormat.json
                }
          
          result <- makeAuthRequest meReq
          case result of
            Left _ -> do
              liftEffect $ removeAuthToken
              liftEffect $ Ref.modify_ (_ { loading = false, user = Nothing, isAuthenticated = false }) stateRef
              pure Nothing
            Right (response :: { status :: String, data :: { user :: User } }) -> do
              liftEffect $ Ref.modify_ (_ { loading = false, user = Just response.data.user, isAuthenticated = true }) stateRef
              pure $ Just response.data.user