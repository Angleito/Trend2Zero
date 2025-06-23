module Components.MarketOverview where

import Prelude

import Affjax as AX
import Affjax.ResponseFormat as ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut (decodeJson, printJsonDecodeError)
import Data.Array ((:))
import Data.DateTime (DateTime)
import Data.Either (Either(..))
import Data.Maybe (Maybe(..), fromMaybe, isNothing)
import Data.Number.Format (fixed, toStringWith)
import Data.String (Pattern(..), Replacement(..), replaceAll, toUpper)
import Data.Time.Duration (Minutes(..))
import Effect.Aff (Aff)
import Effect.Aff as Aff
import Effect.Aff.Class (class MonadAff)
import Effect.Console (log)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Events as HE
import Halogen.HTML.Properties as HP
import Halogen.Subscription as HS
import Type.Proxy (Proxy(..))
import Web.HTML (window)
import Web.HTML.HTMLDocument as HTMLDocument
import Web.HTML.Window as Window

-- Type definitions
type Index =
  { name :: String
  , value :: Number
  , change :: Number
  }

type TopMover =
  { symbol :: String
  , name :: String
  , price :: Number
  , change :: Number
  , changePercent :: Number
  }

type MarketOverviewData =
  { marketStatus :: String
  , marketSummary :: Maybe String
  , indices :: Array Index
  , topMovers :: Array TopMover
  , lastUpdated :: String
  }

-- Component types
type Input = Unit
type State =
  { overview :: Maybe MarketOverviewData
  , loading :: Boolean
  , error :: Maybe String
  , mounted :: Boolean
  }

data Action
  = Initialize
  | FetchData
  | HandleFetchResponse (Either String MarketOverviewData)
  | Tick

-- Component definition
component :: forall q o m. MonadAff m => H.Component q Input o m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , initialize = Just Initialize
      }
  }

initialState :: Input -> State
initialState _ =
  { overview: Nothing
  , loading: true
  , error: Nothing
  , mounted: false
  }

render :: forall m. State -> H.ComponentHTML Action () m
render state
  | not state.mounted = HH.text ""
  | state.loading = HH.div [ HP.class_ $ HH.ClassName "loading" ] [ HH.text "Loading market data..." ]
  | isNothing state.overview && isNothing state.error = 
      HH.div [ HP.class_ $ HH.ClassName "not-found" ] [ HH.text "Market overview not found" ]
  | otherwise = case state.error of
      Just err -> HH.div [ HP.class_ $ HH.ClassName "error" ] [ HH.text err ]
      Nothing -> case state.overview of
        Nothing -> HH.text ""
        Just overview -> renderOverview overview

renderOverview :: forall w. MarketOverviewData -> HH.HTML w Action
renderOverview overview =
  HH.div [ HP.class_ $ HH.ClassName "market-overview bg-gray-900 border border-gray-800 rounded-lg p-6" ]
    [ renderHeader overview
    , renderSummary overview.marketSummary
    , renderIndices overview.indices
    , renderTopMovers overview.topMovers
    , renderLastUpdated overview.lastUpdated
    ]

renderHeader :: forall w i. MarketOverviewData -> HH.HTML w i
renderHeader overview =
  HH.div [ HP.class_ $ HH.ClassName "flex justify-between items-center mb-6" ]
    [ HH.h2 [ HP.class_ $ HH.ClassName "text-2xl font-bold" ] [ HH.text "Market Overview" ]
    , HH.div 
        [ HP.class_ $ HH.ClassName $ statusColorClass overview.marketStatus <> " font-semibold" ]
        [ HH.text $ "Market " <> replaceAll (Pattern "-") (Replacement " ") overview.marketStatus ]
    ]

statusColorClass :: String -> String
statusColorClass status = case status of
  "open" -> "text-green-500"
  "closed" -> "text-red-500"
  _ -> "text-yellow-500"

renderSummary :: forall w i. Maybe String -> HH.HTML w i
renderSummary summary = case summary of
  Nothing -> HH.text ""
  Just s -> HH.div [ HP.class_ $ HH.ClassName "mb-6 text-gray-300" ] [ HH.text s ]

renderIndices :: forall w i. Array Index -> HH.HTML w i
renderIndices indices =
  HH.div [ HP.class_ $ HH.ClassName "mb-6" ]
    [ HH.h3 [ HP.class_ $ HH.ClassName "text-xl font-semibold mb-3" ] [ HH.text "Indices" ]
    , HH.div [ HP.class_ $ HH.ClassName "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" ]
        (map renderIndex indices)
    ]

