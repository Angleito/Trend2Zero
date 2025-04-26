'use client';

import { useState } from 'react';
import type { MarketAsset } from '../lib/types';

interface AssetTrackerProps {
  initialAssets: MarketAsset[];
}

export function AssetTracker({ initialAssets }: AssetTrackerProps) {
  const [trackedAssets, setTrackedAssets] = useState<MarketAsset[]>([]);
  const [availableAssets, setAvailableAssets] = useState<MarketAsset[]>(initialAssets);

  const addAsset = (asset: MarketAsset) => {
    setTrackedAssets(prev => [...prev, asset]);
    setAvailableAssets(prev => prev.filter(a => a.symbol !== asset.symbol));
  };

  const removeAsset = (asset: MarketAsset) => {
    setTrackedAssets(prev => prev.filter(a => a.symbol !== asset.symbol));
    setAvailableAssets(prev => [...prev, asset]);
  };

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Asset Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Tracked Assets</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {trackedAssets.length === 0 ? (
              <p className="p-6 text-gray-500">No assets tracked yet</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {trackedAssets.map(asset => (
                    <tr key={asset.symbol}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{asset.name}</div>
                        <div className="text-sm text-gray-500">{asset.symbol}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">${asset.priceInUSD.toLocaleString()}</div>
                        <div className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeAsset(asset)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Available Assets</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {availableAssets.map(asset => (
                  <tr key={asset.symbol}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{asset.name}</div>
                      <div className="text-sm text-gray-500">{asset.symbol}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">${asset.priceInUSD.toLocaleString()}</div>
                      <div className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => addAsset(asset)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}