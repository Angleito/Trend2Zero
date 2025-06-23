module WebSocket.Client
  ( WebSocketClient
  , WebSocketConfig(..)
  , WebSocketMessage(..)
  , SubscriptionTarget(..)
  , NotificationType(..)
  , createWebSocketClient
  , connect
  , disconnect
  , subscribe
  , unsubscribe
  , send
  , onPriceUpdate
  , onNotification
  , isConnected
  ) where

import Prelude

import Control.Monad.Except (runExcept)
import Data.Argonaut (Json, decodeJson, encodeJson, jsonParser, stringify, (.:), (.:?), (.!=))
import Data.Argonaut.Decode (class DecodeJson)
import Data.Argonaut.Encode (class EncodeJson)
import Data.DateTime (DateTime)
import Data.Either (Either(..), either)
import Data.Maybe (Maybe(..), fromMaybe, isJust)
import Data.JSDate as JSDate
import Effect (Effect)
import Effect.Aff (Aff, Milliseconds(..), delay, launchAff_)
import Effect.Class (liftEffect)
import Effect.Console (log, error)
import Effect.Ref as Ref
import Types (AssetPrice, AssetCategory)
import Web.Event.Event (Event)
import WebSocket.WebSocket as WS

-- Configuration
type WebSocketConfig =
  { url :: String
  , reconnectDelay :: Milliseconds
  , maxReconnectAttempts :: Int
  , heartbeatInterval :: Milliseconds
  }

-- Message types matching the Haskell implementation
data WebSocketMessage
  = WSSubscribe SubscriptionTarget
  | WSUnsubscribe SubscriptionTarget
  | WSPriceUpdate AssetPrice DateTime
  | WSBulkPriceUpdate (Array AssetPrice) DateTime
  | WSNotification NotificationType String String (Maybe Json) DateTime
  | WSHeartbeat DateTime
  | WSError Int String
  | WSConnectionAck String DateTime

derive instance eqWebSocketMessage :: Eq WebSocketMessage

-- Subscription targets
data SubscriptionTarget
  = AllPrices
  | CategoryPrices AssetCategory
  | SpecificAsset String
  | UserNotifications String

derive instance eqSubscriptionTarget :: Eq SubscriptionTarget

instance encodeJsonSubscriptionTarget :: EncodeJson SubscriptionTarget where
  encodeJson AllPrices = encodeJson { type: "all" }
  encodeJson (CategoryPrices cat) = encodeJson { type: "category", category: cat }
  encodeJson (SpecificAsset symbol) = encodeJson { type: "asset", symbol: symbol }
  encodeJson (UserNotifications userId) = encodeJson { type: "user", userId: userId }

instance decodeJsonSubscriptionTarget :: DecodeJson SubscriptionTarget where
  decodeJson json = do
    obj <- decodeJson json
    targetType <- obj .: "type"
    case targetType of
      "all" -> pure AllPrices
      "category" -> CategoryPrices <$> obj .: "category"
      "asset" -> SpecificAsset <$> obj .: "symbol"
      "user" -> UserNotifications <$> obj .: "userId"
      _ -> Left $ TypeMismatch "Invalid subscription target type"

-- Notification types
data NotificationType
  = PriceAlert
  | SystemNotification
  | PortfolioUpdate
  | NewsAlert

derive instance eqNotificationType :: Eq NotificationType

instance encodeJsonNotificationType :: EncodeJson NotificationType where
  encodeJson PriceAlert = encodeJson "price_alert"
  encodeJson SystemNotification = encodeJson "system"
  encodeJson PortfolioUpdate = encodeJson "portfolio_update"
  encodeJson NewsAlert = encodeJson "news_alert"

instance decodeJsonNotificationType :: DecodeJson NotificationType where
  decodeJson json = do
    str <- decodeJson json
    case str of
      "price_alert" -> pure PriceAlert
      "system" -> pure SystemNotification
      "portfolio_update" -> pure PortfolioUpdate
      "news_alert" -> pure NewsAlert
      _ -> Left $ TypeMismatch "Invalid notification type"

-- WebSocket client state
type ClientState =
  { socket :: Maybe WS.WebSocket
  , config :: WebSocketConfig
  , reconnectAttempts :: Int
  , subscriptions :: Array SubscriptionTarget
  , messageHandlers :: MessageHandlers
  , isReconnecting :: Boolean
  }

type MessageHandlers =
  { onPriceUpdate :: AssetPrice -> DateTime -> Effect Unit
  , onBulkPriceUpdate :: Array AssetPrice -> DateTime -> Effect Unit
  , onNotification :: NotificationType -> String -> String -> Maybe Json -> DateTime -> Effect Unit
  , onError :: Int -> String -> Effect Unit
  , onConnectionAck :: String -> DateTime -> Effect Unit
  }

-- WebSocket client
newtype WebSocketClient = WebSocketClient (Ref.Ref ClientState)

