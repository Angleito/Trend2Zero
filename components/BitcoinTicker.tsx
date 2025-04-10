import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BitcoinTicker: React.FC = () => {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        
        console.log('Full API Response:', response.data);

        const exchangeRateData = response.data['Realtime Currency Exchange Rate'];
        
        if (!exchangeRateData) {
          throw new Error('No exchange rate data found in the response');
        }

        const price = exchangeRateData['5. Exchange Rate'];
        
        if (!price) {
          throw new Error('Exchange rate is undefined');
        }

        const parsedPrice = parseFloat(price);
        
        if (isNaN(parsedPrice)) {
          throw new Error('Invalid price format');
        }

        setBtcPrice(parsedPrice);
        setError(null);
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setBtcPrice(null);
      }
    };

    fetchBitcoinPrice();
    const intervalId = setInterval(fetchBitcoinPrice, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bitcoin-ticker">
      <h3>Bitcoin Price</h3>
      {error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : btcPrice ? (
        <p>${btcPrice.toLocaleString()}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BitcoinTicker;
