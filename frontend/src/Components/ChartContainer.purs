module Components.ChartContainer
  ( component
  , Props
  , Theme(..)
  , ChartData
  ) where

import Prelude

import Data.Array as Array
import Data.Maybe (Maybe(..), fromMaybe, isJust)
import Data.Either (Either(..))
import Data.Int (toNumber)
import Data.Number (abs)
import Data.Nullable (Nullable)
import Data.DateTime (DateTime)
import Data.DateTime.Instant (fromDateTime, unInstant)
import Data.Time.Duration (Milliseconds(..))
import Data.JSDate as JSDate
import Effect (Effect)
import Effect.Aff (Aff, attempt, delay)
import Effect.Class (liftEffect)
import Effect.Random (random)
import React.Basic.DOM as R
import React.Basic.DOM.Events (handler_)
import React.Basic.Events (handler)
import React.Basic.Hooks as React
import React.Basic.Hooks (Hook, UseEffect, UseRef, UseState, (/\))
import React.Basic.Hooks as Hooks
import Web.HTML (HTMLElement)
import Web.HTML.HTMLElement as HTMLElement
import Web.DOM.Element as Element
import Web.Event.Event (EventType(..))
import Web.Event.EventTarget (addEventListener, eventListener, removeEventListener)
import Web.HTML.Window (innerWidth, innerHeight)
import Web.HTML (window, windowToEventTarget)
import Unsafe.Coerce (unsafeCoerce)

import Foreign.LightweightCharts as LC

-- Types
data Theme = Light | Dark

derive instance eqTheme :: Eq Theme

type ChartData =
  { time :: Number  -- timestamp in milliseconds
  , value :: Number
  }

type Props =
  { data :: Maybe (Array ChartData)
  , symbol :: Maybe String
  , theme :: Theme
  , days :: Int
  , width :: Number
  , height :: Number
  }

-- State types
data LoadingState
  = Loading
  | Loaded
  | Error String

derive instance eqLoadingState :: Eq LoadingState

-- Helper functions
themeToColors :: Theme -> { background :: String, text :: String, grid :: String }
themeToColors Light =
  { background: "#FFFFFF"
  , text: "#191919"
  , grid: "#E6E6E6"
  }
themeToColors Dark =
  { background: "#1E1E2D"
  , text: "#D9D9D9"
  , grid: "#2B2B43"
  }

generateSampleData :: String -> Int -> Effect (Array ChartData)
generateSampleData symbol days = do
  let basePrice = case symbol of
        "BTC" -> 60000.0
        "ETH" -> 3000.0
        "AAPL" -> 180.0
        "GOOGL" -> 125.0
        "XAU" -> 2000.0
        _ -> 100.0
  
  now <- JSDate.now  -- Current timestamp in milliseconds
  
  -- Generate data points
  Array.range 0 days # Array.reverse # traverse \i -> do
    randomFactor <- random
    let variation = 0.98 + (randomFactor * 0.04)  -- Between 0.98 and 1.02
    let price = basePrice * variation
    let timestamp = now - (toNumber i * 86400000.0)  -- Days to milliseconds
    pure { time: timestamp, value: price }

