module Components.AuthContext
  ( AuthContext
  , AuthContextValue
  , AuthProvider
  , authProvider
  , useAuthContext
  , withAuth
  ) where

import Prelude

import Data.Maybe (Maybe(..), fromMaybe)
import Data.Either (Either(..))
import Data.Symbol (SProxy(..))
import Effect.Aff (Aff, launchAff_)
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.Component as HC
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Halogen.Hooks as Hooks
import Hooks.UseAuth (AuthState, AuthActions, User, AuthError, useAuth)
import Type.Proxy (Proxy(..))
import Web.HTML (window)
import Web.HTML.Window (alert)

-- | Authentication context value type
type AuthContextValue =
  { state :: AuthState
  , actions :: AuthActions
  }

-- | Authentication context
foreign import data AuthContext :: Type

-- | Create authentication context
foreign import createAuthContext :: AuthContextValue -> AuthContext

-- | Use authentication context
foreign import useAuthContextImpl :: AuthContext -> AuthContextValue

-- | Authentication provider component
type AuthProviderInput = 
  { children :: forall i. HH.HTML i Void
  }

type AuthProviderState = 
  { authHook :: { state :: AuthState, actions :: AuthActions }
  }

data AuthProviderAction
  = Initialize
  | UpdateAuthState AuthState

type AuthProviderOutput = Void

type AuthProviderSlots = ()

-- | Authentication provider component definition
authProvider :: forall q i o m. MonadAff m => H.Component q AuthProviderInput o m
authProvider = Hooks.component \tokens input -> Hooks.do
  authHook <- useAuth
  
  Hooks.pure $ HH.div
    [ HP.class_ $ HH.ClassName "auth-provider" ]
    [ renderWithContext authHook.state authHook.actions input.children ]
  
  where
    renderWithContext :: AuthState -> AuthActions -> (forall i. HH.HTML i Void) -> HH.HTML (H.ComponentSlot () m AuthProviderAction) AuthProviderAction
    renderWithContext state actions children =
      HH.div
        [ HP.attr (HH.AttrName "data-auth-state") (show state.isAuthenticated) ]
        [ HH.fromPlainHTML children ]

-- | HOC for components that require authentication
withAuth :: forall q i o m. MonadAff m => H.Component q i o m -> H.Component q i o m
withAuth component = Hooks.component \tokens input -> Hooks.do
  authHook <- useAuth
  
  case authHook.state.user of
    Nothing -> 
      if authHook.state.loading
        then Hooks.pure $ HH.div 
          [ HP.class_ $ HH.ClassName "auth-loading" ]
          [ HH.text "Loading..." ]
        else Hooks.pure $ HH.div 
          [ HP.class_ $ HH.ClassName "auth-required" ]
          [ HH.h2_ [ HH.text "Authentication Required" ]
          , HH.p_ [ HH.text "Please log in to access this page." ]
          ]
    Just _ -> 
      Hooks.pure $ HH.slot (Proxy :: Proxy "authed-component") unit component input absurd

-- | Helper to use auth context in components
useAuthContext :: forall m. Hooks.MonadHook m => Hooks.Hook m Unit AuthContextValue
useAuthContext = useAuth >>= \hook -> Hooks.pure { state: hook.state, actions: hook.actions }

-- | Protected route component
type ProtectedRouteInput =
  { children :: forall i. HH.HTML i Void
  , fallback :: Maybe (forall i. HH.HTML i Void)
  }

protectedRoute :: forall q o m. MonadAff m => H.Component q ProtectedRouteInput o m
protectedRoute = Hooks.component \tokens input -> Hooks.do
  authHook <- useAuth
  
  Hooks.pure $ 
    if authHook.state.isAuthenticated
      then HH.fromPlainHTML input.children
      else HH.fromPlainHTML $ fromMaybe defaultFallback input.fallback
  
  where
    defaultFallback :: forall i. HH.HTML i Void
    defaultFallback = HH.div
      [ HP.class_ $ HH.ClassName "auth-fallback" ]
      [ HH.text "Please log in to continue." ]

