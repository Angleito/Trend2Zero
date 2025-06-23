module Foreign.LightweightCharts
  ( Chart
  , ChartOptions
  , SeriesType(..)
  , Series
  , CandlestickSeries
  , LineSeries
  , TimeScaleOptions
  , LayoutOptions
  , GridOptions
  , CrosshairMode(..)
  , LineStyle(..)
  , ColorType(..)
  , CandlestickData
  , LineData
  , Time
  , UTCTimestamp
  , BusinessDay
  , createChart
  , createChartWithOptions
  , addCandlestickSeries
  , addLineSeries
  , setData
  , applyOptions
  , resize
  , removeChart
  , fitContent
  , subscribeClick
  , subscribeCrosshairMove
  , unsubscribe
  , defaultChartOptions
  , defaultCandlestickOptions
  , defaultLineOptions
  ) where

import Prelude

import Effect (Effect)
import Effect.Uncurried (EffectFn1, EffectFn2, EffectFn3, runEffectFn1, runEffectFn2, runEffectFn3)
import Data.Function.Uncurried (Fn1, Fn2, runFn1, runFn2)
import Data.Maybe (Maybe(..))
import Data.Nullable (Nullable, toNullable)
import Data.Array (mapMaybe)
import Data.Array as Array
import Data.Tuple (Tuple(..))
import Data.Tuple.Nested ((/\))
import Foreign (Foreign)
import Foreign.Object (Object)
import Foreign.Object as Object
import Web.HTML (HTMLElement)

-- Core Types
foreign import data Chart :: Type
foreign import data Series :: Type -> Type
type CandlestickSeries = Series CandlestickData
type LineSeries = Series LineData

-- Time types
type Time = Foreign -- Can be UTCTimestamp, BusinessDay, or string
type UTCTimestamp = Number
type BusinessDay = { year :: Int, month :: Int, day :: Int }

-- Series Types
data SeriesType = Candlestick | Line | Area | Bar | Histogram

-- Chart Options Types
type ChartOptions =
  { width :: Maybe Number
  , height :: Maybe Number
  , layout :: Maybe LayoutOptions
  , grid :: Maybe GridOptions
  , timeScale :: Maybe TimeScaleOptions
  , rightPriceScale :: Maybe PriceScaleOptions
  , leftPriceScale :: Maybe PriceScaleOptions
  , crosshair :: Maybe CrosshairOptions
  , handleScroll :: Maybe Boolean
  , handleScale :: Maybe Boolean
  }

type LayoutOptions =
  { background :: Maybe BackgroundOptions
  , textColor :: Maybe String
  , fontSize :: Maybe Number
  , fontFamily :: Maybe String
  }

type BackgroundOptions =
  { type :: ColorType
  , color :: String
  }

data ColorType = Solid | VerticalGradient | HorizontalGradient

type GridOptions =
  { vertLines :: Maybe LineOptions
  , horzLines :: Maybe LineOptions
  }

type LineOptions =
  { color :: String
  , style :: Maybe LineStyle
  , visible :: Maybe Boolean
  }

data LineStyle = LSSolid | LSDashed | LSDotted | LSLargeDashed | LSSparseDotted

type TimeScaleOptions =
  { rightOffset :: Maybe Number
  , barSpacing :: Maybe Number
  , minBarSpacing :: Maybe Number
  , fixLeftEdge :: Maybe Boolean
  , fixRightEdge :: Maybe Boolean
  , lockVisibleTimeRangeOnResize :: Maybe Boolean
  , rightBarStaysOnScroll :: Maybe Boolean
  , borderVisible :: Maybe Boolean
  , borderColor :: Maybe String
  , visible :: Maybe Boolean
  , timeVisible :: Maybe Boolean
  , secondsVisible :: Maybe Boolean
  }

type PriceScaleOptions =
  { autoScale :: Maybe Boolean
  , mode :: Maybe Int -- 0: Normal, 1: Logarithmic, 2: Percentage, 3: IndexedTo100
  , invertScale :: Maybe Boolean
  , alignLabels :: Maybe Boolean
  , borderVisible :: Maybe Boolean
  , borderColor :: Maybe String
  , scaleMargins :: Maybe { top :: Number, bottom :: Number }
  , visible :: Maybe Boolean
  }

type CrosshairOptions =
  { mode :: Maybe CrosshairMode
  , vertLine :: Maybe CrosshairLineOptions
  , horzLine :: Maybe CrosshairLineOptions
  }

data CrosshairMode = CMNormal | CMMagnet | CMHidden

type CrosshairLineOptions =
  { color :: Maybe String
  , width :: Maybe Number
  , style :: Maybe LineStyle
  , visible :: Maybe Boolean
  , labelVisible :: Maybe Boolean
  }

-- Series Options
type CandlestickSeriesOptions =
  { upColor :: Maybe String
  , downColor :: Maybe String
  , wickUpColor :: Maybe String
  , wickDownColor :: Maybe String
  , borderVisible :: Maybe Boolean
  , borderUpColor :: Maybe String
  , borderDownColor :: Maybe String
  }

