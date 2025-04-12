'use client';

import TradingViewLightweightChart from '../../../components/TradingViewLightweightChart';

import Image from 'next/image';
import Link from 'next/link';
export default function SimpleChartTestPage() {
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Chart Test</h1>
      
      <div className="border rounded p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Bitcoin Price Chart</h2>
        <div style={{ height: '400px', width: '100%' }}>
          <TradingViewLightweightChart
            data={sampleData}
            width={800}
            height={400}
          />
        </div>
      </div>
    </div>
  );
}
