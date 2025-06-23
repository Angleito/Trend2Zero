module Trend2Zero.Utils.Debounce
  ( debounce
  , debounceWithCancel
  , DebouncedFunction
  , CancelFunction
  ) where

import Prelude

import Effect (Effect)
import Effect.Ref as Ref
import Effect.Timer (clearTimeout, setTimeout, TimeoutId)
import Data.Maybe (Maybe(..))

-- | Type alias for a debounced function
type DebouncedFunction a = a -> Effect Unit

-- | Type alias for a cancel function
type CancelFunction = Effect Unit

-- | Create a debounced version of an effectful function
-- | The function will only execute after the specified delay (in milliseconds)
-- | has passed without any new calls
debounce :: forall a. Int -> (a -> Effect Unit) -> Effect (DebouncedFunction a)
debounce delayMs fn = do
  timeoutRef <- Ref.new Nothing
  
  pure $ \input -> do
    -- Cancel any existing timeout
    maybeTimeout <- Ref.read timeoutRef
    case maybeTimeout of
      Just timeout -> clearTimeout timeout
      Nothing -> pure unit
    
    -- Set a new timeout
    newTimeout <- setTimeout delayMs (fn input)
    Ref.write (Just newTimeout) timeoutRef

-- | Create a debounced function with the ability to cancel pending executions
debounceWithCancel :: forall a. Int -> (a -> Effect Unit) -> Effect { debounced :: DebouncedFunction a, cancel :: CancelFunction }
debounceWithCancel delayMs fn = do
  timeoutRef <- Ref.new Nothing
  
  let
    debounced = \input -> do
      -- Cancel any existing timeout
      maybeTimeout <- Ref.read timeoutRef
      case maybeTimeout of
        Just timeout -> clearTimeout timeout
        Nothing -> pure unit
      
      -- Set a new timeout
      newTimeout <- setTimeout delayMs (fn input)
      Ref.write (Just newTimeout) timeoutRef
    
    cancel = do
      maybeTimeout <- Ref.read timeoutRef
      case maybeTimeout of
        Just timeout -> do
          clearTimeout timeout
          Ref.write Nothing timeoutRef
        Nothing -> pure unit
  
  pure { debounced, cancel }