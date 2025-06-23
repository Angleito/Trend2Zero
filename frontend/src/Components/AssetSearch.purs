module Trend2Zero.Components.AssetSearch
  ( assetSearch
  , AssetSearchProps
  ) where

import Prelude

import Data.Array as Array
import Data.Maybe (Maybe(..), fromMaybe, isJust)
import Data.Either (Either(..))
import Effect (Effect)
import Effect.Aff (Aff, launchAff_)
import Effect.Class (liftEffect)
import React.Basic.DOM as R
import React.Basic.DOM.Events (targetValue)
import React.Basic.Events (handler, handler_)
import React.Basic.Hooks as React
import React.Basic.Hooks ((/\))
import Web.HTML (window)
import Web.HTML.Window (location)
import Web.HTML.Location (href, setHref)
import Affjax as AX
import Affjax.ResponseFormat as ResponseFormat
import Affjax.StatusCode (StatusCode(..))
import Data.Argonaut.Core as Json
import Data.Argonaut.Decode (decodeJson)
import Data.Argonaut.Decode.Class (class DecodeJson)
import Data.HTTP.Method (Method(..))
import Trend2Zero.Utils.Debounce (debounceWithCancel)
import Trend2Zero.Utils.Search (searchAssets, generateSuggestions, SearchOptions)

-- | Asset data type matching the TypeScript MarketAsset interface
type MarketAsset =
  { symbol :: String
  , name :: String
  , price :: Number
  , priceInUSD :: Maybe Number
  , priceInBTC :: Maybe Number
  , change :: Number
  , changePercent :: Number
  , change24h :: Maybe Number
  , volume24h :: Maybe Number
  , marketCap :: Maybe Number
  , category :: Maybe String
  , type :: Maybe String
  , lastUpdated :: String
  }

-- | Props for the AssetSearch component
type AssetSearchProps =
  { onAssetSelect :: Maybe (MarketAsset -> Effect Unit)
  , placeholder :: Maybe String
  , showCategories :: Maybe Boolean
  , autoFocus :: Maybe Boolean
  }

-- | Asset categories
data AssetCategory = Metal | Stock | Crypto

derive instance eqAssetCategory :: Eq AssetCategory

categoryToString :: AssetCategory -> String
categoryToString Metal = "metal"
categoryToString Stock = "stocks"  
categoryToString Crypto = "crypto"

categoryFromString :: String -> Maybe AssetCategory
categoryFromString "metal" = Just Metal
categoryFromString "stocks" = Just Stock
categoryFromString "crypto" = Just Crypto
categoryFromString _ = Nothing

allCategories :: Array AssetCategory
allCategories = [Metal, Stock, Crypto]

