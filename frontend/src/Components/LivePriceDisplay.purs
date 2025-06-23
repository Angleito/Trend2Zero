module Components.LivePriceDisplay where

import Prelude

import Data.Array ((:))
import Data.DateTime (DateTime)
import Data.Maybe (Maybe(..))
import Effect.Aff.Class (class MonadAff)
import Effect.Class (class MonadEffect, liftEffect)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Types (AssetPrice, AssetCategory(..))
import WebSocket.Client as WS

-- Component Types
type State =
  { wsClient :: Maybe WS.WebSocketClient
  , prices :: Array AssetPrice
  , connected :: Boolean
  , subscriptions :: Array WS.SubscriptionTarget
  , maxPrices :: Int
  }

data Action
  = Initialize
  | Connect
  | Disconnect
  | Subscribe WS.SubscriptionTarget
  | Unsubscribe WS.SubscriptionTarget
  | HandlePriceUpdate AssetPrice DateTime
  | HandleBulkPriceUpdate (Array AssetPrice) DateTime
  | HandleConnectionStatus Boolean

-- Component Definition
component :: forall q i o m. MonadAff m => H.Component q i o m
component =
  H.mkComponent
    { initialState
    , render
    , eval: H.mkEval $ H.defaultEval
        { handleAction = handleAction
        , initialize = Just Initialize
        }
    }

