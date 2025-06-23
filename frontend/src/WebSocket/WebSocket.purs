-- WebSocket FFI for PureScript
module WebSocket.WebSocket
  ( WebSocket
  , ReadyState(..)
  , newWebSocket
  , close
  , send
  , readyState
  , url
  , onOpen
  , onClose
  , onMessage
  , onError
  ) where

import Prelude

import Effect (Effect)
import Web.Event.Event (Event)

-- Foreign WebSocket type
foreign import data WebSocket :: Type

-- ReadyState enum
data ReadyState
  = Connecting
  | Open
  | Closing
  | Closed

derive instance eqReadyState :: Eq ReadyState
derive instance ordReadyState :: Ord ReadyState

instance showReadyState :: Show ReadyState where
  show Connecting = "Connecting"
  show Open = "Open"
  show Closing = "Closing"
  show Closed = "Closed"

-- Foreign imports
foreign import _newWebSocket :: String -> Effect WebSocket
foreign import _close :: WebSocket -> Effect Unit
foreign import _send :: WebSocket -> String -> Effect Unit
foreign import _readyState :: WebSocket -> Effect Int
foreign import _url :: WebSocket -> Effect String
foreign import _onOpen :: WebSocket -> (Event -> Effect Unit) -> Effect Unit
foreign import _onClose :: WebSocket -> (Event -> Effect Unit) -> Effect Unit
foreign import _onMessage :: WebSocket -> (String -> Effect Unit) -> Effect Unit
foreign import _onError :: WebSocket -> (Event -> Effect Unit) -> Effect Unit

-- ReadyState constants
foreign import connectingState :: Int
foreign import openState :: Int
foreign import closingState :: Int
foreign import closedState :: Int

-- Public API
newWebSocket :: String -> Effect WebSocket
newWebSocket = _newWebSocket

close :: WebSocket -> Effect Unit
close = _close

send :: WebSocket -> String -> Effect Unit
send = _send

url :: WebSocket -> Effect String
url = _url

readyState :: WebSocket -> Effect ReadyState
readyState socket = do
  state <- _readyState socket
  pure $ case state of
    _ | state == connectingState -> Connecting
      | state == openState -> Open
      | state == closingState -> Closing
      | otherwise -> Closed

onOpen :: WebSocket -> (Event -> Effect Unit) -> Effect Unit
onOpen = _onOpen

onClose :: WebSocket -> (Event -> Effect Unit) -> Effect Unit
onClose = _onClose

onMessage :: WebSocket -> (String -> Effect Unit) -> Effect Unit
onMessage = _onMessage

onError :: WebSocket -> (Event -> Effect Unit) -> Effect Unit
onError = _onError