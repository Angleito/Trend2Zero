import { useState, useEffect } from 'react';
import { getAssetBySymbol } from '../lib/strapi/content';
const AssetDisplay = ({ symbol }) => {
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchAsset = async () => {
            try {
                setLoading(true);
                const response = await getAssetBySymbol(symbol);
                if (response.data && response.data.length > 0) {
                    setAsset(response.data[0].attributes);
                    setError(null);
                }
                else {
                    setError(`Asset with symbol ${symbol} not found`);
                }
            }
            catch (err) {
                console.error('Error fetching asset from Strapi:', err);
                setError('Failed to load asset data. Please try again later.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchAsset();
    }, [symbol]);
    if (loading) {
        return <div className="loading">Loading asset data...</div>;
    }
    if (error) {
        return <div className="error">{error}</div>;
    }
    if (!asset) {
        return <div className="not-found">Asset not found</div>;
    }
    const priceChangeClass = asset.priceChange && asset.priceChange >= 0 ? 'text-green-500' : 'text-red-500';
    return (<div className="asset-display bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-2">{asset.name} ({asset.symbol})</h2>
      <div className="text-xl mb-2">${asset.currentPrice.toFixed(2)}</div>
      
      {asset.priceChange && asset.priceChangePercent && (<div className={`${priceChangeClass} mb-4`}>
          {asset.priceChange.toFixed(2)} ({asset.priceChangePercent.toFixed(2)}%)
        </div>)}
      
      {asset.description && (<div className="mb-4 text-gray-300">{asset.description}</div>)}
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        {asset.marketCap && (<div>
            <span className="text-gray-400">Market Cap:</span>
            <div>${asset.marketCap.toLocaleString()}</div>
          </div>)}
        
        {asset.volume24h && (<div>
            <span className="text-gray-400">24h Volume:</span>
            <div>${asset.volume24h.toLocaleString()}</div>
          </div>)}
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        Last updated: {new Date(asset.lastUpdated).toLocaleString()}
      </div>
    </div>);
};
export default AssetDisplay;
