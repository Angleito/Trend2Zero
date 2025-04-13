'use client';

import React, { useMemo, useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { useMounted } from '../lib/hooks/useMounted';
import { useMarketData } from '../lib/hooks/useMarketData';
import { MarketAsset } from '../lib/types';

// Import client components directly
import StickyHeader from '../components/StickyHeader';
import AssetPriceTable from '../components/AssetPriceTable';
import AssetSearch from '../components/AssetSearch';

export default function HomePage() {
  // Use useMounted to prevent hydration mismatches
  const isMounted = useMounted({ delayMs: 300 });
  
  // Memoize options to prevent unnecessary re-renders
  const options = useMemo(() => ({ limit: 10 }), []);
  
  // Use market data hook with error handling
  const { assets: popularAssets, loading, error, refetch } = useMarketData(options);

  // Render loading state or error state before content
  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex flex-col" data-testid="home-page-loading">
        <StickyHeader />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#FF9500] mb-4"
              aria-label="Loading market data"
            />
            <p className="text-xl text-gray-600">
              {loading ? 'Loading market data...' : 'Preparing your dashboard'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Render error state if there's an error
  if (error) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col" data-testid="home-page-error">
          <StickyHeader />
          <main className="flex-grow p-6 flex items-center justify-center">
            <div className="text-center bg-red-100 p-8 rounded-lg">
              <h2 className="text-2xl text-red-700 mb-4">Market Data Error</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button 
                onClick={refetch} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry Loading
              </button>
            </div>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  // Render main content
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col" data-testid="home-page">
        <StickyHeader />
        
        <main className="flex-grow p-6">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Market Overview</h1>
            
            {/* Search Component */}
            <div className="mb-8">
              <AssetSearch />
            </div>

            {/* No Assets Found State */}
            {popularAssets.length === 0 && (
              <div 
                className="text-center bg-gray-800 p-8 rounded-lg" 
                data-testid="no-assets-message"
              >
                <p className="text-xl text-gray-300 mb-4">
                  No assets found
                </p>
                <p className="text-gray-500">
                  Try refreshing the page or checking your market data configuration.
                </p>
              </div>
            )}

            {/* Asset Table */}
            {popularAssets.length > 0 && (
              <AssetPriceTable
                assets={popularAssets}
                showCategory={true}
                data-testid="asset-price-table"
              />
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
