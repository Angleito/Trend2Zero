'use client';

import { useState } from 'react';
import { MarketAsset } from '../../lib/types';
import StickyHeader from '../../components/StickyHeader';
import AssetPriceTable from '../../components/AssetPriceTable';
import AssetSearch from '../../components/AssetSearch';

const categories = ['All', 'Crypto', 'Stocks', 'Forex', 'Commodities'];

interface ClientTrackerPageProps {
  initialAssets: MarketAsset[];
}

export default function ClientTrackerPage({ initialAssets }: ClientTrackerPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [assets, setAssets] = useState(initialAssets);

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    try {
      const params = new URLSearchParams({
        limit: '20',
        ...(category !== 'All' && { category })
      });
      
      const response = await fetch(`/api/market-data/popular?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <StickyHeader />
      <main className="flex-grow p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Asset Tracker</h1>
          
          <div className="mb-8">
            <AssetSearch />
          </div>

          <div className="mb-8 flex justify-center space-x-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#FF9500] text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <AssetPriceTable
            assets={assets}
            showCategory={true}
            category={selectedCategory !== 'All' ? selectedCategory : undefined}
          />
        </div>
      </main>
    </div>
  );
}