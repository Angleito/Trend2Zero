module Components.LivePriceDisplay.WebSocketIntegration where

import Prelude

import Control.Monad.Rec.Class (forever)
import Data.DateTime (DateTime)
import Data.Maybe (Maybe(..))
import Effect (Effect)
import Effect.Aff (Aff, Milliseconds(..), delay, forkAff, killFiber)
import Effect.Aff.Bus as Bus
import Effect.Class (liftEffect)
import Effect.Exception (error)
import Halogen as H
import Halogen.Subscription as HS
import Types (AssetPrice)
import WebSocket.Client as WS

-- Event types for WebSocket messages
data WSEvent
  = WSConnected
  | WSDisconnected
  | WSPriceUpdate AssetPrice DateTime
  | WSBulkPriceUpdate (Array AssetPrice) DateTime
  | WSNotification WS.NotificationType String String (Maybe Json) DateTime
  | WSError Int String

-- WebSocket integration manager
data WSManager = WSManager
  { client :: WS.WebSocketClient
  , eventBus :: Bus.BusW WSEvent
  , subscription :: HS.Emitter WSEvent
  }

-- Create WebSocket manager with event bus
createWSManager :: Effect WSManager
createWSManager = do
  -- Create WebSocket client
  client <- WS.createWebSocketClient
    { url: "ws://localhost:8081"
    , reconnectDelay: Milliseconds 3000.0
    , maxReconnectAttempts: 5
    , heartbeatInterval: Milliseconds 30000.0
    }
  
  -- Create event bus
  eventBus <- Bus.make
  
  -- Create subscription from bus
  let subscription = HS.effectEventSource \emitter -> do
        -- Set up WebSocket event handlers
        WS.onPriceUpdate client $ \price timestamp -> do
          Bus.write (WSPriceUpdate price timestamp) eventBus
          HS.emit emitter (WSPriceUpdate price timestamp)
        
        WS.onNotification client $ \nType title message mData timestamp -> do
          let event = WSNotification nType title message mData timestamp
          Bus.write event eventBus
          HS.emit emitter event
        
        -- Connection status handlers could be added here
        
        -- Return cleanup function
        pure $ pure unit
  
  pure $ WSManager { client, eventBus, subscription }

-- Connect with status tracking
connectWithStatus :: WSManager -> Aff Unit
connectWithStatus (WSManager manager) = do
  liftEffect $ WS.connect manager.client
  
  -- Monitor connection status
  _ <- forkAff $ forever do
    isConnected <- liftEffect $ WS.isConnected manager.client
    liftEffect $ Bus.write (if isConnected then WSConnected else WSDisconnected) manager.eventBus
    delay (Milliseconds 1000.0)
  
  pure unit

-- Disconnect
disconnect :: WSManager -> Effect Unit
disconnect (WSManager manager) = WS.disconnect manager.client

-- Subscribe to a target
subscribe :: WSManager -> WS.SubscriptionTarget -> Effect Unit
subscribe (WSManager manager) target = WS.subscribe manager.client target

-- Unsubscribe from a target
unsubscribe :: WSManager -> WS.SubscriptionTarget -> Effect Unit
unsubscribe (WSManager manager) target = WS.unsubscribe manager.client target

-- Get event subscription
getEventSubscription :: WSManager -> HS.Emitter WSEvent
getEventSubscription (WSManager manager) = manager.subscription

-- Helper to use in Halogen components
useWebSocket :: forall state action slots output m.
  MonadAff m =>
  (WSEvent -> action) ->
  H.HalogenM state action slots output m (Maybe H.SubscriptionId)
useWebSocket handleEvent = do
  manager <- liftEffect createWSManager
  
  -- Subscribe to WebSocket events
  H.subscribe (handleEvent <$> getEventSubscription manager)

-- Example usage in a Halogen component:
{-
data Action
  = Initialize
  | HandleWSEvent WSEvent
  | ...other actions...

handleAction = case _ of
  Initialize -> do
    -- Set up WebSocket subscription
    void $ useWebSocket HandleWSEvent
    
  HandleWSEvent event -> case event of
    WSPriceUpdate price timestamp ->
      -- Handle price update
      ...
    
    WSConnected ->
      -- Handle connection
      ...
    
    WSDisconnected ->
      -- Handle disconnection
      ...
    
    _ -> pure unit
-}