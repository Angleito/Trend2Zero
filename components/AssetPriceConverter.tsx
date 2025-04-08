'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import React, { useState, useEffect } from 'react';
import { MarketDataService } from '../lib/services/marketDataService';
import type { AssetData } from '../lib/types';

interface AssetPriceConverterProps {
  assetSymbol: string;
}

const AssetPriceConverter: React.FC<AssetPriceConverterProps> = ({ assetSymbol }) => {
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(1);
  const [conversionType, setConversionType] = useState<'toBTC' | 'fromBTC'>('toBTC');

  useEffect(() => {
    const fetchAssetData = async () => {
      try {
        setLoading(true);
        const marketService = new MarketDataService();
        const data = await marketService.getAssetPriceInBTC(assetSymbol);
        setAssetData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching asset data:', err);
        setError('Failed to load asset data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetData();
  }, [assetSymbol]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setAmount(value);
    }
  };

  const toggleConversionType = () => {
    setConversionType(prevType => (prevType === 'toBTC' ? 'fromBTC' : 'toBTC'));
  };

  const calculateConversion = (): string => {
    if (!assetData) return '0';

    if (conversionType === 'toBTC') {
      // Convert asset to BTC
      const btcValue = amount * assetData.priceInBTC;
      return formatBTC(btcValue);
    } else {
      // Convert BTC to asset
      const assetValue = amount / assetData.priceInBTC;
      return formatUSD(assetValue * assetData.priceInUSD);
    }
  };

  const formatBTC = (value: number): string => {
    if (value >= 1) {
      return `${value.toFixed(8)} ₿`;
    } else if (value >= 0.0001) {
      return `${value.toFixed(8)} ₿`;
    } else {
      return `${value.toExponential(4)} ₿`;
    }
  };

  const formatUSD = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Price Converter</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF9500]"></div>
        </div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Price Converter</h2>
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">{error || 'Asset data not available'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#FF9500] text-white rounded hover:bg-opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Price Converter</h2>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Current Price:</span>
          <span className="text-white font-medium">{formatBTC(assetData.priceInBTC)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">USD Price:</span>
          <span className="text-white font-medium">{formatUSD(assetData.priceInUSD)}</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 mb-2">
          {conversionType === 'toBTC' ? `Amount (${assetData.symbol})` : 'Amount (BTC)'}
        </label>
        <input
          type="number"
          value={amount}
          onChange={handleAmountChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FF9500] focus:border-transparent"
          min="0"
          step="0.01"
        />
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={toggleConversionType}
          className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-[#FF9500]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 mb-2">
          {conversionType === 'toBTC' ? 'Value (BTC)' : `Value (${assetData.symbol})`}
        </label>
        <div className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white">
          {calculateConversion()}
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-4">
        * Prices are updated in real-time and may vary slightly from exchange rates.
      </div>
    </div>
  );
};

export default AssetPriceConverter;
