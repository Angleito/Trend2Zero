import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BitcoinTicker: React.FC = () => {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      try {
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'CURRENCY_EXCHANGE_RATE',
            from_currency: 'BTC',
            to_currency: 'USD',
            apikey: process.env.ALPHA_VANTAGE_API_KEY
          }
        });
        
        const price = response.data['Realtime Currency Exchange Rate']['5. Exchange Rate'];
        setBtcPrice(parseFloat(price));
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
      }
    };

    fetchBitcoinPrice();
    const intervalId = setInterval(fetchBitcoinPrice, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bitcoin-ticker">
      <h3>Bitcoin Price</h3>
      {btcPrice ? (
        <p>${btcPrice.toLocaleString()}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BitcoinTicker;
