'use client';

import { useState, useEffect } from 'react';
import { MarketAsset } from '../lib/types';
import StickyHeader from '../components/StickyHeader';
import AssetPriceTable from '../components/AssetPriceTable';
import AssetSearch from '../components/AssetSearch';

interface ClientHomePageProps {
  initialAssets: MarketAsset[];
}

export default function ClientHomePage({ initialAssets }: ClientHomePageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <StickyHeader />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#FF9500] mb-4"
              aria-label="Loading market data"
            />
            <p className="text-xl text-gray-600">
              Preparing your dashboard
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StickyHeader />
      <main className="flex-grow p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-white">Market Overview</h1>
          
          <div className="mb-8">
            <AssetSearch />
          </div>

          {initialAssets.length === 0 ? (
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
          ) : (
            <AssetPriceTable
              assets={initialAssets}
              showCategory={true}
              data-testid="asset-price-table"
            />
          )}
        </div>
      </main>
    </div>
  );
}