renderIndex :: forall w i. Index -> HH.HTML w i
renderIndex index =
  let changeClass = if index.change >= 0.0 then "text-green-500" else "text-red-500"
  in HH.div [ HP.class_ $ HH.ClassName "bg-gray-800 p-4 rounded" ]
       [ HH.div [ HP.class_ $ HH.ClassName "font-medium" ] [ HH.text index.name ]
       , HH.div [ HP.class_ $ HH.ClassName "text-lg" ] [ HH.text $ toStringWith (fixed 2) index.value ]
       , HH.div [ HP.class_ $ HH.ClassName changeClass ]
           [ HH.text $ formatChange index.change ]
       ]

renderTopMovers :: forall w i. Array TopMover -> HH.HTML w i
renderTopMovers movers =
  HH.div_
    [ HH.h3 [ HP.class_ $ HH.ClassName "text-xl font-semibold mb-3" ] [ HH.text "Top Movers" ]
    , HH.div [ HP.class_ $ HH.ClassName "grid gap-3" ]
        (map renderMover movers)
    ]

renderMover :: forall w i. TopMover -> HH.HTML w i
renderMover mover =
  let changeClass = if mover.change >= 0.0 then "text-green-500" else "text-red-500"
  in HH.div [ HP.class_ $ HH.ClassName "flex justify-between items-center border-b border-gray-800 pb-2" ]
       [ HH.div_
           [ HH.a 
               [ HP.href $ "/asset/" <> mover.symbol
               , HP.class_ $ HH.ClassName "font-medium hover:text-[#FF9500]"
               ]
               [ HH.text $ mover.name <> " (" <> mover.symbol <> ")" ]
           ]
       , HH.div [ HP.class_ $ HH.ClassName "text-right" ]
           [ HH.div_ [ HH.text $ "$" <> toStringWith (fixed 2) mover.price ]
           , HH.div [ HP.class_ $ HH.ClassName changeClass ]
               [ HH.text $ formatChange mover.change <> " (" <> toStringWith (fixed 2) mover.changePercent <> "%)" ]
           ]
       ]

renderLastUpdated :: forall w i. String -> HH.HTML w i
renderLastUpdated lastUpdated =
  HH.div [ HP.class_ $ HH.ClassName "mt-4 text-sm text-gray-400" ]
    [ HH.text $ "Last updated: " <> lastUpdated ]

formatChange :: Number -> String
formatChange change =
  (if change >= 0.0 then "+" else "") <> toStringWith (fixed 2) change

handleAction :: forall o m. MonadAff m => Action -> H.HalogenM State Action () o m Unit
handleAction = case _ of
  Initialize -> do
    H.modify_ _ { mounted = true }
    handleAction FetchData
    -- Set up timer subscription for refreshing data every 5 minutes
    { emitter, listener } <- H.liftEffect HS.create
    _ <- H.subscribe emitter
    void $ H.liftAff $ Aff.forkAff $ forever do
      Aff.delay $ Aff.Milliseconds 300000.0 -- 5 minutes
      H.liftEffect $ HS.notify listener Tick
    
  FetchData -> do
    H.modify_ _ { loading = true }
    H.liftEffect $ log "[MarketOverview] Attempting to fetch market data..."
    response <- H.liftAff fetchMarketData
    H.liftEffect $ log "[MarketOverview] Fetch attempt completed."
    handleAction $ HandleFetchResponse response
    
  HandleFetchResponse response -> case response of
    Left err -> do
      H.liftEffect $ log $ "[MarketOverview] Error during fetch: " <> err
      H.modify_ _ { loading = false, error = Just err, overview = Nothing }
    Right overview -> do
      H.modify_ _ { loading = false, error = Nothing, overview = Just overview }
      
  Tick -> handleAction FetchData

fetchMarketData :: Aff (Either String MarketOverviewData)
fetchMarketData = do
  result <- AX.get ResponseFormat.json "/api/market-data/overview"
  pure $ case result of
    Left err -> Left $ "Network error: " <> AX.printError err
    Right response -> 
      if response.status == StatusCode 200
        then case decodeJson response.body of
          Left err -> Left $ "JSON decode error: " <> printJsonDecodeError err
          Right overview -> Right overview
        else Left $ "Server error: " <> show response.status

-- Helper function for infinite loops
forever :: forall m a. Monad m => m a -> m Unit
forever ma = ma *> forever ma