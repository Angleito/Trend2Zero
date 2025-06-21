/**
 * Asset Card Component
 * 
 * This component displays information about an asset in a card format.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useAssetPrice } from '../lib/hooks/useMarketData';
import { useWatchlist } from '../lib/hooks/useWatchlist';
import { useAuth } from '../lib/hooks/useAuth';

// Asset type icons
const assetTypeIcons = {
  Cryptocurrency: '₿',
  Stocks: '📈',
  'Precious Metal': '🥇',
  Commodities: '🛢️',
  Indices: '📊'
};

/**
 * Format price with appropriate precision
 * @param {number} price - Price to format
 * @returns {string} - Formatted price
 */
const formatPrice = (price) => {
  if (price === undefined || price === null) return 'N/A';
  
  if (price < 0.01) {
    return price.toFixed(6);
  } else if (price < 1) {
    return price.toFixed(4);
  } else if (price < 10000) {
    return price.toFixed(2);
  } else {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
};

/**
 * Format percentage change
 * @param {number} change - Percentage change
 * @returns {string} - Formatted percentage
 */
const formatChange = (change) => {
  if (change === undefined || change === null) return 'N/A';
  
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

/**
 * Asset Card Component
 * @param {Object} props - Component props
 * @param {Object} props.asset - Asset data
 * @param {boolean} props.showDetails - Whether to show additional details
 * @param {boolean} props.autoRefresh - Whether to auto-refresh price data
 * @returns {JSX.Element} - Component JSX
 */
const AssetCard = ({ asset, showDetails = false, autoRefresh = false }) => {
  const { isAuthenticated } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [isAdding, setIsAdding] = useState(false);
  
  // Get real-time price data
  const { priceData, loading, error } = useAssetPrice(
    asset.symbol,
    autoRefresh,
    60000 // Refresh every minute
  );
  
  // Use either the fetched price data or the passed asset data
  const displayData = priceData?.data || asset;
  const inWatchlist = isInWatchlist(asset.symbol);
  
  // Handle watchlist toggle
  const handleWatchlistToggle = async () => {
    try {
      setIsAdding(true);
      if (inWatchlist) {
        await removeFromWatchlist(asset.symbol);
      } else {
        await addToWatchlist(asset.symbol, asset.type || 'Cryptocurrency');
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    } finally {
      setIsAdding(false);
    }
  };
  
  // Determine price change color
  const changeColor = displayData.change24h > 0 
    ? 'text-green-500' 
    : displayData.change24h < 0 
      ? 'text-red-500' 
      : 'text-gray-500';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <Link href={`/asset/${asset.symbol}`}>
            <h3 className="text-lg font-semibold hover:text-blue-500 transition-colors duration-200">
              {asset.name || displayData.name}
            </h3>
          </Link>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="mr-2">{asset.symbol}</span>
            <span title={asset.type || displayData.type}>
              {assetTypeIcons[asset.type || displayData.type] || '🔹'}
            </span>
          </div>
        </div>
        
        {isAuthenticated && (
          <button
            onClick={handleWatchlistToggle}
            disabled={isAdding}
            className="text-gray-400 hover:text-yellow-500 focus:outline-none transition-colors duration-200"
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            {inWatchlist ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <div className="text-2xl font-bold">
            ${loading ? '...' : formatPrice(displayData.priceInUSD)}
          </div>
          <div className={`text-sm ${changeColor}`}>
            {loading ? '...' : formatChange(displayData.change24h)}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? '...' : formatPrice(displayData.priceInBTC)} BTC
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {displayData.lastUpdated ? new Date(displayData.lastUpdated).toLocaleTimeString() : ''}
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {displayData.marketCap && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">Market Cap:</span>
              <span>${displayData.marketCap.toLocaleString()}</span>
            </div>
          )}
          
          {displayData.volume24h && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">24h Volume:</span>
              <span>${displayData.volume24h.toLocaleString()}</span>
            </div>
          )}
          
          {displayData.returns && displayData.returns.ytd && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">YTD Return:</span>
              <span className={displayData.returns.ytd >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatChange(displayData.returns.ytd)}
              </span>
            </div>
          )}
          
          <Link href={`/asset/${asset.symbol}`}>
            <div className="mt-3 text-center text-blue-500 hover:text-blue-600 text-sm font-medium">
              View Details
            </div>
          </Link>
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-xs text-red-500">
          Error loading data
        </div>
      )}
    </div>
  );
};

export default AssetCard;
