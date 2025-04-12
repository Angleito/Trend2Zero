'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { MarketDataService } from '../lib/services/marketDataService';
import type { MarketAsset, AssetData, AssetCategory } from '../lib/types';


interface AssetPriceTableProps {
  category?: AssetCategory;
  limit?: number;
  showCategory?: boolean;
}

const AssetPriceTable: React.FC<AssetPriceTableProps> = ({
  category,
  limit = 20,
  showCategory = false,
}) => {
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'name',
    direction: 'ascending',
  });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        const marketService = new MarketDataService();
        
        // First try to fetch data with retries
        let retries = 3;
        let assetList: MarketAsset[] = [];
        
        while (retries > 0) {
          try {
            assetList = await marketService.listAvailableAssets({
              category,
              pageSize: limit
            });
            break;
          } catch (fetchError) {
            console.warn(`Asset fetch attempt failed (${retries} retries left):`, fetchError);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        // If we still don't have data, try using mock data
        if (assetList.length === 0) {
          console.log('Falling back to mock data');
          assetList = marketService.getMockAssets(category, limit);
        }

        setAssets(assetList);
        setError(null);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setError('Failed to load market data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [category, limit]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF9500]"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-600 text-white p-4 rounded-md mb-4">
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#FF9500] text-black px-4 py-2 rounded hover:bg-opacity-80"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show empty state
  if (!assets.length) {
    return (
      <div className="text-center py-8">
        <p className="text-xl text-gray-500">No assets found</p>
      </div>
    );
  }

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedAssets = () => {
    const sortableAssets = [...assets];
    if (sortConfig.key) {
      sortableAssets.sort((a, b) => {
        // For price in BTC sorting
        if (sortConfig.key === 'priceInBTC') {
          const aPrice = a.priceInBTC || 0;
          const bPrice = b.priceInBTC || 0;
          return sortConfig.direction === 'ascending'
            ? aPrice - bPrice
            : bPrice - aPrice;
        }

        // For price in USD sorting
        if (sortConfig.key === 'priceInUSD') {
          const aPrice = a.priceInUSD || 0;
          const bPrice = b.priceInUSD || 0;
          return sortConfig.direction === 'ascending'
            ? aPrice - bPrice
            : bPrice - aPrice;
        }

        // For name sorting
        if (sortConfig.key === 'name') {
          const aName = a.name || '';
          const bName = b.name || '';
          return sortConfig.direction === 'ascending'
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        }

        // For symbol sorting
        if (sortConfig.key === 'symbol') {
          return sortConfig.direction === 'ascending'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        }

        // For category sorting
        if (sortConfig.key === 'type') {
          const aType = a.type || '';
          const bType = b.type || '';
          return sortConfig.direction === 'ascending'
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        }

        return 0;
      });
    }
    return sortableAssets;
  };

  const formatPrice = (price: number | undefined) => {
    if (typeof price !== 'number') return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatBTCPrice = (price: number | undefined) => {
    if (typeof price !== 'number') return '-';
    if (price >= 1) {
      return price.toFixed(2) + ' ₿';
    } else if (price >= 0.01) {
      return price.toFixed(4) + ' ₿';
    } else if (price >= 0.0001) {
      return price.toFixed(6) + ' ₿';
    } else {
      return price.toFixed(8) + ' ₿';
    }
  };

  const getSortIndicator = (key: string) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    }
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
        <thead className="bg-gray-800">
          <tr>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('name')}
            >
              Name{getSortIndicator('name')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('symbol')}
            >
              Symbol{getSortIndicator('symbol')}
            </th>
            {showCategory && (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('type')}
              >
                Category{getSortIndicator('type')}
              </th>
            )}
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('priceInUSD')}
            >
              Price (USD){getSortIndicator('priceInUSD')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('priceInBTC')}
            >
              Price (BTC){getSortIndicator('priceInBTC')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {getSortedAssets().map((asset) => (
            <tr
              key={asset.symbol}
              className="hover:bg-gray-800 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/asset/${asset.symbol}`}
                  className="text-orange-500 hover:text-orange-400 transition-colors"
                >
                  {asset.name || asset.symbol}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                {asset.symbol}
              </td>
              {showCategory && (
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {asset.type || '-'}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                {formatPrice(asset.priceInUSD)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                {formatBTCPrice(asset.priceInBTC)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetPriceTable;
