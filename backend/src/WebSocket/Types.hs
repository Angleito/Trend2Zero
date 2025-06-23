{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE TemplateHaskell #-}

module WebSocket.Types where

import Data.Aeson
import Data.Aeson.TH
import Data.Text (Text)
import Data.Time (UTCTime)
import GHC.Generics
import Types (AssetPrice, MarketAsset, AssetCategory)

-- WebSocket Message Types
data WSMessageType
  = Subscribe
  | Unsubscribe
  | PriceUpdate
  | Notification
  | Heartbeat
  | Error
  | ConnectionAck
  deriving (Show, Eq, Generic)

instance ToJSON WSMessageType where
  toJSON Subscribe = String "subscribe"
  toJSON Unsubscribe = String "unsubscribe"
  toJSON PriceUpdate = String "price_update"
  toJSON Notification = String "notification"
  toJSON Heartbeat = String "heartbeat"
  toJSON Error = String "error"
  toJSON ConnectionAck = String "connection_ack"

instance FromJSON WSMessageType where
  parseJSON = withText "WSMessageType" $ \case
    "subscribe" -> pure Subscribe
    "unsubscribe" -> pure Unsubscribe
    "price_update" -> pure PriceUpdate
    "notification" -> pure Notification
    "heartbeat" -> pure Heartbeat
    "error" -> pure Error
    "connection_ack" -> pure ConnectionAck
    _ -> fail "Invalid message type"

-- Subscription targets
data SubscriptionTarget
  = AllPrices
  | CategoryPrices AssetCategory
  | SpecificAsset Text
  | UserNotifications Text -- User ID
  deriving (Show, Eq, Generic)

instance ToJSON SubscriptionTarget where
  toJSON AllPrices = object ["type" .= ("all" :: Text)]
  toJSON (CategoryPrices cat) = object ["type" .= ("category" :: Text), "category" .= cat]
  toJSON (SpecificAsset symbol) = object ["type" .= ("asset" :: Text), "symbol" .= symbol]
  toJSON (UserNotifications userId) = object ["type" .= ("user" :: Text), "userId" .= userId]

instance FromJSON SubscriptionTarget where
  parseJSON = withObject "SubscriptionTarget" $ \v -> do
    targetType <- v .: "type" :: Parser Text
    case targetType of
      "all" -> pure AllPrices
      "category" -> CategoryPrices <$> v .: "category"
      "asset" -> SpecificAsset <$> v .: "symbol"
      "user" -> UserNotifications <$> v .: "userId"
      _ -> fail "Invalid subscription target type"

-- Notification types
data NotificationType
  = PriceAlert
  | SystemNotification
  | PortfolioUpdate
  | NewsAlert
  deriving (Show, Eq, Generic)

instance ToJSON NotificationType where
  toJSON PriceAlert = String "price_alert"
  toJSON SystemNotification = String "system"
  toJSON PortfolioUpdate = String "portfolio_update"
  toJSON NewsAlert = String "news_alert"

instance FromJSON NotificationType where
  parseJSON = withText "NotificationType" $ \case
    "price_alert" -> pure PriceAlert
    "system" -> pure SystemNotification
    "portfolio_update" -> pure PortfolioUpdate
    "news_alert" -> pure NewsAlert
    _ -> fail "Invalid notification type"

-- WebSocket Messages
data WSMessage
  = WSSubscribe
      { wsmTarget :: SubscriptionTarget
      }
  | WSUnsubscribe
      { wsmTarget :: SubscriptionTarget
      }
  | WSPriceUpdate
      { wsmAsset :: AssetPrice
      , wsmTimestamp :: UTCTime
      }
  | WSBulkPriceUpdate
      { wsmAssets :: [AssetPrice]
      , wsmTimestamp :: UTCTime
      }
  | WSNotification
      { wsmNotificationType :: NotificationType
      , wsmTitle :: Text
      , wsmMessage :: Text
      , wsmData :: Maybe Value
      , wsmTimestamp :: UTCTime
      }
  | WSHeartbeat
      { wsmTimestamp :: UTCTime
      }
  | WSError
      { wsmErrorCode :: Int
      , wsmErrorMessage :: Text
      }
  | WSConnectionAck
      { wsmClientId :: Text
      , wsmTimestamp :: UTCTime
      }
  deriving (Show, Eq, Generic)

-- Custom JSON encoding/decoding to include message type
instance ToJSON WSMessage where
  toJSON msg = case msg of
    WSSubscribe target ->
      object ["type" .= Subscribe, "target" .= target]
    WSUnsubscribe target ->
      object ["type" .= Unsubscribe, "target" .= target]
    WSPriceUpdate asset ts ->
      object ["type" .= PriceUpdate, "asset" .= asset, "timestamp" .= ts]
    WSBulkPriceUpdate assets ts ->
      object ["type" .= PriceUpdate, "assets" .= assets, "timestamp" .= ts, "bulk" .= True]
    WSNotification nType title message mData ts ->
      object [ "type" .= Notification
             , "notificationType" .= nType
             , "title" .= title
             , "message" .= message
             , "data" .= mData
             , "timestamp" .= ts
             ]
    WSHeartbeat ts ->
      object ["type" .= Heartbeat, "timestamp" .= ts]
    WSError code message ->
      object ["type" .= Error, "code" .= code, "message" .= message]
    WSConnectionAck clientId ts ->
      object ["type" .= ConnectionAck, "clientId" .= clientId, "timestamp" .= ts]

instance FromJSON WSMessage where
  parseJSON = withObject "WSMessage" $ \v -> do
    msgType <- v .: "type" :: Parser WSMessageType
    case msgType of
      Subscribe -> WSSubscribe <$> v .: "target"
      Unsubscribe -> WSUnsubscribe <$> v .: "target"
      PriceUpdate -> do
        isBulk <- v .:? "bulk" .!= False
        if isBulk
          then WSBulkPriceUpdate <$> v .: "assets" <*> v .: "timestamp"
          else WSPriceUpdate <$> v .: "asset" <*> v .: "timestamp"
      Notification -> WSNotification
        <$> v .: "notificationType"
        <*> v .: "title"
        <*> v .: "message"
        <*> v .:? "data"
        <*> v .: "timestamp"
      Heartbeat -> WSHeartbeat <$> v .: "timestamp"
      Error -> WSError <$> v .: "code" <*> v .: "message"
      ConnectionAck -> WSConnectionAck <$> v .: "clientId" <*> v .: "timestamp"

-- Client connection state
data ClientState = ClientState
  { csClientId :: Text
  , csSubscriptions :: [SubscriptionTarget]
  , csConnectedAt :: UTCTime
  , csLastHeartbeat :: UTCTime
  } deriving (Show, Eq, Generic)

-- Server broadcast message for internal use
data BroadcastMessage
  = BroadcastPrice AssetPrice
  | BroadcastPrices [AssetPrice]
  | BroadcastNotification NotificationType Text Text (Maybe Value)
  deriving (Show, Eq, Generic)

-- Utility functions for message construction
mkPriceUpdate :: AssetPrice -> UTCTime -> WSMessage
mkPriceUpdate asset timestamp = WSPriceUpdate asset timestamp

mkBulkPriceUpdate :: [AssetPrice] -> UTCTime -> WSMessage
mkBulkPriceUpdate assets timestamp = WSBulkPriceUpdate assets timestamp

mkNotification :: NotificationType -> Text -> Text -> Maybe Value -> UTCTime -> WSMessage
mkNotification nType title message mData timestamp = 
  WSNotification nType title message mData timestamp

mkError :: Int -> Text -> WSMessage
mkError code message = WSError code message

mkHeartbeat :: UTCTime -> WSMessage
mkHeartbeat = WSHeartbeat

mkConnectionAck :: Text -> UTCTime -> WSMessage
mkConnectionAck clientId timestamp = WSConnectionAck clientId timestamp

-- Error codes
errorInvalidMessage :: Int
errorInvalidMessage = 1001

errorUnauthorized :: Int
errorUnauthorized = 1002

errorSubscriptionFailed :: Int
errorSubscriptionFailed = 1003

errorInternalServer :: Int
errorInternalServer = 1004