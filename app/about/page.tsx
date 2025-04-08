'use client';

import React from 'react';
import StickyHeader from '../../components/StickyHeader';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <StickyHeader />

      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-center">About Trend2Zero</h1>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-[#FF9500]">Our Mission</h2>
            <p className="text-gray-300 mb-6">
              Trend2Zero was created to help people understand the true value of assets when priced in Bitcoin,
              the world's hardest money. Our mission is to provide a clear perspective on how traditional assets
              trend to zero when measured against Bitcoin over time.
            </p>
            <p className="text-gray-300">
              We believe that pricing assets in fiat currencies like the US Dollar provides an incomplete picture
              due to inflation and monetary debasement. By using Bitcoin as a measuring stick, we can see the
              true performance of assets against a currency with a fixed supply.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-[#FF9500]">How It Works</h2>
            <p className="text-gray-300 mb-4">
              Our platform fetches real-time and historical price data for various assets including:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
              <li>Cryptocurrencies (via CoinGecko API)</li>
              <li>Stocks and ETFs (via Alpha Vantage API)</li>
              <li>Commodities like gold and silver</li>
              <li>Major indices like S&P 500, Nasdaq, and more</li>
            </ul>
            <p className="text-gray-300">
              We then convert these prices to their Bitcoin equivalent value, allowing you to see how these assets
              have performed when measured in Bitcoin rather than fiat currencies.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-[#FF9500]">Why Bitcoin?</h2>
            <p className="text-gray-300 mb-6">
              Bitcoin has several properties that make it an excellent measuring stick for value:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Fixed supply cap of 21 million coins</li>
              <li>Decentralized and censorship-resistant</li>
              <li>Programmable money with predictable issuance</li>
              <li>Global, borderless, and accessible to anyone</li>
              <li>Cannot be debased through inflation</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="bg-black border-t border-gray-800 py-6 px-4">
        <div className="container mx-auto max-w-4xl text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Trend2Zero. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
