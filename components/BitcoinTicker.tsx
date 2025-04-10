'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useBitcoinStore } from '../lib/stores/bitcoinStore.new';

const BitcoinTicker: React.FC = () => {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<{
    marketCap?: number;
    percentChange24h?: number;
  }>({});
  const { updateBitcoinData } = useBitcoinStore();

  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      try {
        console.log('Fetching Bitcoin price...');
        const response = await axios.get('/api/crypto', {
          params: { endpoint: 'bitcoin-price' }
        });

        console.log('Bitcoin API response:', response.data);

        // Detailed error handling
        if (response.data.error) {
          console.error('Bitcoin API error:', response.data.error);
          throw new Error(response.data.error);
        }

        const { price, raw_data } = response.data;

        if (!price) {
          throw new Error('No price data available');
        }

        const parsedPrice = parseFloat(price);

        if (isNaN(parsedPrice)) {
          throw new Error('Invalid price format');
        }

        // Update price and additional market data
        setBtcPrice(parsedPrice);
        setMarketData({
          marketCap: raw_data?.market_cap,
          percentChange24h: raw_data?.percent_change_24h
        });

        // Update global Bitcoin store
        updateBitcoinData({
          price: parsedPrice,
          marketCap: raw_data?.market_cap || 0,
          dominance: raw_data?.percent_change_24h || 0,
          lastUpdated: Date.now()
        });

        setError(null);
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
        setError(error instanceof Error ? error.message : 'Unknown error fetching Bitcoin price');
        setBtcPrice(null);
        setMarketData({});
      }
    };

    // Immediately fetch Bitcoin price
    fetchBitcoinPrice();

    // Set up interval to fetch price every minute
    const intervalId = setInterval(fetchBitcoinPrice, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [updateBitcoinData]);

  return (
    <div className="bitcoin-ticker">
      <h3>Bitcoin Price</h3>
      {error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : btcPrice ? (
        <div>
          <p>${btcPrice.toLocaleString()}</p>
          {marketData.marketCap && (
            <p>Market Cap: ${marketData.marketCap.toLocaleString()}</p>
          )}
          {marketData.percentChange24h && (
            <p>24h Change: {marketData.percentChange24h.toFixed(2)}%</p>
          )}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BitcoinTicker;
