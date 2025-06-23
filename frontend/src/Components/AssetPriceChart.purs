module Components.AssetPriceChart
  ( component
  , Props
  , HistoricalDataPoint
  ) where

import Prelude

import Data.Array as Array
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Nullable (Nullable, toNullable)
import Effect (Effect)
import Effect.Aff (Aff)
import Effect.Class (liftEffect)
import React.Basic.DOM as R
import React.Basic.DOM.Events (preventDefault)
import React.Basic.Events (handler_)
import React.Basic.Hooks as React
import React.Basic.Hooks (Hook, UseEffect, UseRef, UseState, (/\))
import React.Basic.Hooks as Hooks
import Web.HTML (HTMLElement)
import Web.HTML.HTMLElement as HTMLElement
import Web.DOM.Element as Element
import Web.Event.Event (EventType(..))
import Web.Event.EventTarget (addEventListener, eventListener, removeEventListener, EventTarget)
import Web.HTML.Window (innerWidth, innerHeight)
import Web.HTML (window, windowToEventTarget)
import Web.DOM.Element (getBoundingClientRect)
import Unsafe.Coerce (unsafeCoerce)

import Foreign.LightweightCharts as LC

-- Types
type HistoricalDataPoint =
  { timestamp :: Number
  , open :: Number
  , high :: Number
  , low :: Number
  , close :: Number
  , volume :: Maybe Number
  }

type Props =
  { data :: Array HistoricalDataPoint
  }

-- Component
component :: React.Component Props
component = React.component "AssetPriceChart" \props -> React.do
  -- State for chart and series references
  chartRef <- Hooks.useRef Nothing
  seriesRef <- Hooks.useRef Nothing
  containerRef <- Hooks.useRef Nothing
  
  -- Effect to create and setup the chart
  Hooks.useEffect unit $ do
    maybeContainer <- Hooks.readRef containerRef
    maybeChart <- Hooks.readRef chartRef
    
    case maybeContainer, maybeChart of
      Just container, Nothing -> do
        -- Get container dimensions
        let element = HTMLElement.toElement container
        rect <- liftEffect $ getBoundingClientRect element
        
        -- Create chart with options
        chart <- liftEffect $ LC.createChartWithOptions container
          { width: Just rect.width
          , height: Just 400.0
          , layout: Just
              { background: Just { type: LC.Solid, color: "#ffffff" }
              , textColor: Just "#333333"
              , fontSize: Nothing
              , fontFamily: Nothing
              }
          , grid: Just
              { vertLines: Just { color: "#f0f0f0", style: Nothing, visible: Nothing }
              , horzLines: Just { color: "#f0f0f0", style: Nothing, visible: Nothing }
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
              , borderColor: Nothing
              , visible: Nothing
              , timeVisible: Just true
              , secondsVisible: Just false
              }
          , rightPriceScale: Nothing
          , leftPriceScale: Nothing
          , crosshair: Nothing
          , handleScroll: Nothing
          , handleScale: Nothing
          }
        
        -- Add candlestick series
        series <- liftEffect $ LC.addCandlestickSeries chart LC.defaultCandlestickOptions
        
        -- Store references
        Hooks.writeRef chartRef (Just chart)
        Hooks.writeRef seriesRef (Just series)
        
        -- Setup resize handler
        win <- liftEffect window
        resizeListener <- liftEffect $ eventListener $ const $ do
          let elem = HTMLElement.toElement container
          newRect <- getBoundingClientRect elem
          LC.resize chart newRect.width 400.0
        
        let resizeEvent = EventType "resize"
        win' <- liftEffect window
        liftEffect $ addEventListener resizeEvent resizeListener false (windowToEventTarget win')
        
        -- Cleanup function
        pure $ Just $ do
          win'' <- liftEffect window
          liftEffect $ removeEventListener resizeEvent resizeListener false (windowToEventTarget win'')
          maybeChartToRemove <- Hooks.readRef chartRef
          case maybeChartToRemove of
            Just chartToRemove -> do
              liftEffect $ LC.removeChart chartToRemove
              Hooks.writeRef chartRef Nothing
              Hooks.writeRef seriesRef Nothing
            Nothing -> pure unit
      
      _, _ -> pure Nothing
  
  -- Effect to update data when props change
  Hooks.useEffect props.data $ do
    maybeSeries <- Hooks.readRef seriesRef
    maybeChart <- Hooks.readRef chartRef
    
    case maybeSeries, maybeChart of
      Just series, Just chart -> do
        -- Convert data to chart format
        let chartData = props.data # Array.map \point ->
              { time: unsafeCoerce (point.timestamp / 1000.0) :: LC.Time
              , open: point.open
              , high: point.high
              , low: point.low
              , close: point.close
              }
        
        -- Update series data
        liftEffect $ LC.setData series chartData
        
        -- Fit content
        liftEffect $ LC.fitContent chart
        
      _, _ -> pure unit
    
    pure Nothing
  
  -- Render
  pure $ R.div
    { ref: \ref -> Hooks.writeRef containerRef (HTMLElement.fromElement <$> toNullable ref)
    , style: R.css
        { width: "100%"
        , height: "400px"
        , position: "relative"
        }
    }
    []
  
  where
    toNullable :: forall a. a -> Maybe a  
    toNullable = unsafeCoerce