-- Component
component :: React.Component Props
component = React.component "ChartContainer" \props -> React.do
  -- State
  loadingState /\ setLoadingState <- Hooks.useState Loading
  chartData /\ setChartData <- Hooks.useState []
  
  -- Refs
  chartRef <- Hooks.useRef Nothing
  seriesRef <- Hooks.useRef Nothing
  containerRef <- Hooks.useRef Nothing
  
  -- Generate or process data
  Hooks.useEffect (props.data /\ props.symbol /\ props.days) $ do
    setLoadingState Loading
    
    case props.data of
      Just providedData -> do
        -- Use provided data
        setChartData providedData
        setLoadingState Loaded
      
      Nothing -> case props.symbol of
        Just sym -> do
          -- Generate sample data
          generated <- liftEffect $ generateSampleData sym props.days
          setChartData generated
          setLoadingState Loaded
        
        Nothing -> do
          -- No data and no symbol
          setLoadingState (Error "No data or symbol provided")
    
    pure Nothing
  
  -- Create chart
  Hooks.useEffect unit $ do
    maybeContainer <- Hooks.readRef containerRef
    maybeChart <- Hooks.readRef chartRef
    
    case maybeContainer, maybeChart, loadingState of
      Just container, Nothing, Loaded -> do
        let colors = themeToColors props.theme
        
        -- Create chart
        chart <- liftEffect $ LC.createChartWithOptions container
          { width: Just props.width
          , height: Just props.height
          , layout: Just
              { background: Just { type: LC.Solid, color: colors.background }
              , textColor: Just colors.text
              , fontSize: Nothing
              , fontFamily: Nothing
              }
          , grid: Just
              { vertLines: Just { color: colors.grid, style: Nothing, visible: Nothing }
              , horzLines: Just { color: colors.grid, style: Nothing, visible: Nothing }
              }
          , timeScale: Just
              { rightOffset: Nothing
              , barSpacing: Nothing
              , minBarSpacing: Nothing
              , fixLeftEdge: Nothing
              , fixRightEdge: Nothing
              , lockVisibleTimeRangeOnResize: Nothing
              , rightBarStaysOnScroll: Nothing
              , borderVisible: Nothing
              , borderColor: Just colors.grid
              , visible: Just true
              , timeVisible: Just true
              , secondsVisible: Just false
              }
          , rightPriceScale: Just
              { autoScale: Nothing
              , mode: Nothing
              , invertScale: Nothing
              , alignLabels: Nothing
              , borderVisible: Nothing
              , borderColor: Just colors.grid
              , scaleMargins: Nothing
              , visible: Just true
              }
          , leftPriceScale: Nothing
          , crosshair: Just
              { mode: Just LC.CMNormal
              , vertLine: Just
                  { color: Just (if props.theme == Dark then "rgba(255, 255, 255, 0.1)" else "rgba(0, 0, 0, 0.1)")
                  , width: Just 1.0
                  , style: Just LC.LSDashed
                  , visible: Nothing
                  , labelVisible: Nothing
                  }
              , horzLine: Just
                  { color: Just (if props.theme == Dark then "rgba(255, 255, 255, 0.1)" else "rgba(0, 0, 0, 0.1)")
                  , width: Just 1.0
                  , style: Just LC.LSDashed
                  , visible: Nothing
                  , labelVisible: Nothing
                  }
              }
          , handleScroll: Nothing
          , handleScale: Nothing
          }
        
        -- Add line series
        series <- liftEffect $ LC.addLineSeries chart
          { color: Just "#FF9500"
          , lineStyle: Nothing
          , lineWidth: Just 2.0
          , lineType: Nothing
          , lineVisible: Just true
          , pointMarkersVisible: Nothing
          , crosshairMarkerVisible: Just true
          , crosshairMarkerRadius: Nothing
          , crosshairMarkerBorderColor: Nothing
          , crosshairMarkerBackgroundColor: Nothing
          , lastValueVisible: Just true
          , priceLineVisible: Just true
          , priceLineWidth: Nothing
          , priceLineColor: Nothing
          , priceLineStyle: Nothing
          }
        
        -- Store references
        Hooks.writeRef chartRef (Just chart)
        Hooks.writeRef seriesRef (Just series)
        
        -- Cleanup
        pure $ Just $ do
          maybeChartToRemove <- Hooks.readRef chartRef
          case maybeChartToRemove of
            Just chartToRemove -> do
              liftEffect $ LC.removeChart chartToRemove
              Hooks.writeRef chartRef Nothing
              Hooks.writeRef seriesRef Nothing
            Nothing -> pure unit
      
      _, _, _ -> pure Nothing
  
  -- Update data when chart data changes
  Hooks.useEffect chartData $ do
    maybeSeries <- Hooks.readRef seriesRef
    maybeChart <- Hooks.readRef chartRef
    
    case maybeSeries, maybeChart, loadingState of
      Just series, Just chart, Loaded -> do
        -- Convert data to chart format
        let lineData = chartData # Array.map \point ->
              { time: unsafeCoerce (point.time / 1000.0) :: LC.Time
              , value: point.value
              }
        
        -- Update series data
        when (Array.length lineData > 0) $ do
          liftEffect $ LC.setData series lineData
          liftEffect $ LC.fitContent chart
      
      _, _, _ -> pure unit
    
    pure Nothing
  
  -- Render based on state
  pure $ case loadingState of
    Loading ->
      R.div
        { className: "flex items-center justify-center"
        , style: R.css
            { width: show props.width <> "px"
            , height: show props.height <> "px"
            , background: (themeToColors props.theme).background
            }
        }
        [ R.div
            { className: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF9500]"
            }
            []
        ]
    
    Error msg ->
      R.div
        { className: "flex items-center justify-center"
        , style: R.css
            { width: show props.width <> "px"
            , height: show props.height <> "px"
            , background: (themeToColors props.theme).background
            }
        }
        [ R.div
            { className: "text-center"
            }
            [ R.p
                { className: "text-red-500 mb-2"
                }
                [ R.text "Failed to load chart data" ]
            , R.button
                { className: "px-4 py-2 bg-[#FF9500] text-white rounded hover:bg-opacity-90 transition-colors"
                , onClick: handler_ $ do
                    setLoadingState Loading
                    -- Trigger data reload
                }
                [ R.text "Retry" ]
            ]
        ]
    
    Loaded ->
      R.div
        { ref: \ref -> Hooks.writeRef containerRef (HTMLElement.fromElement <$> toNullable ref)
        , className: "chart-container"
        , style: R.css
            { width: show props.width <> "px"
            , height: show props.height <> "px"
            , position: "relative"
            , overflow: "hidden"
            }
        }
        []
  
  where
    toNullable :: forall a. a -> Maybe a
    toNullable = unsafeCoerce  -- Safe for DOM refs
    
    when :: Boolean -> Effect Unit -> Effect Unit
    when true action = action
    when false _ = pure unit