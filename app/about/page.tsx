import React from 'react';

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-100">About Trend2Zero</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">Our Mission</h2>
        <p className="text-gray-300 mb-4">
          Trend2Zero is a comprehensive financial tracking platform designed to provide real-time insights 
          into market data across multiple asset classes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">Data Sources</h2>
        <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
          <li>Stocks and ETFs (via Alpha Vantage API)</li>
          <li>Cryptocurrencies (via CoinMarketCap API)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">Key Features</h2>
        <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
          <li>Real-time market data tracking</li>
          <li>Historical price analysis</li>
          <li>Multi-asset portfolio management</li>
          <li>Advanced charting and visualization</li>
        </ul>
      </section>
    </div>
  );
}
