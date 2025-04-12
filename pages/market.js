/**
 * Market Page
 * 
 * This page displays market data for different asset types.
 */

import { useState } from 'react';
import Head from 'next/head';
import { usePopularAssets, useAssetsByType, useAssetSearch } from '../lib/hooks/useMarketData';
import AssetCard from '../components/AssetCard';

// Asset type options
const assetTypes = [
  { id: 'popular', label: 'Popular' },
  { id: 'Cryptocurrency', label: 'Cryptocurrencies' },
  { id: 'Stocks', label: 'Stocks' },
  { id: 'Precious Metal', label: 'Precious Metals' }
];

/**
 * Market Page Component
 * @returns {JSX.Element} - Page JSX
 */
const MarketPage = () => {
  const [selectedType, setSelectedType] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch popular assets
  const { 
    popularAssets, 
    loading: loadingPopular 
  } = usePopularAssets(12);
  
  // Fetch assets by type
  const { 
    assets: typeAssets, 
    loading: loadingType 
  } = useAssetsByType(selectedType === 'popular' ? null : selectedType, 12);
  
  // Search assets
  const { 
    search, 
    searchResults, 
    loading: loadingSearch 
  } = useAssetSearch();
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
    }
  };
  
  // Determine which assets to display
  const displayAssets = searchQuery.trim() 
    ? searchResults 
    : selectedType === 'popular' 
      ? popularAssets 
      : typeAssets;
  
  // Loading state
  const isLoading = searchQuery.trim() 
    ? loadingSearch 
    : selectedType === 'popular' 
      ? loadingPopular 
      : loadingType;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Market Data | Trend2Zero</title>
        <meta name="description" content="Explore cryptocurrency, stock, and precious metal market data" />
      </Head>
      
      <h1 className="text-3xl font-bold mb-6">Market Data</h1>
      
      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors duration-200"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Asset Type Tabs */}
      {!searchQuery.trim() && (
        <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
          {assetTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors duration-200 ${
                selectedType === type.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Assets Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : displayAssets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayAssets.map((asset) => (
            <AssetCard
              key={asset.symbol}
              asset={asset}
              showDetails={false}
              autoRefresh={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">
            {searchQuery.trim()
              ? `No results found for "${searchQuery}"`
              : 'No assets found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketPage;