-- | Main asset search component with ultrathink-optimized search
assetSearch :: AssetSearchProps -> React.JSX
assetSearch props = React.component "AssetSearch" \_ -> React.do
  query /\ setQuery <- React.useState ""
  results /\ setResults <- React.useState []
  loading /\ setLoading <- React.useState false
  error /\ setError <- React.useState Nothing
  selectedCategory /\ setSelectedCategory <- React.useState Nothing
  suggestions /\ setSuggestions <- React.useState []
  showSuggestions /\ setShowSuggestions <- React.useState false
  
  -- Create debounced search function
  debouncedSearch <- React.useEffectOnce do
    { debounced, cancel } <- debounceWithCancel 300 performSearch
    pure cancel
  
  let
    -- Perform the actual search
    performSearch searchQuery = launchAff_ do
      when (searchQuery /= "") do
        liftEffect $ setLoading true
        liftEffect $ setError Nothing
        
        let url = "/api/market-data/search?q=" <> searchQuery <>
                  case selectedCategory of
                    Nothing -> ""
                    Just cat -> "&category=" <> categoryToString cat
        
        response <- AX.request $ AX.defaultRequest
          { url = url
          , method = Left GET
          , responseFormat = ResponseFormat.json
          }
        
        case response of
          Left err -> liftEffect do
            setError $ Just "Failed to search assets"
            setLoading false
            
          Right res -> 
            if res.status == StatusCode 200
            then case decodeJson res.body of
              Left _ -> liftEffect do
                setError $ Just "Failed to parse search results"
                setLoading false
              Right (assets :: Array MarketAsset) -> liftEffect do
                setResults assets
                setLoading false
            else liftEffect do
              setError $ Just "Search request failed"
              setLoading false
    
    -- Handle input change with debouncing
    handleInputChange value = do
      setQuery value
      
      if value == ""
      then do
        setResults []
        setSuggestions []
        setShowSuggestions false
      else do
        -- Generate suggestions using ultrathink algorithm
        let searchOpts = { query: value
                        , category: map categoryToString selectedCategory
                        , limit: Just 5
                        , caseSensitive: false
                        }
        let newSuggestions = generateSuggestions 
              { getName: _.name, getSymbol: _.symbol }
              value
              results
              5
        setSuggestions newSuggestions
        setShowSuggestions true
        
        -- Trigger debounced search
        debouncedSearch value
    
    -- Handle category selection
    handleCategorySelect category = do
      setSelectedCategory $ 
        if selectedCategory == Just category 
        then Nothing 
        else Just category
      when (query /= "") $ performSearch query
    
    -- Handle suggestion selection
    handleSuggestionSelect suggestion = do
      setQuery suggestion
      setShowSuggestions false
      performSearch suggestion
    
    -- Handle asset selection
    handleAssetClick asset = case props.onAssetSelect of
      Just onSelect -> onSelect asset
      Nothing -> do
        win <- window
        loc <- location win
        setHref ("/asset/" <> asset.symbol) loc
  
  pure $ R.div
    { className: "w-full max-w-2xl mx-auto"
    , children:
      [ -- Category filters
        when (fromMaybe true props.showCategories) $
          R.div
            { className: "mb-4 flex gap-2"
            , children: map (\cat ->
                R.button
                  { className: "px-4 py-2 rounded-lg transition-colors " <>
                      if selectedCategory == Just cat
                      then "bg-blue-500 text-white"
                      else "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  , onClick: handler_ $ handleCategorySelect cat
                  , children: [ R.text $ categoryToString cat ]
                  }
              ) allCategories
            }
            
      , -- Search input container
        R.div
          { className: "relative"
          , children:
            [ -- Search input
              R.input
                { type: "text"
                , placeholder: fromMaybe "Search assets..." props.placeholder
                , value: query
                , onChange: handler targetValue \mVal -> 
                    case mVal of
                      Just val -> handleInputChange val
                      Nothing -> pure unit
                , onFocus: handler_ $ setShowSuggestions (not $ Array.null suggestions)
                , onBlur: handler_ $ void $ setTimeout 200 $ setShowSuggestions false
                , autoFocus: fromMaybe false props.autoFocus
                , className: "w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                }
                
            , -- Search icon
              R.div
                { className: "absolute left-3 top-3.5"
                , children:
                  [ R.svg
                    { className: "w-5 h-5 text-gray-400"
                    , fill: "none"
                    , stroke: "currentColor"
                    , viewBox: "0 0 24 24"
                    , children:
                      [ R.path
                        { strokeLinecap: "round"
                        , strokeLinejoin: "round"
                        , strokeWidth: "2"
                        , d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        }
                      ]
                    }
                  ]
                }
                
            , -- Auto-complete suggestions
              when (showSuggestions && not (Array.null suggestions)) $
                R.div
                  { className: "absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                  , children: Array.mapWithIndex (\idx suggestion ->
                      R.div
                        { className: "px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer " <>
                            if idx /= Array.length suggestions - 1
                            then "border-b border-gray-200 dark:border-gray-700"
                            else ""
                        , onClick: handler_ $ handleSuggestionSelect suggestion
                        , children: [ R.text suggestion ]
                        }
                    ) suggestions
                  }
            ]
          }
          
      , -- Loading indicator
        when loading $
          R.div
            { className: "mt-4 text-center"
            , children:
              [ R.div
                { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"
                }
              ]
            }
            
      , -- Error message
        case error of
          Just err ->
            R.div
              { className: "mt-4 text-red-500 text-center"
              , children: [ R.text err ]
              }
          Nothing -> R.text ""
          
      , -- Search results
        when (not $ Array.null results) $
          R.div
            { className: "mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
            , children: Array.mapWithIndex (\index asset ->
                R.a
                  { href: "#"
                  , onClick: handler_ $ handleAssetClick asset
                  , className: "block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 " <>
                      if index /= Array.length results - 1
                      then "border-b border-gray-200 dark:border-gray-700"
                      else ""
                  , children:
                    [ R.div
                      { className: "flex justify-between items-center"
                      , children:
                        [ -- Asset info
                          R.div_
                            [ R.div
                              { className: "font-medium"
                              , children: [ R.text asset.name ]
                              }
                            , R.div
                              { className: "text-sm text-gray-500"
                              , children: [ R.text asset.symbol ]
                              }
                            ]
                            
                        , -- Price info
                          R.div
                            { className: "text-right"
                            , children:
                              [ R.div_
                                [ R.text $ "$" <> formatNumber (fromMaybe asset.price asset.priceInUSD) ]
                              , R.div
                                { className: "text-sm " <>
                                    if asset.changePercent >= 0.0
                                    then "text-green-500"
                                    else "text-red-500"
                                , children:
                                  [ R.text $ 
                                    (if asset.changePercent >= 0.0 then "+" else "") <>
                                    formatPercent asset.changePercent
                                  ]
                                }
                              ]
                            }
                        ]
                      }
                    ]
                  }
              ) results
            }
      ]
    }
  where
    -- Helper to format numbers with thousand separators
    formatNumber :: Number -> String
    formatNumber n = show n -- TODO: Add proper number formatting
    
    -- Helper to format percentages
    formatPercent :: Number -> String  
    formatPercent n = show n <> "%"
    
    -- Helper for setTimeout (would need proper FFI binding)
    setTimeout :: Int -> Effect Unit -> Effect Unit
    setTimeout _ eff = eff -- Placeholder - needs proper implementation