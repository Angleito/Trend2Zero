{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE TupleSections #-}

module WebSocket.Server
  ( runWebSocketServer
  , WebSocketConfig(..)
  , ServerState
  , initServerState
  , broadcastPriceUpdate
  , broadcastNotification
  ) where

import Control.Concurrent (forkIO, threadDelay)
import Control.Concurrent.Async (async, race_, cancel)
import Control.Concurrent.STM
import Control.Exception (catch, finally, SomeException, throwIO)
import Control.Monad (forever, forM_, when, void, filterM)
import Data.Aeson (encode, decode, eitherDecode)
import qualified Data.ByteString.Lazy as LBS
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.IO as TIO
import Data.Time (getCurrentTime, diffUTCTime)
import Data.UUID (UUID)
import Data.UUID.V4 (nextRandom)
import qualified Data.Map.Strict as Map
import Network.WebSockets
import System.Timeout (timeout)

import WebSocket.Types
import Types (AssetPrice, AssetCategory)

-- Configuration
data WebSocketConfig = WebSocketConfig
  { wscHost :: String
  , wscPort :: Int
  , wscHeartbeatInterval :: Int  -- seconds
  , wscClientTimeout :: Int      -- seconds
  } deriving (Show, Eq)

-- Server state using STM for thread-safe operations
data ServerState = ServerState
  { ssClients :: TVar (Map.Map Text Client)
  , ssBroadcastChannel :: TChan BroadcastMessage
  , ssConfig :: WebSocketConfig
  }

-- Client representation
data Client = Client
  { cConnection :: Connection
  , cState :: TVar ClientState
  , cSendChannel :: TChan WSMessage
  }

-- Initialize server state
initServerState :: WebSocketConfig -> IO ServerState
initServerState config = do
  clients <- newTVarIO Map.empty
  broadcastChan <- newBroadcastTChanIO
  return ServerState
    { ssClients = clients
    , ssBroadcastChannel = broadcastChan
    , ssConfig = config
    }

-- Main WebSocket server
runWebSocketServer :: WebSocketConfig -> ServerState -> IO ()
runWebSocketServer config@WebSocketConfig{..} state = do
  putStrLn $ "Starting WebSocket server on " ++ wscHost ++ ":" ++ show wscPort
  
  -- Start the broadcast dispatcher
  _ <- forkIO $ broadcastDispatcher state
  
  -- Start the WebSocket server
  runServer wscHost wscPort $ \pending -> do
    conn <- acceptRequest pending
    
    -- Generate unique client ID
    clientId <- T.pack . show <$> nextRandom
    now <- getCurrentTime
    
    -- Create client state
    clientStateTVar <- newTVarIO ClientState
      { csClientId = clientId
      , csSubscriptions = []
      , csConnectedAt = now
      , csLastHeartbeat = now
      }
    
    -- Create send channel for this client
    sendChan <- newTChanIO
    
    let client = Client
          { cConnection = conn
          , cState = clientStateTVar
          , cSendChannel = sendChan
          }
    
    -- Register client
    atomically $ do
      clients <- readTVar (ssClients state)
      writeTVar (ssClients state) $ Map.insert clientId client clients
    
    -- Send connection acknowledgment
    sendMessage client $ mkConnectionAck clientId now
    
    putStrLn $ "Client connected: " ++ T.unpack clientId
    
    -- Handle client connection
    race_
      (handleClient state clientId client)
      (clientSender client)
      `finally` do
        -- Cleanup on disconnect
        atomically $ do
          clients <- readTVar (ssClients state)
          writeTVar (ssClients state) $ Map.delete clientId clients
        putStrLn $ "Client disconnected: " ++ T.unpack clientId

-- Handle incoming messages from a client
handleClient :: ServerState -> Text -> Client -> IO ()
handleClient state clientId client@Client{..} = do
  -- Start heartbeat sender
  heartbeatAsync <- async $ heartbeatSender (ssConfig state) client
  
  -- Handle messages
  finally
    (forever $ do
      -- Read message with timeout
      mMsg <- timeout (wscClientTimeout (ssConfig state) * 1000000) $
        receiveData cConnection
      
      case mMsg of
        Nothing -> throwIO ConnectionClosed  -- Timeout
        Just msgData -> case eitherDecode msgData of
          Left err -> do
            putStrLn $ "Parse error from " ++ T.unpack clientId ++ ": " ++ err
            sendMessage client $ mkError errorInvalidMessage "Invalid message format"
          
          Right msg -> handleMessage state client msg)
    (cancel heartbeatAsync)

-- Handle specific message types
handleMessage :: ServerState -> Client -> WSMessage -> IO ()
handleMessage state client@Client{..} = \case
  WSSubscribe target -> do
    putStrLn $ "Client subscribing to: " ++ show target
    atomically $ do
      clientState <- readTVar cState
      let newSubs = target : csSubscriptions clientState
      writeTVar cState $ clientState { csSubscriptions = newSubs }
    
  WSUnsubscribe target -> do
    putStrLn $ "Client unsubscribing from: " ++ show target
    atomically $ do
      clientState <- readTVar cState
      let newSubs = filter (/= target) (csSubscriptions clientState)
      writeTVar cState $ clientState { csSubscriptions = newSubs }
    
  WSHeartbeat timestamp -> do
    -- Update last heartbeat time
    atomically $ do
      clientState <- readTVar cState
      writeTVar cState $ clientState { csLastHeartbeat = timestamp }
    
  _ -> do
    -- Other message types are not expected from clients
    sendMessage client $ mkError errorInvalidMessage "Unexpected message type"

-- Send messages to client
clientSender :: Client -> IO ()
clientSender Client{..} = forever $ do
  msg <- atomically $ readTChan cSendChannel
  sendTextData cConnection (encode msg)
    `catch` \(e :: SomeException) -> do
      putStrLn $ "Error sending to client: " ++ show e
      throwIO e

-- Send a message to a specific client
sendMessage :: Client -> WSMessage -> IO ()
sendMessage Client{..} msg = atomically $ writeTChan cSendChannel msg

-- Heartbeat sender
heartbeatSender :: WebSocketConfig -> Client -> IO ()
heartbeatSender WebSocketConfig{..} client = forever $ do
  threadDelay (wscHeartbeatInterval * 1000000)
  now <- getCurrentTime
  sendMessage client $ mkHeartbeat now

-- Broadcast dispatcher
broadcastDispatcher :: ServerState -> IO ()
broadcastDispatcher ServerState{..} = forever $ do
  -- Read from broadcast channel
  msg <- atomically $ readTChan ssBroadcastChannel
  
  -- Get all clients
  clients <- atomically $ readTVar ssClients
  
  -- Process broadcast based on type
  case msg of
    BroadcastPrice asset -> do
      now <- getCurrentTime
      let wsMsg = mkPriceUpdate asset now
      
      -- Send to clients subscribed to this asset
      forM_ (Map.toList clients) $ \(_, client) -> do
        shouldSend <- isSubscribedToAsset client asset
        when shouldSend $ sendMessage client wsMsg
    
    BroadcastPrices assets -> do
      now <- getCurrentTime
      let wsMsg = mkBulkPriceUpdate assets now
      
      -- Send to clients subscribed to any of these assets
      forM_ (Map.toList clients) $ \(_, client) -> do
        shouldSend <- isSubscribedToAnyAsset client assets
        when shouldSend $ sendMessage client wsMsg
    
    BroadcastNotification nType title message mData -> do
      now <- getCurrentTime
      let wsMsg = mkNotification nType title message mData now
      
      -- Send to all clients (or filter based on notification type)
      forM_ (Map.elems clients) $ \client ->
        sendMessage client wsMsg

-- Check if client is subscribed to a specific asset
isSubscribedToAsset :: Client -> AssetPrice -> IO Bool
isSubscribedToAsset Client{..} asset = do
  clientState <- atomically $ readTVar cState
  return $ any (matchesAsset asset) (csSubscriptions clientState)

-- Check if client is subscribed to any of the assets
isSubscribedToAnyAsset :: Client -> [AssetPrice] -> IO Bool
isSubscribedToAnyAsset client assets = do
  results <- mapM (isSubscribedToAsset client) assets
  return $ or results

-- Check if subscription target matches an asset
matchesAsset :: AssetPrice -> SubscriptionTarget -> Bool
matchesAsset asset = \case
  AllPrices -> True
  SpecificAsset symbol -> apSymbol asset == symbol
  CategoryPrices _ -> True  -- Would need category info in AssetPrice
  UserNotifications _ -> False

-- Public API functions for broadcasting

-- Broadcast a single price update
broadcastPriceUpdate :: ServerState -> AssetPrice -> IO ()
broadcastPriceUpdate ServerState{..} asset = 
  atomically $ writeTChan ssBroadcastChannel (BroadcastPrice asset)

-- Broadcast multiple price updates
broadcastPriceUpdates :: ServerState -> [AssetPrice] -> IO ()
broadcastPriceUpdates ServerState{..} assets = 
  atomically $ writeTChan ssBroadcastChannel (BroadcastPrices assets)

-- Broadcast a notification
broadcastNotification :: ServerState -> NotificationType -> Text -> Text -> Maybe Value -> IO ()
broadcastNotification ServerState{..} nType title message mData =
  atomically $ writeTChan ssBroadcastChannel (BroadcastNotification nType title message mData)

-- Utility function to get connected client count
getConnectedClientCount :: ServerState -> IO Int
getConnectedClientCount ServerState{..} = do
  clients <- atomically $ readTVar ssClients
  return $ Map.size clients

-- Utility function to cleanup stale connections
cleanupStaleConnections :: ServerState -> IO ()
cleanupStaleConnections state@ServerState{..} = do
  now <- getCurrentTime
  clients <- atomically $ readTVar ssClients
  
  -- Check each client
  staleClients <- filterM (isStale now) (Map.toList clients)
  
  -- Remove stale clients
  forM_ staleClients $ \(clientId, _) -> do
    atomically $ do
      currentClients <- readTVar ssClients
      writeTVar ssClients $ Map.delete clientId currentClients
    putStrLn $ "Removed stale client: " ++ T.unpack clientId
  
  where
    isStale now (_, Client{..}) = do
      clientState <- atomically $ readTVar cState
      let timeSinceHeartbeat = diffUTCTime now (csLastHeartbeat clientState)
      return $ timeSinceHeartbeat > fromIntegral (wscClientTimeout ssConfig)