type LineSeriesOptions =
  { color :: Maybe String
  , lineStyle :: Maybe LineStyle
  , lineWidth :: Maybe Number
  , lineType :: Maybe Int -- 0: Simple, 1: WithSteps
  , lineVisible :: Maybe Boolean
  , pointMarkersVisible :: Maybe Boolean
  , crosshairMarkerVisible :: Maybe Boolean
  , crosshairMarkerRadius :: Maybe Number
  , crosshairMarkerBorderColor :: Maybe String
  , crosshairMarkerBackgroundColor :: Maybe String
  , lastValueVisible :: Maybe Boolean
  , priceLineVisible :: Maybe Boolean
  , priceLineWidth :: Maybe Number
  , priceLineColor :: Maybe String
  , priceLineStyle :: Maybe LineStyle
  }

-- Data Types
type CandlestickData =
  { time :: Time
  , open :: Number
  , high :: Number
  , low :: Number
  , close :: Number
  }

type LineData =
  { time :: Time
  , value :: Number
  }

-- Foreign imports
foreign import _createChart :: EffectFn2 HTMLElement Foreign Chart
foreign import _addCandlestickSeries :: EffectFn2 Chart Foreign CandlestickSeries
foreign import _addLineSeries :: EffectFn2 Chart Foreign LineSeries
foreign import _setData :: forall a. EffectFn2 (Series a) (Array a) Unit
foreign import _applyOptions :: EffectFn2 Chart Foreign Unit
foreign import _resize :: EffectFn3 Chart Number Number Unit
foreign import _remove :: EffectFn1 Chart Unit
foreign import _timeScale :: Fn1 Chart Foreign
foreign import _fitContent :: EffectFn1 Foreign Unit
foreign import _subscribeClick :: EffectFn2 Chart (EffectFn1 Foreign Unit) (Effect Unit)
foreign import _subscribeCrosshairMove :: EffectFn2 Chart (EffectFn1 Foreign Unit) (Effect Unit)

-- Helper to convert PureScript options to JavaScript
foreign import _toJsOptions :: forall a. Fn1 a Foreign

-- API Functions
createChart :: HTMLElement -> Effect Chart
createChart element = runEffectFn2 _createChart element (runFn1 _toJsOptions {})

createChartWithOptions :: HTMLElement -> ChartOptions -> Effect Chart
createChartWithOptions element options = 
  runEffectFn2 _createChart element (runFn1 _toJsOptions $ chartOptionsToJs options)

addCandlestickSeries :: Chart -> CandlestickSeriesOptions -> Effect CandlestickSeries
addCandlestickSeries chart options = 
  runEffectFn2 _addCandlestickSeries chart (runFn1 _toJsOptions $ candlestickOptionsToJs options)

addLineSeries :: Chart -> LineSeriesOptions -> Effect LineSeries
addLineSeries chart options = 
  runEffectFn2 _addLineSeries chart (runFn1 _toJsOptions $ lineOptionsToJs options)

setData :: forall a. Series a -> Array a -> Effect Unit
setData series data = runEffectFn2 _setData series data

applyOptions :: Chart -> ChartOptions -> Effect Unit
applyOptions chart options = 
  runEffectFn2 _applyOptions chart (runFn1 _toJsOptions $ chartOptionsToJs options)

resize :: Chart -> Number -> Number -> Effect Unit
resize chart width height = runEffectFn3 _resize chart width height

removeChart :: Chart -> Effect Unit
removeChart = runEffectFn1 _remove

fitContent :: Chart -> Effect Unit
fitContent chart = do
  let ts = runFn1 _timeScale chart
  runEffectFn1 _fitContent ts

subscribeClick :: Chart -> (Foreign -> Effect Unit) -> Effect (Effect Unit)
subscribeClick chart handler = runEffectFn2 _subscribeClick chart (runEffectFn1 handler)

subscribeCrosshairMove :: Chart -> (Foreign -> Effect Unit) -> Effect (Effect Unit)
subscribeCrosshairMove chart handler = runEffectFn2 _subscribeCrosshairMove chart (runEffectFn1 handler)

unsubscribe :: Effect Unit -> Effect Unit
unsubscribe = identity

-- Default Options
defaultChartOptions :: ChartOptions
defaultChartOptions =
  { width: Nothing
  , height: Nothing
  , layout: Nothing
  , grid: Nothing
  , timeScale: Nothing
  , rightPriceScale: Nothing
  , leftPriceScale: Nothing
  , crosshair: Nothing
  , handleScroll: Nothing
  , handleScale: Nothing
  }

defaultCandlestickOptions :: CandlestickSeriesOptions
defaultCandlestickOptions =
  { upColor: Just "#26a69a"
  , downColor: Just "#ef5350"
  , wickUpColor: Just "#26a69a"
  , wickDownColor: Just "#ef5350"
  , borderVisible: Just false
  , borderUpColor: Nothing
  , borderDownColor: Nothing
  }

defaultLineOptions :: LineSeriesOptions
defaultLineOptions =
  { color: Just "#2962FF"
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

-- Helper functions to convert options to JavaScript format
chartOptionsToJs :: ChartOptions -> Foreign
chartOptionsToJs = runFn1 _toJsOptions

candlestickOptionsToJs :: CandlestickSeriesOptions -> Foreign
candlestickOptionsToJs = runFn1 _toJsOptions

lineOptionsToJs :: LineSeriesOptions -> Foreign
lineOptionsToJs = runFn1 _toJsOptions