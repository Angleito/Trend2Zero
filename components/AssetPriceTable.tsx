'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import React, { useState, useEffect } from 'react';
import { MarketDataService } from '../lib/services/marketDataService';
import type { MarketAsset, AssetData, AssetCategory } from '../lib/types';
import Link from 'next/link';

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
  const [assetData, setAssetData] = useState<Record<string, AssetData>>({});
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
        const marketService = new MarketDataService();
        const assetList = await marketService.listAvailableAssets({
          category,
          pageSize: limit
        });
        setAssets(assetList);

        // Fetch price data for each asset
        const dataPromises = assetList.map(asset =>
          marketService.getAssetPriceInBTC(asset.symbol)
        );

        const results = await Promise.allSettled(dataPromises);
        const newAssetData: Record<string, AssetData> = {};

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            newAssetData[assetList[index].symbol] = result.value;
          }
        });

        setAssetData(newAssetData);
        setError(null);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load assets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [category, limit]);

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
          const aPrice = assetData[a.symbol]?.priceInBTC || 0;
          const bPrice = assetData[b.symbol]?.priceInBTC || 0;
          return sortConfig.direction === 'ascending'
            ? aPrice - bPrice
            : bPrice - aPrice;
        }

        // For price in USD sorting
        if (sortConfig.key === 'priceInUSD') {
          const aPrice = assetData[a.symbol]?.priceInUSD || 0;
          const bPrice = assetData[b.symbol]?.priceInUSD || 0;
          return sortConfig.direction === 'ascending'
            ? aPrice - bPrice
            : bPrice - aPrice;
        }

        // For name sorting
        if (sortConfig.key === 'name') {
          return sortConfig.direction === 'ascending'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }

        // For symbol sorting
        if (sortConfig.key === 'symbol') {
          return sortConfig.direction === 'ascending'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        }

        // For category sorting
        if (sortConfig.key === 'type') {
          return sortConfig.direction === 'ascending'
            ? a.type.localeCompare(b.type)
            : b.type.localeCompare(a.type);
        }

        return 0;
      });
    }
    return sortableAssets;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatBTCPrice = (price: number) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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
          {getSortedAssets().map((asset) => {
            const data = assetData[asset.symbol];
            return (
              <tr
                key={asset.symbol}
                className="hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/asset/${asset.symbol}`}
                    className="text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    {asset.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {asset.symbol}
                </td>
                {showCategory && (
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {asset.type}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {data ? formatPrice(data.priceInUSD) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {data ? formatBTCPrice(data.priceInBTC) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AssetPriceTable;
