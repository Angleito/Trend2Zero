'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MarketDataService } from '../../../lib/services/marketDataService';
import type { AssetData } from '../../../lib/types';

// Import client components directly
import AssetPriceConverter from '../../../components/AssetPriceConverter';
import ChartContainer from '../../../components/ChartContainer';
import StickyHeader from '../../../components/StickyHeader';
import BitcoinTicker from '../../../components/BitcoinTicker';

const AssetDetailPage: React.FC = () => {
  const params = useParams();
  const symbol = params?.symbol as string | undefined;

  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetData = async () => {
      if (!symbol) {
        setError('No symbol provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const marketService = new MarketDataService();
        const data = await marketService.getAssetPriceInBTC(symbol);
        setAssetData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching asset data:', err);
        setError('Failed to load asset data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <StickyHeader />
        <BitcoinTicker />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF9500]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className="min-h-screen bg-black">
        <StickyHeader />
        <BitcoinTicker />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-red-500 mb-6">{error || 'Asset not found'}</p>
            <a href="/tracker" className="bg-[#FF9500] hover:bg-opacity-90 text-white px-6 py-2 rounded-md transition-colors">
              Back to Asset Tracker
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <StickyHeader />
      <BitcoinTicker />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{symbol}</h1>
          <p className="text-gray-400">Symbol: {symbol}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <ChartContainer
              symbol={symbol || ''}
              height={400}
              theme="dark"
              interval="1d"
            />
          </div>

          <div>
            <AssetPriceConverter assetSymbol={symbol || ''} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Asset Performance</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-black">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Change
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Change %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {assetData.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={assetData.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {assetData.change >= 0 ? '+' : ''}{assetData.change.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={assetData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {assetData.changePercent >= 0 ? '+' : ''}{assetData.changePercent.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
