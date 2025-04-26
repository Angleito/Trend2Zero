'use client';

import { useState, useEffect } from 'react';
import { useWatchlist } from '../../../lib/hooks/useWatchlist';
import { useAuth } from '../../../lib/hooks/useAuth';
import TradingViewLightweightChart from '../../../components/TradingViewLightweightChart';

interface ClientAssetPageProps {
  symbol: string;
  initialPriceData: any;
  initialHistoricalData: any;
}

export default function ClientAssetPage({ 
  symbol,
  initialPriceData,
  initialHistoricalData
}: ClientAssetPageProps) {
  const [priceData, setPriceData] = useState(initialPriceData);
  const [historicalData, setHistoricalData] = useState(initialHistoricalData);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { isAuthenticated } = useAuth();

  // Fetch real-time price updates
  useEffect(() => {
    const fetchPriceUpdates = async () => {
      try {
        const response = await fetch(`/api/market-data/price/${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch price updates');
        const data = await response.json();
        setPriceData(data);
      } catch (error) {
        console.error('Error fetching price updates:', error);
      }
    };

    const interval = setInterval(fetchPriceUpdates, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [symbol]);

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) return;
    
    if (isInWatchlist(symbol)) {
      await removeFromWatchlist(symbol);
    } else {
      await addToWatchlist(symbol, priceData?.data?.type || 'Cryptocurrency');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{priceData?.data?.name || symbol}</h1>
          <p className="text-gray-400">Symbol: {symbol}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Price Information</h2>
            <div className="space-y-2">
              <p className="text-2xl">${priceData?.data?.priceInUSD?.toLocaleString()}</p>
              <p className={priceData?.data?.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                {priceData?.data?.change24h >= 0 ? '+' : ''}{priceData?.data?.change24h?.toFixed(2)}%
              </p>
              <p className="text-gray-400">{priceData?.data?.priceInBTC} BTC</p>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Market Data</h2>
            <div className="space-y-2">
              <p>Market Cap: ${priceData?.data?.marketCap?.toLocaleString()}</p>
              <p>24h Volume: ${priceData?.data?.volume24h?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Price Chart</h2>
          <div className="h-[400px]">
            <TradingViewLightweightChart
              symbol={symbol}
              theme="dark"
              height={400}
            />
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={handleWatchlistToggle}
            className={`px-4 py-2 rounded-md transition-colors ${
              isInWatchlist(symbol)
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-[#FF9500] hover:bg-[#FF9500]/80'
            }`}
          >
            {isInWatchlist(symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        )}
      </div>
    </div>
  );
}