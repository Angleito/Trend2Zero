'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import React, { useState, useEffect } from 'react';
import { CoinGeckoService } from '../pricedinbitcoin21/lib/services/coinGeckoService';

interface TickerItem {
  label: string;
  value: string;
  change?: number; // Optional percentage change
}

const BitcoinTicker: React.FC = () => {
  const [tickerData, setTickerData] = useState<TickerItem[]>([
    { label: 'BTC/USD', value: '$--,---', change: 0 },
    { label: 'Market Cap', value: '$-.--T' },
    { label: 'Dominance', value: '--.-%' },
    { label: '24h Vol', value: '$--.-B' },
  ]);

  useEffect(() => {
    const fetchBitcoinData = async () => {
      try {
        const coinGeckoService = new CoinGeckoService();
        const btcData = await coinGeckoService.getAssetPriceInBTC('BTC');

        // Format the data
        const formattedPrice = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(btcData.priceInUSD);

        const marketCap = btcData.priceInUSD * 19460000; // Approximate BTC supply
        const formattedMarketCap = marketCap > 1000000000000
          ? `$${(marketCap / 1000000000000).toFixed(2)}T`
          : `$${(marketCap / 1000000000).toFixed(2)}B`;

        // Update ticker data
        setTickerData([
          { label: 'BTC/USD', value: formattedPrice, change: btcData.returns.ytd },
          { label: 'Market Cap', value: formattedMarketCap },
          { label: 'Dominance', value: '52.3%' }, // This would need another API call
          { label: '24h Vol', value: '$42.5B' }, // This would need another API call
        ]);
      } catch (error) {
        console.error('Error fetching Bitcoin data:', error);
      }
    };

    fetchBitcoinData();

    // Refresh every 60 seconds
    const intervalId = setInterval(fetchBitcoinData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bitcoin-ticker">
      {tickerData.map((item, index) => (
        <div key={index} className="bitcoin-ticker-item">
          <span className="bitcoin-ticker-label">{item.label}</span>
          <div className="flex items-center">
            <span className="bitcoin-ticker-value">{item.value}</span>
            {item.change !== undefined && (
              <span
                className={`ml-1 text-xs ${
                  item.change >= 0 ? 'bitcoin-ticker-value-up' : 'bitcoin-ticker-value-down'
                }`}
              >
                {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BitcoinTicker;
