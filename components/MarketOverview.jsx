import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMarketOverview } from '../lib/strapi/content';
const MarketOverview = () => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchOverview = async () => {
            try {
                setLoading(true);
                const response = await getMarketOverview();
                if (response.data && response.data.length > 0) {
                    setOverview(response.data[0].attributes);
                    setError(null);
                }
                else {
                    setError('Market overview not found');
                }
            }
            catch (err) {
                console.error('Error fetching market overview from Strapi:', err);
                setError('Failed to load market overview. Please try again later.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchOverview();
        // Refresh data every 5 minutes
        const refreshInterval = setInterval(fetchOverview, 5 * 60 * 1000);
        return () => clearInterval(refreshInterval);
    }, []);
    if (loading) {
        return <div className="loading">Loading market data...</div>;
    }
    if (error) {
        return <div className="error">{error}</div>;
    }
    if (!overview) {
        return <div className="not-found">Market overview not found</div>;
    }
    const statusColor = overview.marketStatus === 'open' ? 'text-green-500' :
        overview.marketStatus === 'closed' ? 'text-red-500' :
            'text-yellow-500';
    return (<div className="market-overview bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Market Overview</h2>
        <div className={`${statusColor} font-semibold`}>
          Market {overview.marketStatus.replace('-', ' ')}
        </div>
      </div>
      
      {overview.marketSummary && (<div className="mb-6 text-gray-300">{overview.marketSummary}</div>)}
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Indices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview.indices.map((index, i) => {
            const changeClass = index.change >= 0 ? 'text-green-500' : 'text-red-500';
            return (<div key={i} className="bg-gray-800 p-4 rounded">
                <div className="font-medium">{index.name}</div>
                <div className="text-lg">{index.value.toFixed(2)}</div>
                <div className={changeClass}>
                  {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                </div>
              </div>);
        })}
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-3">Top Movers</h3>
        <div className="grid gap-3">
          {overview.topMovers.map((mover, i) => {
            const changeClass = mover.change >= 0 ? 'text-green-500' : 'text-red-500';
            return (<div key={i} className="flex justify-between items-center border-b border-gray-800 pb-2">
                <div>
                  <Link href={`/asset/${mover.symbol}`} className="font-medium hover:text-[#FF9500]">
                    {mover.name} ({mover.symbol})
                  </Link>
                </div>
                <div className="text-right">
                  <div>${mover.price.toFixed(2)}</div>
                  <div className={changeClass}>
                    {mover.change >= 0 ? '+' : ''}{mover.change.toFixed(2)} ({mover.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>);
        })}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        Last updated: {new Date(overview.lastUpdated).toLocaleString()}
      </div>
    </div>);
};
export default MarketOverview;
