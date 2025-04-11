'use client';

import React, { useState, useEffect } from 'react';
import type { AssetCategory } from '../../lib/types';
import Link from 'next/link';

// Import client components directly
import StickyHeader from '../../components/StickyHeader';
import AssetPriceTable from '../../components/AssetPriceTable';
import AssetSearch from '../../components/AssetSearch';
import { useMarketData } from '../../lib/hooks/useMarketData';

export default function TrackerPage() {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'All'>('All');
  const [isClientSide, setIsClientSide] = useState(false);

  const categories: (AssetCategory | 'All')[] = ['All', 'Stocks', 'Commodities', 'Indices', 'Cryptocurrency'];
  
  // Use market data hook with default options
  const marketData = useMarketData({
    type: selectedCategory === 'All' ? null : selectedCategory,
    limit: 50
  });

  // Safely handle marketData properties
  const loading = marketData?.loading ?? true;
  const error = marketData?.error ?? null;
  const assets = marketData?.popularAssets ?? [];

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  // Retry market data fetch if there's an error
  const handleRetry = () => {
    marketData.refetch();
  };

  // If not client-side, return null to prevent hydration errors
  if (!isClientSide) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" data-testid="tracker-page">
      <StickyHeader />

      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-8 text-center">Asset Tracker</h1>

          {/* Error Handling */}
          {error && (
            <div className="bg-red-600 text-white p-4 rounded-md mb-8 text-center" data-testid="error-message">
              <p>{error}</p>
              <button
                onClick={handleRetry}
                className="mt-4 bg-[#FF9500] text-black px-4 py-2 rounded hover:bg-opacity-80"
                data-testid="retry-button"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center text-xl mb-8 flex flex-col items-center" data-testid="loading-spinner">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF9500] mb-4"></div>
              <p>Loading market data...</p>
            </div>
          )}

          {/* Main Content - Only show when not loading and no error */}
          {!loading && !error && (
            <>
              {/* Search and Category Selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="md:col-span-2 overflow-x-auto">
                  <div className="flex space-x-4 pb-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`asset-category-btn ${selectedCategory === category ? 'asset-category-btn-active' : ''}`}
                        data-testid={`category-btn-${category.toLowerCase()}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <AssetSearch />
                </div>
              </div>

              {/* Asset Table */}
              <AssetPriceTable
                category={selectedCategory === 'All' ? undefined : selectedCategory}
                limit={50}
                showCategory={true}
                data-testid="asset-price-table"
              />
            </>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="text-[#FF9500] hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}