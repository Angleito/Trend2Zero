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
        setError(null);
        const marketService = new MarketDataService();
        
        // Retry mechanism for fetching assets
        let retries = 3;
        let assetList: MarketAsset[] = [];
        while (retries > 0) {
          try {
            assetList = await marketService.listAvailableAssets({
              category,
              pageSize: limit
            });
            if (assetList.length > 0) break;
          } catch (fetchError) {
            console.warn(`Asset fetch attempt failed (${retries} retries left):`, fetchError);
          }
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (assetList.length === 0) {
          throw new Error('No assets could be fetched');
        }

        setAssets(assetList);

        // Fetch price data for each asset with retry
        const dataPromises = assetList.map(async (asset) => {
          let retries = 3;
          while (retries > 0) {
            try {
              const priceData = await marketService.getAssetPriceInBTC(asset.symbol);
              return { symbol: asset.symbol, data: priceData };
            } catch (priceError) {
              console.warn(`Price fetch failed for ${asset.symbol} (${retries} retries left):`, priceError);
            }
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          return null;
        });

        const results = await Promise.allSettled(dataPromises);
        const newAssetData: Record<string, AssetData> = {};

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value && result.value.data) {
            newAssetData[result.value.symbol] = result.value.data;
          }
        });

        setAssetData(newAssetData);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load assets. Please try again later.');
        setAssets([]);
        setAssetData({});
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
          onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}
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
