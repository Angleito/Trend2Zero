module Components.ErrorBoundary where

import Prelude

import Data.Maybe (Maybe(..))
import Effect.Aff.Class (class MonadAff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Type.Proxy (Proxy(..))

import Error.Handler (AppError, ErrorSeverity(..), toUserMessage, errorSeverity, logError)

-- | Component slot type
type Slot id = H.Slot Query Message id

-- | Component query type
data Query a = GetError (Maybe AppError -> a)

-- | Component messages
data Message
  = ErrorOccurred AppError
  | ErrorCleared

-- | Component state
type State =
  { hasError :: Boolean
  , error :: Maybe AppError
  , errorHistory :: Array AppError
  }

-- | Component actions
data Action
  = Initialize
  | HandleError AppError
  , ClearError
  | ReportError
  | Retry

-- | Child slots
type ChildSlots =
  ( content :: H.Slot Query Void Unit
  )

_content :: Proxy "content"
_content = Proxy

-- | Component definition
component :: forall q i o m. MonadAff m => H.Component q i o m
component =
  H.mkComponent
    { initialState
    , render
    , eval: H.mkEval $ H.defaultEval
        { handleAction = handleAction
        , handleQuery = handleQuery
        , initialize = Just Initialize
        }
    }

initialState :: forall i. i -> State
initialState _ =
  { hasError: false
  , error: Nothing
  , errorHistory: []
  }

render :: forall m. State -> H.ComponentHTML Action ChildSlots m
render state =
  if state.hasError
    then renderError state
    else renderContent state

renderError :: forall m. State -> H.ComponentHTML Action ChildSlots m
renderError state =
  HH.div
    [ HP.classes [ H.ClassName "error-boundary" ] ]
    [ HH.div
        [ HP.classes [ H.ClassName $ "error-container " <> severityClass ] ]
        [ renderErrorIcon
        , HH.div
            [ HP.classes [ H.ClassName "error-content" ] ]
            [ HH.h2
                [ HP.classes [ H.ClassName "error-title" ] ]
                [ HH.text errorTitle ]
            , HH.p
                [ HP.classes [ H.ClassName "error-message" ] ]
                [ HH.text errorMessage ]
            , renderErrorDetails
            , HH.div
                [ HP.classes [ H.ClassName "error-actions" ] ]
                [ HH.button
                    [ HP.classes [ H.ClassName "btn btn-primary" ]
                    , HE.onClick \_ -> Retry
                    ]
                    [ HH.text "Try Again" ]
                , HH.button
                    [ HP.classes [ H.ClassName "btn btn-secondary" ]
                    , HE.onClick \_ -> ClearError
                    ]
                    [ HH.text "Dismiss" ]
                , HH.button
                    [ HP.classes [ H.ClassName "btn btn-outline" ]
                    , HE.onClick \_ -> ReportError
                    ]
                    [ HH.text "Report Issue" ]
                ]
            ]
        ]
    ]
  where
    severityClass = case state.error of
      Just err -> case errorSeverity err of
        Info -> "severity-info"
        Warning -> "severity-warning"
        Error -> "severity-error"
        Critical -> "severity-critical"
      Nothing -> "severity-error"
    
    errorTitle = case state.error of
      Just err -> case errorSeverity err of
        Info -> "Information"
        Warning -> "Warning"
        Error -> "Error"
        Critical -> "Critical Error"
      Nothing -> "Error"
    
    errorMessage = case state.error of
      Just err -> toUserMessage err
      Nothing -> "An unexpected error occurred"
    
    renderErrorIcon =
      HH.div
        [ HP.classes [ H.ClassName "error-icon" ] ]
        [ HH.i
            [ HP.classes [ H.ClassName iconClass ] ]
            []
        ]
      where
        iconClass = case state.error of
          Just err -> case errorSeverity err of
            Info -> "fas fa-info-circle"
            Warning -> "fas fa-exclamation-triangle"
            Error -> "fas fa-times-circle"
            Critical -> "fas fa-skull-crossbones"
          Nothing -> "fas fa-times-circle"
    
    renderErrorDetails = case state.error of
      Just _ | length state.errorHistory > 1 ->
        HH.details
          [ HP.classes [ H.ClassName "error-details" ] ]
          [ HH.summary [] [ HH.text "Error History" ]
          , HH.ul
              [ HP.classes [ H.ClassName "error-history" ] ]
              (map renderHistoryItem state.errorHistory)
          ]
      _ -> HH.text ""
    
    renderHistoryItem err =
      HH.li []
        [ HH.span
            [ HP.classes [ H.ClassName $ "history-severity " <> historySeverityClass err ] ]
            [ HH.text $ show $ errorSeverity err ]
        , HH.text $ ": " <> toUserMessage err
        ]
    
    historySeverityClass err = case errorSeverity err of
      Info -> "text-info"
      Warning -> "text-warning"
      Error -> "text-error"
      Critical -> "text-critical"

renderContent :: forall m. State -> H.ComponentHTML Action ChildSlots m
renderContent _ =
  HH.div
    [ HP.classes [ H.ClassName "error-boundary-content" ] ]
    [ HH.slot_ _content unit component unit ]

handleAction :: forall o m. MonadAff m => Action -> H.HalogenM State Action ChildSlots o m Unit
handleAction = case _ of
  Initialize -> do
    -- Set up any error listeners if needed
    pure unit
  
  HandleError err -> do
    H.liftEffect $ logError err
    H.modify_ \st -> st
      { hasError = true
      , error = Just err
      , errorHistory = cons err st.errorHistory
      }
    H.raise $ ErrorOccurred err
  
  ClearError -> do
    H.modify_ \st -> st
      { hasError = false
      , error = Nothing
      }
    H.raise ErrorCleared
  
  ReportError -> do
    state <- H.get
    case state.error of
      Just err -> do
        -- In a real app, this would send error reports to a service
        H.liftEffect $ logError err
        pure unit
      Nothing -> pure unit
  
  Retry -> do
    H.modify_ \st -> st
      { hasError = false
      , error = Nothing
      }
    H.raise ErrorCleared

handleQuery :: forall o m a. Query a -> H.HalogenM State Action ChildSlots o m (Maybe a)
handleQuery = case _ of
  GetError reply -> do
    state <- H.get
    pure $ Just $ reply state.error

-- | Helper function to wrap components with error boundary
withErrorBoundary :: forall q i o m
  . MonadAff m
  => H.Component q i o m
  -> H.Component q i (Message) m
withErrorBoundary childComponent =
  H.mkComponent
    { initialState: identity
    , render: \input ->
        HH.slot
          (Proxy :: Proxy "errorBoundary")
          unit
          component
          unit
          identity
    , eval: H.mkEval $ H.defaultEval
        { handleAction = \_ -> pure unit
        }
    }

-- | CSS styles for the error boundary (to be included in your stylesheet)
errorBoundaryStyles :: String
errorBoundaryStyles = """
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-container {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: white;
  text-align: center;
}

.error-container.severity-info {
  border-left: 4px solid #3182ce;
}

.error-container.severity-warning {
  border-left: 4px solid #d69e2e;
}

.error-container.severity-error {
  border-left: 4px solid #e53e3e;
}

.error-container.severity-critical {
  border-left: 4px solid #742a2a;
  background: #fff5f5;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-icon .fa-info-circle {
  color: #3182ce;
}

.error-icon .fa-exclamation-triangle {
  color: #d69e2e;
}

.error-icon .fa-times-circle {
  color: #e53e3e;
}

.error-icon .fa-skull-crossbones {
  color: #742a2a;
}

.error-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 1.5rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-details {
  margin: 1rem 0;
  text-align: left;
  background: #f7fafc;
  padding: 1rem;
  border-radius: 4px;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
}

.error-history {
  margin-top: 0.5rem;
  list-style: none;
  padding: 0;
}

.error-history li {
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.history-severity {
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.text-info { color: #3182ce; }
.text-warning { color: #d69e2e; }
.text-error { color: #e53e3e; }
.text-critical { color: #742a2a; }

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #3182ce;
  color: white;
}

.btn-primary:hover {
  background: #2c5aa0;
}

.btn-secondary {
  background: #718096;
  color: white;
}

.btn-secondary:hover {
  background: #4a5568;
}

.btn-outline {
  background: white;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.btn-outline:hover {
  background: #f7fafc;
}

.error-boundary-content {
  width: 100%;
  height: 100%;
}
"""

-- Required imports
import Data.Array (cons, length)