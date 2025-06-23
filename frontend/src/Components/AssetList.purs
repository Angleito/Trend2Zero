module Components.AssetList where

import Prelude
import Data.Array ((:))
import Data.Maybe (Maybe(..), fromMaybe, maybe)
import Data.Number.Format (fixed, toStringWith)
import Data.String (toUpper)
import Halogen as H
import Halogen.HTML as HH
import Halogen.HTML.Properties as HP
import Type.Proxy (Proxy(..))

-- Type definitions
type MarketAsset =
  { symbol :: String
  , name :: String
  , price :: Maybe Number
  , priceInUSD :: Maybe Number
  , change :: Number
  , type :: Maybe String
  }

-- Component types
type Input = { assets :: Array MarketAsset }
type State = { assets :: Array MarketAsset }
data Action = ReceiveInput Input

-- Component slot
type Slot = H.Slot Query Void
data Query a = IsOn (Boolean -> a)

-- Component definition
component :: forall q o m. H.Component q Input o m
component = H.mkComponent
  { initialState
  , render
  , eval: H.mkEval $ H.defaultEval
      { handleAction = handleAction
      , receive = Just <<< ReceiveInput
      }
  }

initialState :: Input -> State
initialState input = { assets: input.assets }

render :: forall m. State -> H.ComponentHTML Action () m
render state =
  HH.div [ HP.class_ $ HH.ClassName "w-full max-w-4xl" ]
    [ HH.h1 [ HP.class_ $ HH.ClassName "text-3xl font-bold mb-8" ]
        [ HH.text "Market Overview" ]
    , HH.div [ HP.class_ $ HH.ClassName "bg-white rounded-lg shadow overflow-hidden" ]
        [ HH.table [ HP.class_ $ HH.ClassName "min-w-full divide-y divide-gray-200" ]
            [ renderTableHeader
            , renderTableBody state.assets
            ]
        ]
    ]

renderTableHeader :: forall w i. HH.HTML w i
renderTableHeader =
  HH.thead [ HP.class_ $ HH.ClassName "bg-gray-50" ]
    [ HH.tr_
        [ renderHeaderCell "Asset"
        , renderHeaderCell "Price"
        , renderHeaderCell "24h Change"
        , renderHeaderCell "Type"
        ]
    ]

renderHeaderCell :: forall w i. String -> HH.HTML w i
renderHeaderCell text =
  HH.th [ HP.class_ $ HH.ClassName "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" ]
    [ HH.text text ]

renderTableBody :: forall w. Array MarketAsset -> HH.HTML w Action
renderTableBody assets =
  HH.tbody [ HP.class_ $ HH.ClassName "bg-white divide-y divide-gray-200" ]
    (map renderAssetRow assets)

renderAssetRow :: forall w. MarketAsset -> HH.HTML w Action
renderAssetRow asset =
  HH.tr [ HP.class_ $ HH.ClassName "hover:bg-gray-50" ]
    [ renderAssetCell asset
    , renderPriceCell asset
    , renderChangeCell asset
    , renderTypeCell asset
    ]

renderAssetCell :: forall w i. MarketAsset -> HH.HTML w i
renderAssetCell asset =
  HH.td [ HP.class_ $ HH.ClassName "px-6 py-4 whitespace-nowrap" ]
    [ HH.div [ HP.class_ $ HH.ClassName "flex items-center" ]
        [ HH.div_
            [ HH.div [ HP.class_ $ HH.ClassName "text-sm font-medium text-gray-900" ]
                [ HH.text asset.name ]
            , HH.div [ HP.class_ $ HH.ClassName "text-sm text-gray-500" ]
                [ HH.text $ toUpper asset.symbol ]
            ]
        ]
    ]

renderPriceCell :: forall w i. MarketAsset -> HH.HTML w i
renderPriceCell asset =
  HH.td [ HP.class_ $ HH.ClassName "px-6 py-4 whitespace-nowrap" ]
    [ HH.div [ HP.class_ $ HH.ClassName "text-sm text-gray-900" ]
        [ HH.text $ "$" <> formatPrice asset ]
    ]

formatPrice :: MarketAsset -> String
formatPrice asset =
  case asset.priceInUSD of
    Just p -> formatNumber p
    Nothing -> case asset.price of
      Just p -> formatNumber p
      Nothing -> "0.00"

formatNumber :: Number -> String
formatNumber n = toStringWith (fixed 2) n

renderChangeCell :: forall w i. MarketAsset -> HH.HTML w i
renderChangeCell asset =
  HH.td [ HP.class_ $ HH.ClassName "px-6 py-4 whitespace-nowrap" ]
    [ HH.span
        [ HP.class_ $ HH.ClassName $
            "inline-flex text-sm " <>
            if asset.change >= 0.0 then "text-green-600" else "text-red-600"
        ]
        [ HH.text $ formatChange asset.change ]
    ]

formatChange :: Number -> String
formatChange change =
  (if change >= 0.0 then "+" else "") <> toStringWith (fixed 2) change <> "%"

renderTypeCell :: forall w i. MarketAsset -> HH.HTML w i
renderTypeCell asset =
  HH.td [ HP.class_ $ HH.ClassName "px-6 py-4 whitespace-nowrap text-sm text-gray-500" ]
    [ HH.text $ fromMaybe "" asset.type ]

handleAction :: forall o m. Action -> H.HalogenM State Action () o m Unit
handleAction = case _ of
  ReceiveInput input -> H.modify_ \_ -> { assets: input.assets }