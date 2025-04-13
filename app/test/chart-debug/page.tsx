'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the chart component with SSR disabled
const TradingViewLightweightChart = dynamic(
  () => import('../../../components/TradingViewLightweightChart'),
  { ssr: false }
);

export default function ChartDebugPage() {
  const [mounted, setMounted] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now());
  
  // Sample data for the chart
  const sampleData = [
    { time: Math.floor(new Date('2023-01-01').getTime() / 1000), value: 25000 },
    { time: Math.floor(new Date('2023-01-02').getTime() / 1000), value: 26000 },
    { time: Math.floor(new Date('2023-01-03').getTime() / 1000), value: 25500 },
    { time: Math.floor(new Date('2023-01-04').getTime() / 1000), value: 27000 },
    { time: Math.floor(new Date('2023-01-05').getTime() / 1000), value: 28000 },
    { time: Math.floor(new Date('2023-01-06').getTime() / 1000), value: 29000 },
    { time: Math.floor(new Date('2023-01-07').getTime() / 1000), value: 28500 },
    { time: Math.floor(new Date('2023-01-08').getTime() / 1000), value: 29500 },
    { time: Math.floor(new Date('2023-01-09').getTime() / 1000), value: 30000 },
    { time: Math.floor(new Date('2023-01-10').getTime() / 1000), value: 31000 },
  ];

  // Only render the chart on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to force re-render the chart
  const handleRerender = () => {
    setChartKey(Date.now());
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chart Debug Page</h1>
      
      <div className="mb-4 flex space-x-4">
        <button 
          onClick={handleRerender}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Force Re-render
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Reload Page
        </button>
      </div>
      
      <div className="border rounded p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Chart with Direct Data</h2>
        <div className="bg-gray-100 p-2 mb-4 text-xs overflow-auto">
          <pre>{JSON.stringify(sampleData.slice(0, 3), null, 2)}...</pre>
        </div>
        
        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
          {mounted && (
            <TradingViewLightweightChart
              key={chartKey}
              data={sampleData}
              width={800}
              height={400}
            />
          )}
        </div>
      </div>
      
      <div className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Chart with Symbol</h2>
        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
          {mounted && (
            <TradingViewLightweightChart
              key={chartKey}
              symbol="BTC"
              theme="dark"
              days={30}
              width={800}
              height={400}
            />
          )}
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <p><strong>Client-side rendering:</strong> {mounted ? 'Yes' : 'No'}</p>
        <p><strong>Chart key:</strong> {chartKey}</p>
        <p><strong>Window dimensions:</strong> {mounted ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</p>
        <p><strong>User Agent:</strong> {mounted ? navigator.userAgent : 'N/A'}</p>
      </div>
    </div>
  );
}
