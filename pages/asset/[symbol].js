/**
 * Asset Detail Page
 * 
 * This page displays detailed information about a specific asset.
 */

const React = require('react');
const { useState } = require('react');
const { useRouter } = require('next/router');
const Head = require('next/head');
const { useAssetPrice, useHistoricalData } = require('../../lib/hooks/useMarketData');
const { useWatchlist } = require('../../lib/hooks/useWatchlist');
const { useAuth } = require('../../lib/hooks/useAuth');

// Time period options for historical data
const timePeriods = [
  { id: '7', label: '7D' },
  { id: '30', label: '1M' },
  { id: '90', label: '3M' },
  { id: '180', label: '6M' },
  { id: '365', label: '1Y' },
  { id: 'max', label: 'All' }
];

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
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
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
 * Asset Detail Page Component
 * @returns {JSX.Element} - Page JSX
 */
const AssetDetailPage = () => {
  const router = useRouter();
  const { symbol } = router.query;
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { isAuthenticated } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [isAdding, setIsAdding] = useState(false);
  const { data: priceData, isLoading: isPriceLoading } = useAssetPrice(symbol);
  const { data: historicalData, isLoading: isHistoricalLoading } = useHistoricalData(symbol);
  
  // Handle period change
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };
  
  // Handle watchlist toggle
  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    try {
      setIsAdding(true);
      const assetType = priceData?.data?.type || 'Cryptocurrency';
      
      if (isInWatchlist(symbol)) {
        await removeFromWatchlist(symbol);
      } else {
        await addToWatchlist(symbol, assetType);
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    } finally {
      setIsAdding(false);
    }
  };
  
  // Loading state
  if (!symbol || isPriceLoading || isHistoricalLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const asset = priceData?.data;
  if (!asset) return null;
  
  // Determine price change color
  const changeColor = asset.change24h > 0 
    ? 'text-green-500' 
    : asset.change24h < 0 
      ? 'text-red-500' 
      : 'text-gray-500';
  
  // Format last updated date
  const lastUpdated = asset.lastUpdated 
    ? new Date(asset.lastUpdated).toLocaleString() 
    : 'Unknown';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>{symbol ? `${symbol.toUpperCase()} - Asset Details` : 'Loading...'}</title>
        <meta name="description" content={`${asset.name} (${asset.symbol}) price, charts, and market data`} />
      </Head>
      
      {/* Asset Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{asset.name}</h1>
          <div className="flex items-center text-gray-500">
            <span className="text-xl mr-2">{asset.symbol}</span>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
              {asset.type}
            </span>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleWatchlistToggle}
            disabled={isAdding}
            className={`flex items-center px-4 py-2 rounded transition-colors duration-200 ${
              isInWatchlist(symbol)
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {isInWatchlist(symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        </div>
      </div>
      
      {/* Price Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <div className="text-gray-500 text-sm mb-1">Price</div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold mr-2">
                ${formatPrice(asset.priceInUSD)}
              </span>
              <span className={`text-lg ${changeColor}`}>
                {formatChange(asset.change24h)}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatPrice(asset.priceInBTC)} BTC
            </div>
          </div>
          
          {asset.marketCap && (
            <div className="mt-4 md:mt-0">
              <div className="text-gray-500 text-sm mb-1">Market Cap</div>
              <div className="text-xl font-semibold">
                ${asset.marketCap.toLocaleString()}
              </div>
            </div>
          )}
          
          {asset.volume24h && (
            <div className="mt-4 md:mt-0">
              <div className="text-gray-500 text-sm mb-1">24h Volume</div>
              <div className="text-xl font-semibold">
                ${asset.volume24h.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-4">
          Last updated: {lastUpdated}
        </div>
      </div>
      
      {/* Historical Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Price Chart</h2>
          
          <div className="flex space-x-2">
            {timePeriods.map((period) => (
              <button
                key={period.id}
                onClick={() => handlePeriodChange(period.id)}
                className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                  selectedPeriod === period.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
        
        {isHistoricalLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : historicalData?.data?.dataPoints?.length > 0 ? (
          <div className="h-64">
            {/* Chart would go here - using a placeholder */}
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-gray-500">
                Chart visualization would be rendered here with the {historicalData.data.dataPoints.length} data points
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-gray-500">No historical data available</p>
          </div>
        )}
      </div>
      
      {/* Additional Information */}
      {asset.returns && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {asset.returns.ytd !== undefined && (
              <div>
                <div className="text-gray-500 text-sm mb-1">Year to Date</div>
                <div className={asset.returns.ytd >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {formatChange(asset.returns.ytd)}
                </div>
              </div>
            )}
            
            {asset.returns.oneYear !== undefined && (
              <div>
                <div className="text-gray-500 text-sm mb-1">1 Year</div>
                <div className={asset.returns.oneYear >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {formatChange(asset.returns.oneYear)}
                </div>
              </div>
            )}
            
            {asset.returns.threeYear !== undefined && (
              <div>
                <div className="text-gray-500 text-sm mb-1">3 Years</div>
                <div className={asset.returns.threeYear >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {formatChange(asset.returns.threeYear)}
                </div>
              </div>
            )}
            
            {asset.returns.fiveYear !== undefined && (
              <div>
                <div className="text-gray-500 text-sm mb-1">5 Years</div>
                <div className={asset.returns.fiveYear >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {formatChange(asset.returns.fiveYear)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Refresh Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => {
            refetchPrice();
            refetchHistory();
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors duration-200"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

module.exports = AssetDetailPage;
