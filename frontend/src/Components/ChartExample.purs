module Components.ChartExample where

import Prelude

import Data.Maybe (Maybe(..))
import React.Basic.DOM as R
import React.Basic.Hooks as React

import Components.AssetPriceChart as AssetPriceChart
import Components.ChartContainer as ChartContainer

-- Example component showing both chart types
component :: React.Component {}
component = React.component "ChartExample" \_ -> React.do
  -- Sample candlestick data
  let candlestickData = 
        [ { timestamp: 1640995200000.0, open: 50000.0, high: 51000.0, low: 49500.0, close: 50500.0, volume: Nothing }
        , { timestamp: 1641081600000.0, open: 50500.0, high: 52000.0, low: 50000.0, close: 51500.0, volume: Nothing }
        , { timestamp: 1641168000000.0, open: 51500.0, high: 52500.0, low: 51000.0, close: 52000.0, volume: Nothing }
        , { timestamp: 1641254400000.0, open: 52000.0, high: 53000.0, low: 51500.0, close: 52500.0, volume: Nothing }
        , { timestamp: 1641340800000.0, open: 52500.0, high: 54000.0, low: 52000.0, close: 53500.0, volume: Nothing }
        ]
  
  -- Sample line chart data
  let lineData = 
        [ { time: 1640995200000.0, value: 3000.0 }
        , { time: 1641081600000.0, value: 3100.0 }
        , { time: 1641168000000.0, value: 3050.0 }
        , { time: 1641254400000.0, value: 3200.0 }
        , { time: 1641340800000.0, value: 3150.0 }
        ]
  
  pure $ R.div
    { className: "p-4 space-y-8"
    }
    [ R.div
        { className: "bg-white rounded-lg shadow-lg p-6"
        }
        [ R.h2
            { className: "text-2xl font-bold mb-4"
            }
            [ R.text "Bitcoin Candlestick Chart" ]
        , React.element AssetPriceChart.component
            { data: candlestickData
            }
        ]
    
    , R.div
        { className: "bg-white rounded-lg shadow-lg p-6"
        }
        [ R.h2
            { className: "text-2xl font-bold mb-4"
            }
            [ R.text "Ethereum Line Chart (with provided data)" ]
        , React.element ChartContainer.component
            { data: Just lineData
            , symbol: Nothing
            , theme: ChartContainer.Light
            , days: 7
            , width: 800.0
            , height: 400.0
            }
        ]
    
    , R.div
        { className: "bg-gray-900 rounded-lg shadow-lg p-6"
        }
        [ R.h2
            { className: "text-2xl font-bold mb-4 text-white"
            }
            [ R.text "Gold Price Chart (generated data, dark theme)" ]
        , React.element ChartContainer.component
            { data: Nothing
            , symbol: Just "XAU"
            , theme: ChartContainer.Dark
            , days: 30
            , width: 800.0
            , height: 400.0
            }
        ]
    ]