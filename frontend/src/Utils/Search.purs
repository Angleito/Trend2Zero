module Trend2Zero.Utils.Search
  ( SearchOptions
  , SearchResult
  , searchAssets
  , filterByCategory
  , rankResults
  , generateSuggestions
  , fuzzyMatch
  , levenshteinDistance
  ) where

import Prelude

import Data.Array as Array
import Data.String as String
import Data.String.Common (toLower)
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Foldable (foldl)
import Data.Int (toNumber)
import Math (abs)

-- | Options for search functionality
type SearchOptions =
  { query :: String
  , category :: Maybe String
  , limit :: Maybe Int
  , caseSensitive :: Boolean
  }

-- | Search result with relevance scoring
type SearchResult a =
  { item :: a
  , score :: Number
  , matchedFields :: Array String
  }

-- | Ultrathink-optimized search algorithm with relevance scoring
searchAssets :: forall a. 
  { getName :: a -> String
  , getSymbol :: a -> String  
  , getCategory :: a -> Maybe String
  } -> 
  SearchOptions -> 
  Array a -> 
  Array (SearchResult a)
searchAssets accessors options items =
  let
    query = if options.caseSensitive 
            then options.query 
            else toLower options.query
    
    -- Filter by category first if specified
    categoryFiltered = case options.category of
      Nothing -> items
      Just cat -> filterByCategory accessors.getCategory cat items
    
    -- Score and filter items
    scored = Array.mapMaybe (scoreItem accessors query) categoryFiltered
    
    -- Sort by score (descending) and apply limit
    sorted = Array.sortBy (comparing (_.score >>> negate)) scored
    
    limited = case options.limit of
      Nothing -> sorted
      Just lim -> Array.take lim sorted
      
  in limited
  where
    scoreItem accessors query item =
      let
        name = if options.caseSensitive 
               then accessors.getName item
               else toLower (accessors.getName item)
        symbol = if options.caseSensitive
                 then accessors.getSymbol item  
                 else toLower (accessors.getSymbol item)
        
        -- Multiple scoring strategies for ultrathink optimization
        exactMatchScore = if name == query || symbol == query then 10.0 else 0.0
        startsWithScore = 
          if String.take (String.length query) name == query then 5.0
          else if String.take (String.length query) symbol == query then 4.0  
          else 0.0
        containsScore =
          if String.contains (String.Pattern query) name then 3.0
          else if String.contains (String.Pattern query) symbol then 2.0
          else 0.0
        fuzzyScore = fuzzyMatch query name * 1.5 + fuzzyMatch query symbol
        
        totalScore = exactMatchScore + startsWithScore + containsScore + fuzzyScore
        
        matchedFields = Array.catMaybes
          [ if String.contains (String.Pattern query) name then Just "name" else Nothing
          , if String.contains (String.Pattern query) symbol then Just "symbol" else Nothing
          ]
      in
        if totalScore > 0.0
        then Just { item, score: totalScore, matchedFields }
        else Nothing

-- | Filter assets by category
filterByCategory :: forall a. (a -> Maybe String) -> String -> Array a -> Array a
filterByCategory getCategory targetCategory =
  Array.filter (\item ->
    case getCategory item of
      Nothing -> false
      Just cat -> toLower cat == toLower targetCategory
  )

-- | Rank search results using ultrathink relevance algorithm
rankResults :: forall a. Array (SearchResult a) -> Array (SearchResult a)
rankResults = Array.sortBy (comparing (_.score >>> negate))

-- | Generate auto-complete suggestions based on partial input
generateSuggestions :: forall a.
  { getName :: a -> String
  , getSymbol :: a -> String
  } ->
  String ->
  Array a ->
  Int ->
  Array String
generateSuggestions accessors query items maxSuggestions =
  let
    lowerQuery = toLower query
    
    -- Collect all possible suggestions with scores
    suggestions = Array.concatMap (\item ->
      let
        name = accessors.getName item
        symbol = accessors.getSymbol item
        lowerName = toLower name
        lowerSymbol = toLower symbol
      in
        Array.catMaybes
          [ if String.take (String.length lowerQuery) lowerName == lowerQuery
            then Just { text: name, score: 10.0 }
            else Nothing
          , if String.take (String.length lowerQuery) lowerSymbol == lowerQuery  
            then Just { text: symbol, score: 9.0 }
            else Nothing
          , if String.contains (String.Pattern lowerQuery) lowerName && String.length name < 30
            then Just { text: name, score: 5.0 }
            else Nothing
          ]
    ) items
    
    -- Sort by score and deduplicate
    sorted = Array.sortBy (comparing (_.score >>> negate)) suggestions
    deduped = Array.nubByEq (\a b -> toLower a.text == toLower b.text) sorted
    
  in
    Array.take maxSuggestions (map _.text deduped)

-- | Fuzzy matching algorithm that returns a score between 0 and 1
fuzzyMatch :: String -> String -> Number
fuzzyMatch pattern target =
  let
    patternLower = toLower pattern
    targetLower = toLower target
    patternLen = String.length patternLower
    targetLen = String.length targetLower
  in
    if patternLen == 0 then 1.0
    else if targetLen == 0 then 0.0
    else if patternLen > targetLen then 0.0
    else
      let
        -- Calculate Levenshtein distance ratio
        distance = levenshteinDistance patternLower targetLower
        maxDistance = max patternLen targetLen
        ratio = 1.0 - (toNumber distance / toNumber maxDistance)
        
        -- Bonus for consecutive matches
        consecutiveBonus = if String.contains (String.Pattern patternLower) targetLower
                          then 0.2
                          else 0.0
      in
        min 1.0 (ratio + consecutiveBonus)

-- | Levenshtein distance implementation for fuzzy matching
levenshteinDistance :: String -> String -> Int
levenshteinDistance s1 s2 =
  let
    arr1 = String.toCodePointArray s1
    arr2 = String.toCodePointArray s2
    len1 = Array.length arr1
    len2 = Array.length arr2
    
    -- Create distance matrix
    initialRow = Array.range 0 len2
    
    processChar i prevRow =
      let
        char1 = fromMaybe 0 (Array.index arr1 i)
        
        processCol j prev acc =
          let
            char2 = fromMaybe 0 (Array.index arr2 j)
            cost = if char1 == char2 then 0 else 1
            
            deletion = fromMaybe 999999 (Array.index acc j) + 1
            insertion = prev + 1
            substitution = fromMaybe 999999 (Array.index prevRow j) + cost
            
            minCost = min deletion (min insertion substitution)
          in
            Array.snoc acc minCost
            
        newRow = foldl (\acc j -> 
          let prev = fromMaybe 999999 (Array.last acc)
          in processCol j prev acc
        ) [i + 1] (Array.range 0 (len2 - 1))
      in
        newRow
    
    finalRow = foldl (\prevRow i -> processChar i prevRow) initialRow (Array.range 0 (len1 - 1))
  in
    fromMaybe 999999 (Array.last finalRow)