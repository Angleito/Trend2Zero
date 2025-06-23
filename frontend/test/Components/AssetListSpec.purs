module Test.Components.AssetListSpec where

import Prelude

import Components.AssetList as AssetList
import Data.Maybe (Maybe(..))
import Effect.Aff (Aff)
import Halogen as H
import Halogen.HTML as HH
import Halogen.Test.Driver as TD
import Halogen.Test.Utils as TU
import Test.Spec (Spec, describe, it)
import Test.Spec.Assertions (shouldEqual, shouldContain, shouldSatisfy, fail)
import Test.TestHelpers
import Web.HTML (window)
import Web.HTML.Window (document) as Window
import Web.HTML.HTMLDocument as HTMLDocument
import Web.DOM.Document as Document
import Web.DOM.Element as Element
import Web.DOM.NodeList as NodeList
import Web.DOM.ParentNode (QuerySelector(..), querySelectorAll)
import Data.Array (length)

spec :: Spec Unit
spec = describe "AssetList Component" do
  renderingSpec
  stateManagementSpec
  formattingSpec
  interactionSpec

renderingSpec :: Spec Unit
renderingSpec = describe "Rendering" do
  it "renders with empty asset list" do
    let input = { assets: [] }
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit input
    
    -- Check that component renders without errors
    html <- TD.html io
    html `shouldContain` "Market Overview"
    html `shouldContain` "Asset"
    html `shouldContain` "Price"
    html `shouldContain` "24h Change"
    html `shouldContain` "Type"
  
  it "renders with sample assets" do
    let assets = 
          [ { symbol: "BTC"
            , name: "Bitcoin"
            , price: Just 50000.0
            , priceInUSD: Just 50000.0
            , change: 5.0
            , type: Just "crypto"
            }
          , { symbol: "AAPL"
            , name: "Apple Inc."
            , price: Just 180.0
            , priceInUSD: Just 180.0
            , change: -1.4
            , type: Just "stock"
            }
          ]
    let input = { assets }
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit input
    html <- TD.html io
    
    -- Check assets are rendered
    html `shouldContain` "Bitcoin"
    html `shouldContain` "BTC"
    html `shouldContain` "$50000.00"
    html `shouldContain` "+5.00%"
    html `shouldContain` "crypto"
    
    html `shouldContain` "Apple Inc."
    html `shouldContain` "AAPL"
    html `shouldContain` "$180.00"
    html `shouldContain` "-1.40%"
    html `shouldContain` "stock"
  
  it "renders correct number of rows" do
    let assets = generateMockAssets 10
    let input = { assets }
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit input
    
    -- Count table rows (excluding header)
    doc <- getDocument
    tableRows <- querySelectorAll (QuerySelector "tbody tr") (Document.toParentNode doc)
    rowCount <- NodeList.length tableRows
    
    rowCount `shouldEqual` 10

stateManagementSpec :: Spec Unit
stateManagementSpec = describe "State Management" do
  it "updates when receiving new input" do
    let initialAssets = 
          [ { symbol: "BTC"
            , name: "Bitcoin"
            , price: Just 45000.0
            , priceInUSD: Just 45000.0
            , change: 2.0
            , type: Just "crypto"
            }
          ]
    let updatedAssets = 
          [ { symbol: "BTC"
            , name: "Bitcoin"
            , price: Just 50000.0
            , priceInUSD: Just 50000.0
            , change: 5.0
            , type: Just "crypto"
            }
          ]
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    
    -- Initial render
    TD.render io unit { assets: initialAssets }
    initialHtml <- TD.html io
    initialHtml `shouldContain` "$45000.00"
    initialHtml `shouldContain` "+2.00%"
    
    -- Update with new data
    TD.render io unit { assets: updatedAssets }
    updatedHtml <- TD.html io
    updatedHtml `shouldContain` "$50000.00"
    updatedHtml `shouldContain` "+5.00%"
    updatedHtml `shouldNotContain` "$45000.00"

