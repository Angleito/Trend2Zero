"use client";

import { useState, useEffect } from 'react';
// Removed import from '../lib/strapi/content';
import { AssetPrice as AssetType } from '../lib/types'; // Import AssetPrice type

interface AssetDisplayProps {
  symbol: string;
}

const AssetDisplay = ({ symbol }: AssetDisplayProps) => {
  const [asset, setAsset] = useState<AssetType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        // Fetch data from the new backend route
        const response = await fetch(`/api/market-data/asset/${symbol}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch asset data for ${symbol}`);
        }

        setAsset(data);
        setError(null);
      } catch (err: any) {
        console.error(`Error fetching asset data for ${symbol}:`, err);
        setError(err.message || 'Failed to load asset data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();

    // Consider adding a refresh interval here if real-time updates are needed
    // const refreshInterval = setInterval(fetchAsset, 60000); // e.g., refresh every minute
    // return () => clearInterval(refreshInterval);

  }, [symbol]); // Re-fetch when the symbol changes

  if (loading) {
    return <div className="loading">Loading asset data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!asset) {
    return <div className="not-found">Asset not found</div>;
  }

  // Ensure property names match the AssetPrice type from lib/types.ts
  const priceChangeClass = asset.changePercent && asset.changePercent >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="asset-display bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-2">{asset.name} ({asset.symbol})</h2>
      <div className="text-xl mb-2">${asset.price.toFixed(2)}</div> {/* Use asset.price */}

      {asset.change !== undefined && asset.changePercent !== undefined && ( // Check for change and changePercent
        <div className={`${priceChangeClass} mb-4`}>
          {asset.change.toFixed(2)} ({asset.changePercent.toFixed(2)}%)
        </div>
      )}

      {/* Assuming description, marketCap, and volume24h are available in the AssetPrice type or fetched separately */}
      {/* If not, these sections might need to be removed or data fetched from another endpoint */}
      {/* For now, commenting them out as they are not in the base AssetPrice type */}
      {/* {asset.description && (
        <div className="mb-4 text-gray-300">{asset.description}</div>
      )}

      {asset.marketCap && (
        <div>
          <span className="text-gray-400">Market Cap:</span>
          <div>${asset.marketCap.toLocaleString()}</div>
        </div>
      )}

      {asset.volume24h && (
        <div>
          <span className="text-gray-400">24h Volume:</span>
          <div>${asset.volume24h.toLocaleString()}</div>
        </div>
      )} */}

      <div className="mt-4 text-sm text-gray-400">
        Last updated: {new Date(asset.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default AssetDisplay;