-- Create a new WebSocket client
createWebSocketClient :: WebSocketConfig -> Effect WebSocketClient
createWebSocketClient config = do
  stateRef <- Ref.new
    { socket: Nothing
    , config
    , reconnectAttempts: 0
    , subscriptions: []
    , messageHandlers: defaultHandlers
    , isReconnecting: false
    }
  pure $ WebSocketClient stateRef
  where
    defaultHandlers =
      { onPriceUpdate: \_ _ -> pure unit
      , onBulkPriceUpdate: \_ _ -> pure unit
      , onNotification: \_ _ _ _ _ -> pure unit
      , onError: \code msg -> error $ "WebSocket error " <> show code <> ": " <> msg
      , onConnectionAck: \clientId _ -> log $ "Connected with client ID: " <> clientId
      }

-- Connect to WebSocket server
connect :: WebSocketClient -> Effect Unit
connect (WebSocketClient stateRef) = do
  state <- Ref.read stateRef
  case state.socket of
    Just _ -> log "Already connected"
    Nothing -> do
      log $ "Connecting to " <> state.config.url
      socket <- WS.newWebSocket state.config.url
      
      -- Set up event handlers
      WS.onOpen socket $ \_ -> handleOpen stateRef socket
      WS.onClose socket $ \_ -> handleClose stateRef
      WS.onMessage socket $ handleMessage stateRef
      WS.onError socket $ \_ -> handleError stateRef
      
      -- Update state with socket
      Ref.modify_ (_ { socket = Just socket }) stateRef

-- Disconnect from WebSocket server
disconnect :: WebSocketClient -> Effect Unit
disconnect (WebSocketClient stateRef) = do
  state <- Ref.read stateRef
  case state.socket of
    Nothing -> pure unit
    Just socket -> do
      log "Disconnecting WebSocket"
      WS.close socket
      Ref.modify_ (_ { socket = Nothing, reconnectAttempts = 0 }) stateRef

-- Subscribe to updates
subscribe :: WebSocketClient -> SubscriptionTarget -> Effect Unit
subscribe (WebSocketClient stateRef) target = do
  state <- Ref.read stateRef
  case state.socket of
    Nothing -> error "Not connected"
    Just socket -> do
      -- Add to local subscriptions
      Ref.modify_ (\s -> s { subscriptions = target : s.subscriptions }) stateRef
      
      -- Send subscribe message
      let msg = encodeJson { type: "subscribe", target: target }
      WS.send socket (stringify msg)

-- Unsubscribe from updates
unsubscribe :: WebSocketClient -> SubscriptionTarget -> Effect Unit
unsubscribe (WebSocketClient stateRef) target = do
  state <- Ref.read stateRef
  case state.socket of
    Nothing -> error "Not connected"
    Just socket -> do
      -- Remove from local subscriptions
      Ref.modify_ (\s -> s { subscriptions = filter (_ /= target) s.subscriptions }) stateRef
      
      -- Send unsubscribe message
      let msg = encodeJson { type: "unsubscribe", target: target }
      WS.send socket (stringify msg)

-- Send a raw message
send :: WebSocketClient -> Json -> Effect Unit
send (WebSocketClient stateRef) json = do
  state <- Ref.read stateRef
  case state.socket of
    Nothing -> error "Not connected"
    Just socket -> WS.send socket (stringify json)

-- Check if connected
isConnected :: WebSocketClient -> Effect Boolean
isConnected (WebSocketClient stateRef) = do
  state <- Ref.read stateRef
  pure $ isJust state.socket

-- Set event handlers
onPriceUpdate :: WebSocketClient -> (AssetPrice -> DateTime -> Effect Unit) -> Effect Unit
onPriceUpdate (WebSocketClient stateRef) handler =
  Ref.modify_ (\s -> s { messageHandlers = s.messageHandlers { onPriceUpdate = handler } }) stateRef

onNotification :: WebSocketClient -> (NotificationType -> String -> String -> Maybe Json -> DateTime -> Effect Unit) -> Effect Unit
onNotification (WebSocketClient stateRef) handler =
  Ref.modify_ (\s -> s { messageHandlers = s.messageHandlers { onNotification = handler } }) stateRef

-- Internal handlers
handleOpen :: Ref.Ref ClientState -> WS.WebSocket -> Event -> Effect Unit
handleOpen stateRef socket _ = do
  log "WebSocket connected"
  state <- Ref.read stateRef
  
  -- Reset reconnect attempts
  Ref.modify_ (_ { reconnectAttempts = 0, isReconnecting = false }) stateRef
  
  -- Re-subscribe to previous subscriptions
  for_ state.subscriptions $ \target -> do
    let msg = encodeJson { type: "subscribe", target: target }
    WS.send socket (stringify msg)
  
  -- Start heartbeat
  launchAff_ $ startHeartbeat stateRef

handleClose :: Ref.Ref ClientState -> Event -> Effect Unit
handleClose stateRef _ = do
  log "WebSocket disconnected"
  state <- Ref.read stateRef
  
  -- Clear socket
  Ref.modify_ (_ { socket = Nothing }) stateRef
  
  -- Attempt reconnect if not already reconnecting
  when (not state.isReconnecting && state.reconnectAttempts < state.config.maxReconnectAttempts) $
    launchAff_ $ attemptReconnect stateRef

