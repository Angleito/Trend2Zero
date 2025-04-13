'use client';

import dynamic from 'next/dynamic';

// Import BitcoinTicker with no SSR to prevent hydration issues
const BitcoinTicker = dynamic(() => import('./BitcoinTicker'), {
  ssr: false, 
  loading: () => (
    <div className="bitcoin-ticker animate-pulse">
      <h3>Bitcoin Price</h3>
      <div className="h-6 w-24 bg-gray-700 rounded"></div>
    </div>
  )
});

const BitcoinTickerWrapper = () => {
  return <BitcoinTicker />;
};

export default BitcoinTickerWrapper;