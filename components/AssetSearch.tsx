'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import marketDataService from '../lib/services/marketDataService';
import type { MarketAsset } from '../lib/types';

interface AssetSearchProps {
  onAssetSelect?: (asset: MarketAsset) => void;
}

const AssetSearch = ({ onAssetSelect }: AssetSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    const searchAssets = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const marketService = marketDataService;
        const assets = await marketService.listAvailableAssets({
          limit: 10,
          searchQuery: searchTerm
        });

        const filteredResults = assets.filter((asset: MarketAsset) =>
          (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setSearchResults(filteredResults);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching assets:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchAssets();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAssetClick = (asset: MarketAsset) => {
    if (onAssetSelect) {
      onAssetSelect(asset);
    }
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-[#FF9500] focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#FF9500]"></div>
          </div>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {searchResults.map((asset) => (
              <li key={asset.symbol}>
                <Link
                  href={`/asset/${asset.symbol}`}
                  className="flex items-center px-4 py-2 hover:bg-gray-700 transition-colors"
                  onClick={() => handleAssetClick(asset)}
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full mr-3">
                    <span className="text-sm font-medium text-gray-300">
                      {asset.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{asset.name || asset.symbol}</p>
                    <p className="text-xs text-gray-400">
                      {asset.symbol} • {asset.type || 'Unknown'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults && searchTerm.length >= 2 && searchResults.length === 0 && !loading && (
        <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg p-4 text-center">
          <p className="text-gray-400">No assets found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default AssetSearch;
