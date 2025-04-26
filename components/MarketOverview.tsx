"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Removed import from '../lib/strapi/content';
import { MarketOverview as MarketOverviewType } from '../lib/types'; // Import MarketOverview type

const MarketOverview = () => {
  const [overview, setOverview] = useState<MarketOverviewType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // Correctly placed inside the component

  useEffect(() => {
    setMounted(true);
  }, []); // Effect to set mounted to true on client mount

  useEffect(() => {
    if (!mounted) {
      console.log('[MarketOverview] useEffect triggered, but not mounted yet.');
      return; // Only fetch data if mounted on the client
    }

    console.log('[MarketOverview] useEffect triggered. Component is mounted.'); // Keep this log for now

    const fetchOverview = async () => {
      try {
        setLoading(true);
        console.log('[MarketOverview] Attempting to fetch market data...'); // Keep this log
        // Fetch data from the new backend route
        const response = await fetch('/api/market-data/overview');
        console.log('[MarketOverview] Fetch attempt completed.'); // Keep this log
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch market overview');
        }

        setOverview(data);
        setError(null);
      } catch (err: any) {
        console.error('[MarketOverview] Error during fetch:', err); // Keep this log
        setError(err.message || 'Failed to load market overview. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();

    // Refresh data every 5 minutes (adjust interval as needed for real-time data)
    const refreshInterval = setInterval(fetchOverview, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [mounted]); // Add mounted as a dependency

  if (!mounted) {
    return null; // Render nothing on the server or before mounted
  }

  if (loading) {
    return <div className="loading">Loading market data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!overview) {
    return <div className="not-found">Market overview not found</div>;
  }

  const statusColor =
    overview.marketStatus === 'open' ? 'text-green-500' :
    overview.marketStatus === 'closed' ? 'text-red-500' :
    'text-yellow-500';

  return (
    <div className="market-overview bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Market Overview</h2>
        <div className={`${statusColor} font-semibold`}>
          Market {overview.marketStatus.replace('-', ' ')}
        </div>
      </div>

      {overview.marketSummary && (
        <div className="mb-6 text-gray-300">{overview.marketSummary}</div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Indices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ensure indices data structure matches the new API response */}
          {overview.indices.map((index, i) => {
            const changeClass = index.Change >= 0 ? 'text-green-500' : 'text-red-500';
            return (
              <div key={i} className="bg-gray-800 p-4 rounded">
                <div className="font-medium">{index.Name}</div>
                <div className="text-lg">{index.Value.toFixed(2)}</div>
                <div className={changeClass}>
                  {index.Change >= 0 ? '+' : ''}{index.Change.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Top Movers</h3>
        <div className="grid gap-3">
          {/* Ensure topMovers data structure matches the new API response */}
          {overview.topMovers.map((mover, i) => {
            const changeClass = mover.Change >= 0 ? 'text-green-500' : 'text-red-500';
            return (
              <div key={i} className="flex justify-between items-center border-b border-gray-800 pb-2">
                <div>
                  <Link href={`/asset/${mover.Symbol}`} className="font-medium hover:text-[#FF9500]">
                    {mover.Name} ({mover.Symbol})
                  </Link>
                </div>
                <div className="text-right">
                  <div>${mover.Price.toFixed(2)}</div>
                  <div className={changeClass}>
                    {/* Assuming ChangePercent is available in the new API response */}
                    {mover.Change >= 0 ? '+' : ''}{mover.Change.toFixed(2)} ({mover.ChangePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Last updated: {new Date(overview.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default MarketOverview;