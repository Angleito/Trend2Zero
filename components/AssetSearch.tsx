'use client';

import { useState } from 'react';
import { MarketAsset } from '../lib/types';

export default function AssetSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/market-data/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to search assets');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="Search assets..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <div className="absolute left-3 top-3.5">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-500 text-center">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {results.map((asset, index) => (
            <a
              key={asset.symbol}
              href={`/asset/${asset.symbol}`}
              className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                index !== results.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-gray-500">{asset.symbol}</div>
                </div>
                <div className="text-right">
                  <div>${asset.priceInUSD.toLocaleString()}</div>
                  <div className={`text-sm ${
                    asset.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
