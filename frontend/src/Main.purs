module Main where

import Prelude

import Components.LivePriceDisplay as LivePrice
import Effect (Effect)
import Effect.Aff (launchAff_)
import Halogen as H
import Halogen.Aff as HA
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Halogen.VDom.Driver (runUI)
import Type.Proxy (Proxy(..))

-- Component slots
type Slots = ( livePrice :: forall query. H.Slot query Void Unit )

_livePrice = Proxy :: Proxy "livePrice"

-- Main component state
type State = 
  { message :: String
  , showLivePrices :: Boolean
  }

data Action 
  = ToggleLivePrices

-- Main component definition
component :: forall query input output m. MonadAff m => H.Component query input output m
component =
  H.mkComponent
    { initialState
    , render
    , eval: H.mkEval H.defaultEval { handleAction = handleAction }
    }
  where
  initialState :: input -> State
  initialState _ = 
    { message: "Welcome to Trend2Zero"
    , showLivePrices: false
    }

  render :: State -> H.ComponentHTML Action Slots m
  render state =
    HH.div
      [ HP.class_ $ HH.ClassName "container" ]
      [ HH.header
          [ HP.class_ $ HH.ClassName "header" ]
          [ HH.h1 [] [ HH.text state.message ]
          , HH.p [] [ HH.text "Real-time Market Data Platform" ]
          ]
      
      , HH.main
          [ HP.class_ $ HH.ClassName "main-content" ]
          [ HH.div
              [ HP.class_ $ HH.ClassName "controls" ]
              [ HH.button
                  [ HP.class_ $ HH.ClassName "btn btn-primary"
                  , HE.onClick $ \_ -> ToggleLivePrices
                  ]
                  [ HH.text $ if state.showLivePrices 
                      then "Hide Live Prices" 
                      else "Show Live Prices"
                  ]
              ]
          
          , if state.showLivePrices
              then HH.div
                     [ HP.class_ $ HH.ClassName "live-price-container" ]
                     [ HH.slot_ _livePrice unit LivePrice.component unit ]
              else HH.div
                     [ HP.class_ $ HH.ClassName "placeholder" ]
                     [ HH.p [] 
                         [ HH.text "Click 'Show Live Prices' to see real-time market data via WebSocket" ]
                     ]
          ]
      
      , HH.footer
          [ HP.class_ $ HH.ClassName "footer" ]
          [ HH.p [] 
              [ HH.text "Powered by PureScript + Halogen + WebSockets" ]
          ]
      ]

  handleAction :: Action -> H.HalogenM State Action Slots output m Unit
  handleAction = case _ of
    ToggleLivePrices -> 
      H.modify_ \st -> st { showLivePrices = not st.showLivePrices }

-- Main entry point
main :: Effect Unit
main = HA.runHalogenAff do
  body <- HA.awaitBody
  runUI component unit body

-- CSS styles that should be added to your stylesheet:
{-
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.main-content {
  min-height: 500px;
}

.controls {
  margin-bottom: 20px;
  text-align: center;
}

.live-price-container {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}

.placeholder {
  text-align: center;
  padding: 50px;
  color: #666;
}

.footer {
  margin-top: 50px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.connection-status {
  margin-bottom: 20px;
}

.status {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
}

.status.connected {
  background: #28a745;
  color: white;
}

.status.disconnected {
  background: #dc3545;
  color: white;
}

.subscription-controls {
  margin-bottom: 20px;
}

.subscription-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.price-feed {
  max-height: 400px;
  overflow-y: auto;
}

.price-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.price-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 5px;
}

.symbol {
  font-weight: bold;
  font-size: 18px;
}

.name {
  margin-left: 10px;
  color: #666;
  font-size: 14px;
}

.price-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 20px;
  font-weight: bold;
}

.change.positive {
  color: #28a745;
}

.change.negative {
  color: #dc3545;
}

.change.neutral {
  color: #666;
}

.timestamp {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
-}