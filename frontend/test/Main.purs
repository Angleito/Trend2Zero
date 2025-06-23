module Test.Main where

import Prelude

import Effect (Effect)
import Effect.Aff (launchAff_)
import Test.Spec (describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Spec.Reporter.Console (consoleReporter)
import Test.Spec.Runner (runSpec)

-- Import all test modules
import Test.TypesSpec as TypesSpec
import Test.Components.AssetListSpec as AssetListSpec
import Test.PropertySpec as PropertySpec

main :: Effect Unit
main = launchAff_ $ runSpec [consoleReporter] do
  describe "Trend2Zero Frontend Tests" do
    it "should pass basic test" do
      (1 + 1) `shouldEqual` 2
    
    -- Types module tests
    TypesSpec.spec
    
    -- Component tests
    describe "Component Tests" do
      AssetListSpec.spec
    
    -- Property-based tests
    PropertySpec.spec