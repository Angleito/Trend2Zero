'use client';

import { useState, useEffect } from 'react';
import { MarketAsset } from '../lib/types';
import Link from 'next/link';

interface AssetPriceTableProps {
  assets?: MarketAsset[];
  showCategory?: boolean;
  limit?: number;
  category?: string;
  'data-testid'?: string;
}

export default function AssetPriceTable({ 
  assets: controlledAssets,
  showCategory = true, 
  limit = 10, 
  category,
  'data-testid': dataTestId
}: AssetPriceTableProps) {
  const [assets, setAssets] = useState<MarketAsset[]>(controlledAssets || []);
  const [loading, setLoading] = useState(!controlledAssets);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (controlledAssets) {
      setAssets(controlledAssets);
      return;
    }

    const fetchAssets = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('limit', limit.toString());
        if (category) {
          params.set('category', category);
        }

        const response = await fetch(`/api/market-data/popular?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch assets');
        const data = await response.json();
        setAssets(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [controlledAssets, limit, category]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF9500]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid={dataTestId}>
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4">Asset</th>
            <th className="text-right py-3 px-4">Price</th>
            <th className="text-right py-3 px-4">24h Change</th>
            {showCategory && <th className="text-right py-3 px-4">Category</th>}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.symbol}
              className="border-b border-gray-800 hover:bg-gray-900 transition-colors"
            >
              <td className="py-3 px-4">
                <Link href={`/asset/${asset.symbol}`} className="hover:text-[#FF9500]">
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-gray-400">{asset.symbol}</div>
                </Link>
              </td>
              <td className="text-right py-3 px-4">
                <div>${asset.priceInUSD.toLocaleString()}</div>
                <div className="text-sm text-gray-400">{asset.priceInBTC.toFixed(8)} BTC</div>
              </td>
              <td className={`text-right py-3 px-4 ${
                asset.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
              </td>
              {showCategory && (
                <td className="text-right py-3 px-4 text-gray-400">
                  {asset.type}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