formattingSpec :: Spec Unit
formattingSpec = describe "Formatting" do
  it "formats prices correctly" do
    let assets = 
          [ { symbol: "TEST1", name: "Test 1", price: Just 1234.56, priceInUSD: Just 1234.56, change: 0.0, type: Nothing }
          , { symbol: "TEST2", name: "Test 2", price: Just 0.123, priceInUSD: Just 0.123, change: 0.0, type: Nothing }
          , { symbol: "TEST3", name: "Test 3", price: Just 999999.99, priceInUSD: Just 999999.99, change: 0.0, type: Nothing }
          ]
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit { assets }
    html <- TD.html io
    
    html `shouldContain` "$1234.56"
    html `shouldContain` "$0.12"
    html `shouldContain` "$999999.99"
  
  it "formats positive and negative changes correctly" do
    let assets = 
          [ { symbol: "UP", name: "Up Asset", price: Just 100.0, priceInUSD: Just 100.0, change: 5.25, type: Nothing }
          , { symbol: "DOWN", name: "Down Asset", price: Just 100.0, priceInUSD: Just 100.0, change: -3.75, type: Nothing }
          , { symbol: "FLAT", name: "Flat Asset", price: Just 100.0, priceInUSD: Just 100.0, change: 0.0, type: Nothing }
          ]
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit { assets }
    html <- TD.html io
    
    html `shouldContain` "+5.25%"
    html `shouldContain` "-3.75%"
    html `shouldContain` "+0.00%"
  
  it "handles missing prices gracefully" do
    let assets = 
          [ { symbol: "NOPRICE", name: "No Price", price: Nothing, priceInUSD: Nothing, change: 0.0, type: Nothing }
          , { symbol: "ONLYPRICE", name: "Only Price", price: Just 123.0, priceInUSD: Nothing, change: 0.0, type: Nothing }
          ]
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit { assets }
    html <- TD.html io
    
    html `shouldContain` "$0.00"
    html `shouldContain` "$123.00"
  
  it "displays asset types correctly" do
    let assets = 
          [ { symbol: "BTC", name: "Bitcoin", price: Just 100.0, priceInUSD: Just 100.0, change: 0.0, type: Just "crypto" }
          , { symbol: "AAPL", name: "Apple", price: Just 100.0, priceInUSD: Just 100.0, change: 0.0, type: Just "stock" }
          , { symbol: "GOLD", name: "Gold", price: Just 100.0, priceInUSD: Just 100.0, change: 0.0, type: Just "metal" }
          , { symbol: "UNK", name: "Unknown", price: Just 100.0, priceInUSD: Just 100.0, change: 0.0, type: Nothing }
          ]
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit { assets }
    html <- TD.html io
    
    html `shouldContain` "crypto"
    html `shouldContain` "stock"
    html `shouldContain` "metal"

interactionSpec :: Spec Unit
interactionSpec = describe "Interaction" do
  it "applies hover styles" do
    let assets = [{ symbol: "BTC", name: "Bitcoin", price: Just 50000.0, priceInUSD: Just 50000.0, change: 5.0, type: Just "crypto" }]
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit { assets }
    
    -- Check that hover class is present
    html <- TD.html io
    html `shouldContain` "hover:bg-gray-50"
  
  it "displays symbols in uppercase" do
    let assets = 
          [ { symbol: "btc", name: "Bitcoin", price: Just 50000.0, priceInUSD: Just 50000.0, change: 0.0, type: Nothing }
          , { symbol: "eth", name: "Ethereum", price: Just 3000.0, priceInUSD: Just 3000.0, change: 0.0, type: Nothing }
          ]
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit { assets }
    html <- TD.html io
    
    html `shouldContain` "BTC"
    html `shouldContain` "ETH"
    html `shouldNotContain` "btc"
    html `shouldNotContain` "eth"
  
  it "applies correct color classes for price changes" do
    let assets = 
          [ { symbol: "UP", name: "Up", price: Just 100.0, priceInUSD: Just 100.0, change: 5.0, type: Nothing }
          , { symbol: "DOWN", name: "Down", price: Just 100.0, priceInUSD: Just 100.0, change: -5.0, type: Nothing }
          ]
    
    io <- TD.mkDriver TD.defaultConfig AssetList.component
    TD.render io unit { assets }
    html <- TD.html io
    
    -- Positive changes should have green color
    html `shouldContain` "text-green-600"
    -- Negative changes should have red color
    html `shouldContain` "text-red-600"

-- Helper functions
generateMockAssets :: Int -> Array AssetList.MarketAsset
generateMockAssets n = map generateAsset (1 .. n)
  where
    generateAsset i = 
      { symbol: "TEST" <> show i
      , name: "Test Asset " <> show i
      , price: Just (Int.toNumber i * 100.0)
      , priceInUSD: Just (Int.toNumber i * 100.0)
      , change: Int.toNumber ((i `mod` 10) - 5)
      , type: Just $ case i `mod` 3 of
          0 -> "crypto"
          1 -> "stock"
          _ -> "metal"
      }

getDocument :: Aff Document.Document
getDocument = liftEffect do
  win <- window
  doc <- Window.document win
  pure $ HTMLDocument.toDocument doc

-- Additional test utilities
shouldNotContain :: String -> String -> Aff Unit
shouldNotContain haystack needle =
  if String.contains (String.Pattern needle) haystack
    then fail $ "Expected string not to contain: " <> needle
    else pure unit

-- Import additional modules
import Effect.Class (liftEffect)
import Data.String as String
import Data.Int as Int