-- | Role-based access control component
type RBACInput =
  { children :: forall i. HH.HTML i Void
  , requiredRole :: String
  , fallback :: Maybe (forall i. HH.HTML i Void)
  }

roleBasedAccess :: forall q o m. MonadAff m => H.Component q RBACInput o m
roleBasedAccess = Hooks.component \tokens input -> Hooks.do
  authHook <- useAuth
  
  let hasAccess = case authHook.state.user of
        Just user -> user.role == input.requiredRole || user.role == "admin"
        Nothing -> false
  
  Hooks.pure $
    if hasAccess
      then HH.fromPlainHTML input.children
      else HH.fromPlainHTML $ fromMaybe defaultFallback input.fallback
  
  where
    defaultFallback :: forall i. HH.HTML i Void
    defaultFallback = HH.div
      [ HP.class_ $ HH.ClassName "access-denied" ]
      [ HH.text "You don't have permission to access this content." ]

-- | Login form component for demonstration
type LoginFormState = 
  { email :: String
  , password :: String
  , error :: Maybe String
  , loading :: Boolean
  }

data LoginFormAction
  = UpdateEmail String
  | UpdatePassword String
  | SubmitLogin
  | HandleLoginResult (Either AuthError User)

loginForm :: forall q i o m. MonadAff m => H.Component q i o m
loginForm = Hooks.component \tokens _ -> Hooks.do
  authHook <- useAuth
  emailRef <- Hooks.useRef ""
  passwordRef <- Hooks.useRef ""
  errorRef <- Hooks.useRef Nothing
  loadingRef <- Hooks.useRef false
  
  let handleSubmit = do
        email <- Hooks.readRef emailRef
        password <- Hooks.readRef passwordRef
        Hooks.writeRef loadingRef true
        Hooks.writeRef errorRef Nothing
        
        launchAff_ do
          result <- authHook.actions.login email password
          case result of
            Left err -> liftEffect do
              Hooks.writeRef errorRef (Just $ show err)
              Hooks.writeRef loadingRef false
            Right _ -> liftEffect do
              Hooks.writeRef loadingRef false
  
  email <- Hooks.useRefEq emailRef
  password <- Hooks.useRefEq passwordRef
  error <- Hooks.useRefEq errorRef
  loading <- Hooks.useRefEq loadingRef
  
  Hooks.pure $ HH.form
    [ HP.class_ $ HH.ClassName "login-form"
    , HE.onSubmit \e -> do
        preventDefault e
        handleSubmit
    ]
    [ HH.h2_ [ HH.text "Login" ]
    , case error of
        Just err -> HH.div
          [ HP.class_ $ HH.ClassName "error-message" ]
          [ HH.text err ]
        Nothing -> HH.text ""
    , HH.div
        [ HP.class_ $ HH.ClassName "form-group" ]
        [ HH.label_ [ HH.text "Email" ]
        , HH.input
            [ HP.type_ HP.InputEmail
            , HP.value email
            , HP.placeholder "Enter your email"
            , HE.onValueInput \v -> Hooks.writeRef emailRef v
            , HP.disabled loading
            ]
        ]
    , HH.div
        [ HP.class_ $ HH.ClassName "form-group" ]
        [ HH.label_ [ HH.text "Password" ]
        , HH.input
            [ HP.type_ HP.InputPassword
            , HP.value password
            , HP.placeholder "Enter your password"
            , HE.onValueInput \v -> Hooks.writeRef passwordRef v
            , HP.disabled loading
            ]
        ]
    , HH.button
        [ HP.type_ HP.ButtonSubmit
        , HP.disabled (loading || email == "" || password == "")
        , HP.class_ $ HH.ClassName "submit-button"
        ]
        [ HH.text if loading then "Logging in..." else "Login" ]
    ]
  
  where
    HE = Halogen.HTML.Events
    preventDefault e = H.liftEffect $ Web.Event.Event.preventDefault (Halogen.HTML.Events.toEvent e)