handleMessage :: Ref.Ref ClientState -> String -> Effect Unit
handleMessage stateRef msgStr = do
  case jsonParser msgStr >>= decodeMessage of
    Left err -> error $ "Failed to parse message: " <> show err
    Right msg -> do
      state <- Ref.read stateRef
      case msg of
        WSPriceUpdate asset timestamp ->
          state.messageHandlers.onPriceUpdate asset timestamp
        
        WSBulkPriceUpdate assets timestamp ->
          state.messageHandlers.onBulkPriceUpdate assets timestamp
        
        WSNotification nType title message mData timestamp ->
          state.messageHandlers.onNotification nType title message mData timestamp
        
        WSError code message ->
          state.messageHandlers.onError code message
        
        WSConnectionAck clientId timestamp ->
          state.messageHandlers.onConnectionAck clientId timestamp
        
        WSHeartbeat _ -> pure unit  -- Heartbeat received
        
        _ -> error "Unexpected message type from server"

handleError :: Ref.Ref ClientState -> Event -> Effect Unit
handleError stateRef _ = do
  error "WebSocket error occurred"
  state <- Ref.read stateRef
  state.messageHandlers.onError 0 "WebSocket error"

-- Decode incoming messages
decodeMessage :: Json -> Either JsonDecodeError WebSocketMessage
decodeMessage json = do
  obj <- decodeJson json
  msgType <- obj .: "type" :: Either _ String
  
  case msgType of
    "price_update" -> do
      isBulk <- obj .:? "bulk" .!= false
      timestamp <- parseTimestamp =<< obj .: "timestamp"
      if isBulk
        then WSBulkPriceUpdate <$> obj .: "assets" <*> pure timestamp
        else WSPriceUpdate <$> obj .: "asset" <*> pure timestamp
    
    "notification" ->
      WSNotification
        <$> obj .: "notificationType"
        <*> obj .: "title"
        <*> obj .: "message"
        <*> obj .:? "data"
        <*> (parseTimestamp =<< obj .: "timestamp")
    
    "error" ->
      WSError <$> obj .: "code" <*> obj .: "message"
    
    "connection_ack" ->
      WSConnectionAck <$> obj .: "clientId" <*> (parseTimestamp =<< obj .: "timestamp")
    
    "heartbeat" ->
      WSHeartbeat <$> (parseTimestamp =<< obj .: "timestamp")
    
    _ -> Left $ TypeMismatch $ "Unknown message type: " <> msgType

-- Parse timestamp from string
parseTimestamp :: String -> Either JsonDecodeError DateTime
parseTimestamp str = 
  case JSDate.parse str >>= JSDate.toDateTime of
    Just dt -> Right dt
    Nothing -> Left $ TypeMismatch $ "Invalid timestamp: " <> str

-- Reconnection logic
attemptReconnect :: Ref.Ref ClientState -> Aff Unit
attemptReconnect stateRef = do
  state <- liftEffect $ Ref.read stateRef
  
  when (state.reconnectAttempts < state.config.maxReconnectAttempts) do
    liftEffect $ log $ "Attempting reconnect " <> show (state.reconnectAttempts + 1) 
      <> "/" <> show state.config.maxReconnectAttempts
    
    -- Update state
    liftEffect $ Ref.modify_ (\s -> s 
      { reconnectAttempts = s.reconnectAttempts + 1
      , isReconnecting = true 
      }) stateRef
    
    -- Wait before reconnecting
    delay state.config.reconnectDelay
    
    -- Attempt to connect
    liftEffect $ connect (WebSocketClient stateRef)

-- Heartbeat sender
startHeartbeat :: Ref.Ref ClientState -> Aff Unit
startHeartbeat stateRef = forever do
  state <- liftEffect $ Ref.read stateRef
  case state.socket of
    Nothing -> pure unit  -- Stop if disconnected
    Just socket -> do
      -- Send heartbeat
      now <- liftEffect $ JSDate.now >>= JSDate.toDateTime >>> pure <<< fromMaybe (unsafePartial $ unsafePartialBecause "Invalid date" Nothing)
      let msg = encodeJson { type: "heartbeat", timestamp: now }
      liftEffect $ WS.send socket (stringify msg)
      
      -- Wait for next heartbeat
      delay state.config.heartbeatInterval

-- Helper function
filter :: forall a. (a -> Boolean) -> Array a -> Array a
filter pred = foldr (\x acc -> if pred x then x : acc else acc) []

for_ :: forall m a. Monad m => Array a -> (a -> m Unit) -> m Unit
for_ xs f = sequence_ (map f xs)

sequence_ :: forall m a. Monad m => Array (m a) -> m Unit
sequence_ = void <<< sequence

forever :: forall m a. Monad m => m a -> m Unit
forever ma = ma *> forever ma

unsafePartialBecause :: forall a. String -> a -> a
unsafePartialBecause _ x = x