initialState :: forall i. i -> State
initialState _ =
  { wsClient: Nothing
  , prices: []
  , connected: false
  , subscriptions: []
  , maxPrices: 50  -- Keep last 50 prices
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  HH.div
    [ HP.class_ $ HH.ClassName "live-price-display" ]
    [ HH.div
        [ HP.class_ $ HH.ClassName "connection-status" ]
        [ HH.h3_ [ HH.text "WebSocket Connection" ]
        , HH.div
            [ HP.class_ $ HH.ClassName $ "status " <> statusClass ]
            [ HH.text $ if state.connected then "Connected" else "Disconnected" ]
        , renderConnectionButtons
        ]
    , HH.div
        [ HP.class_ $ HH.ClassName "subscription-controls" ]
        [ HH.h3_ [ HH.text "Subscriptions" ]
        , renderSubscriptionButtons
        ]
    , HH.div
        [ HP.class_ $ HH.ClassName "price-feed" ]
        [ HH.h3_ [ HH.text "Live Price Feed" ]
        , if null state.prices
            then HH.p_ [ HH.text "No prices yet. Subscribe to a feed above." ]
            else HH.div
                   [ HP.class_ $ HH.ClassName "price-list" ]
                   (map renderPrice state.prices)
        ]
    ]
  where
    statusClass = if state.connected then "connected" else "disconnected"
    
    renderConnectionButtons =
      if state.connected
        then HH.button
               [ HP.class_ $ HH.ClassName "btn btn-danger"
               , HE.onClick $ \_ -> Disconnect
               ]
               [ HH.text "Disconnect" ]
        else HH.button
               [ HP.class_ $ HH.ClassName "btn btn-primary"
               , HE.onClick $ \_ -> Connect
               ]
               [ HH.text "Connect" ]
    
    renderSubscriptionButtons =
      HH.div
        [ HP.class_ $ HH.ClassName "subscription-buttons" ]
        [ renderSubButton "All Prices" WS.AllPrices
        , renderSubButton "Crypto Only" (WS.CategoryPrices Crypto)
        , renderSubButton "Stocks Only" (WS.CategoryPrices Stock)
        , renderSubButton "Metals Only" (WS.CategoryPrices Metal)
        , renderSubButton "BTC" (WS.SpecificAsset "BTC")
        , renderSubButton "ETH" (WS.SpecificAsset "ETH")
        ]
    
    renderSubButton label target =
      let isSubscribed = elem target state.subscriptions
      in HH.button
           [ HP.class_ $ HH.ClassName $ "btn " <> 
               if isSubscribed then "btn-secondary" else "btn-outline-primary"
           , HE.onClick $ \_ -> 
               if isSubscribed then Unsubscribe target else Subscribe target
           , HP.disabled $ not state.connected
           ]
           [ HH.text $ label <> if isSubscribed then " ✓" else "" ]
    
    renderPrice :: AssetPrice -> H.ComponentHTML Action () m
    renderPrice price =
      HH.div
        [ HP.class_ $ HH.ClassName "price-item" ]
        [ HH.div
            [ HP.class_ $ HH.ClassName "price-header" ]
            [ HH.span
                [ HP.class_ $ HH.ClassName "symbol" ]
                [ HH.text price.symbol ]
            , case price.name of
                Just name -> HH.span
                              [ HP.class_ $ HH.ClassName "name" ]
                              [ HH.text $ " (" <> name <> ")" ]
                Nothing -> HH.text ""
            ]
        , HH.div
            [ HP.class_ $ HH.ClassName "price-info" ]
            [ HH.span
                [ HP.class_ $ HH.ClassName "price" ]
                [ HH.text $ "$" <> formatNumber price.price ]
            , HH.span
                [ HP.class_ $ HH.ClassName $ "change " <> changeClass price.change ]
                [ HH.text $ formatChange price.change price.changePercent ]
            ]
        , case price.lastUpdated of
            Just timestamp -> HH.div
                               [ HP.class_ $ HH.ClassName "timestamp" ]
                               [ HH.text timestamp ]
            Nothing -> HH.text ""
        ]
    
    changeClass change =
      if change > 0.0 then "positive"
      else if change < 0.0 then "negative"
      else "neutral"
    
    formatNumber n = show n  -- TODO: Proper number formatting
    
    formatChange change percent =
      let prefix = if change > 0.0 then "+" else ""
      in prefix <> formatNumber change <> " (" <> prefix <> formatNumber percent <> "%)"

handleAction :: forall o m. MonadAff m => Action -> H.HalogenM State Action () o m Unit
handleAction = case _ of
  Initialize -> do
    -- Create WebSocket client
    wsClient <- liftEffect $ WS.createWebSocketClient
      { url: "ws://localhost:8081"
      , reconnectDelay: WS.Milliseconds 3000.0
      , maxReconnectAttempts: 5
      , heartbeatInterval: WS.Milliseconds 30000.0
      }
    
    -- Set up event handlers
    liftEffect $ WS.onPriceUpdate wsClient $ \price timestamp ->
      -- This will be called from Effect, need to raise action
      pure unit  -- TODO: Need to use subscriptions to raise actions
    
    H.modify_ _ { wsClient = Just wsClient }
  
  Connect -> do
    state <- H.get
    case state.wsClient of
      Nothing -> pure unit
      Just client -> do
        liftEffect $ WS.connect client
        
        -- Set up handlers that can raise actions
        liftEffect $ WS.onPriceUpdate client $ \price timestamp ->
          -- TODO: Need event emitter to raise actions from Effect
          pure unit
        
        H.modify_ _ { connected = true }
  
  Disconnect -> do
    state <- H.get
    case state.wsClient of
      Nothing -> pure unit
      Just client -> do
        liftEffect $ WS.disconnect client
        H.modify_ _ { connected = false, subscriptions = [] }
  
  Subscribe target -> do
    state <- H.get
    case state.wsClient of
      Nothing -> pure unit
      Just client -> do
        liftEffect $ WS.subscribe client target
        H.modify_ \s -> s { subscriptions = target : s.subscriptions }
  
  Unsubscribe target -> do
    state <- H.get
    case state.wsClient of
      Nothing -> pure unit
      Just client -> do
        liftEffect $ WS.unsubscribe client target
        H.modify_ \s -> s { subscriptions = filter (_ /= target) s.subscriptions }
  
  HandlePriceUpdate price timestamp -> do
    H.modify_ \s -> s
      { prices = take s.maxPrices (price : s.prices) }
  
  HandleBulkPriceUpdate newPrices timestamp -> do
    H.modify_ \s -> s
      { prices = take s.maxPrices (newPrices <> s.prices) }
  
  HandleConnectionStatus connected ->
    H.modify_ _ { connected = connected }

-- Helper functions
elem :: forall a. Eq a => a -> Array a -> Boolean
elem x = any (_ == x)

any :: forall a. (a -> Boolean) -> Array a -> Boolean
any pred = foldr (\x acc -> pred x || acc) false

take :: forall a. Int -> Array a -> Array a
take n xs = go n xs []
  where
    go 0 _ acc = reverse acc
    go _ [] acc = reverse acc
    go m (y:ys) acc = go (m - 1) ys (y : acc)

reverse :: forall a. Array a -> Array a
reverse = foldr (\x acc -> acc <> [x]) []

filter :: forall a. (a -> Boolean) -> Array a -> Array a
filter pred = foldr (\x acc -> if pred x then x : acc else acc) []

null :: forall a. Array a -> Boolean
null [] = true
null _ = false