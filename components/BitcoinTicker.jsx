'use client';
import { useState, useEffect } from 'react';
import { useBitcoinStore } from '../lib/stores/bitcoinStore.new';
const BitcoinTicker = () => {
    const [isClient, setIsClient] = useState(false);
    const [error, setError] = useState(null);
    const { price, marketCap, dominance, updateBitcoinData } = useBitcoinStore();
    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        const fetchBitcoinPrice = async () => {
            try {
                console.log('Fetching Bitcoin price...');
                const response = await fetch('/api/crypto/bitcoin-price');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Bitcoin API response:', data);
                if (data.error) {
                    console.error('Bitcoin API error:', data.error);
                    throw new Error(data.error);
                }
                const { priceInUSD, marketCap: rawMarketCap, changePercent } = data;
                if (priceInUSD === undefined || priceInUSD === null) {
                    throw new Error('No price data available');
                }
                const parsedPrice = parseFloat(priceInUSD);
                if (isNaN(parsedPrice)) {
                    throw new Error('Invalid price format');
                }
                updateBitcoinData({
                    price: parsedPrice,
                    marketCap: rawMarketCap || 0,
                    dominance: changePercent || 0,
                    lastUpdated: Date.now()
                });
                setError(null);
            }
            catch (error) {
                console.error('Error fetching Bitcoin price:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch Bitcoin price');
            }
        };
        if (isClient) {
            fetchBitcoinPrice();
            const intervalId = setInterval(fetchBitcoinPrice, 60000);
            return () => clearInterval(intervalId);
        }
    }, [isClient, updateBitcoinData]);
    if (!isClient) {
        return (<div className="bitcoin-ticker animate-pulse">
        <h3>Bitcoin Price</h3>
        <div className="h-6 w-24 bg-gray-700 rounded"></div>
      </div>);
    }
    return (<div className="bitcoin-ticker" data-testid="bitcoin-ticker">
      <h3>Bitcoin Price</h3>
      {error ? (<p className="text-red-500 text-sm" data-testid="error-message">
          {error}
        </p>) : (<div>
          <p className="text-lg font-bold" data-testid="bitcoin-price">
            ${price ? price.toLocaleString() : '...'}
          </p>
          {marketCap > 0 && (<p className="text-sm text-gray-400" data-testid="market-cap">
              MCap: ${(marketCap / 1e9).toFixed(2)}B
            </p>)}
          {dominance > 0 && (<p className="text-sm text-gray-400" data-testid="percent-change">
              24h: {dominance > 0 ? `${dominance.toFixed(2)}%` : '...'}
            </p>)}
        </div>)}
    </div>);
};
export default BitcoinTicker;
