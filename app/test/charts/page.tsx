'use client';

import React from 'react';
import TradingViewLightweightChart from '../../../components/TradingViewLightweightChart';

export default function ChartsTestPage() {
  // Sample data for the chart
  const sampleData = [
    { time: '2023-01-01', value: 25000 },
    { time: '2023-01-02', value: 26000 },
    { time: '2023-01-03', value: 25500 },
    { time: '2023-01-04', value: 27000 },
    { time: '2023-01-05', value: 28000 },
    { time: '2023-01-06', value: 29000 },
    { time: '2023-01-07', value: 28500 },
    { time: '2023-01-08', value: 29500 },
    { time: '2023-01-09', value: 30000 },
    { time: '2023-01-10', value: 31000 },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Charts Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Using Direct Data (Light Theme)</h2>
          <div className="h-64">
            <TradingViewLightweightChart
              data={sampleData}
              theme="light"
              width={600}
              height={300}
            />
          </div>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Using Symbol (Dark Theme)</h2>
          <div className="h-64">
            <TradingViewLightweightChart
              symbol="BTC"
              theme="dark"
              days={30}
              width={600}
              height={300}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Ethereum Chart</h2>
          <div className="h-64">
            <TradingViewLightweightChart
              symbol="ETH"
              theme="dark"
              days={14}
              width={600}
              height={300}
            />
          </div>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Apple Stock</h2>
          <div className="h-64">
            <TradingViewLightweightChart
              symbol="AAPL"
              theme="light"
              days={7}
              width={600}
              height={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
