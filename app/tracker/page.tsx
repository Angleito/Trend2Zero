'use client';

import React, { useState } from 'react';
import type { AssetCategory } from '../../lib/types';

// Import client components directly
import StickyHeader from '../../components/StickyHeader';
import AssetPriceTable from '../../components/AssetPriceTable';
import AssetSearch from '../../components/AssetSearch';

export default function TrackerDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'All'>('All');

  const categories: (AssetCategory | 'All')[] = ['All', 'Stocks', 'Commodities', 'Indices', 'Cryptocurrency'];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <StickyHeader />

      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-8 text-center">Asset Tracker</h1>

          {/* Search and Category Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2 overflow-x-auto">
              <div className="flex space-x-4 pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`asset-category-btn ${selectedCategory === category ? 'asset-category-btn-active' : ''}`}
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
          />
        </div>
      </main>
    </div>
  );
}