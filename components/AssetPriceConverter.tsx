'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import { useState, useEffect, ChangeEvent } from 'react';
import { getAssetPrice } from '../lib/services/marketDataService';
import type { AssetPrice } from '../lib/types';

interface AssetPriceConverterProps {
  fromSymbol: string;
  toSymbol: string;
}

export function AssetPriceConverter({ fromSymbol, toSymbol }: AssetPriceConverterProps) {
  const [fromAmount, setFromAmount] = useState<string>('1');
  const [fromPrice, setFromPrice] = useState<number | null>(null);
  const [toPrice, setToPrice] = useState<number | null>(null);
  
  useEffect(() => {
    async function fetchPrices() {
      const [fromAsset, toAsset] = await Promise.all([
        getAssetPrice(fromSymbol),
        getAssetPrice(toSymbol)
      ]);
      
      if (fromAsset && toAsset) {
        setFromPrice(fromAsset.priceInUSD);
        setToPrice(toAsset.priceInUSD);
      }
    }
    
    fetchPrices();
  }, [fromSymbol, toSymbol]);
  
  const handleFromAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFromAmount(e.target.value);
  };
  
  const calculateConversion = () => {
    if (!fromPrice || !toPrice || !fromAmount) return '';
    const result = (parseFloat(fromAmount) * fromPrice) / toPrice;
    return result.toFixed(8);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Price Converter</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Amount ({fromSymbol})</label>
          <input
            type="number"
            value={fromAmount}
            onChange={handleFromAmountChange}
            className="w-full p-2 border rounded"
            min="0"
            step="any"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Converted Amount ({toSymbol})</label>
          <input
            type="text"
            value={calculateConversion()}
            readOnly
            className="w-full p-2 border rounded bg-gray-50"
          />
        </div>
        {fromPrice && toPrice && (
          <p className="text-sm text-gray-500">
            1 {fromSymbol} = {(fromPrice / toPrice).toFixed(8)} {toSymbol}
          </p>
        )}
      </div>
    </div>
  );
}
