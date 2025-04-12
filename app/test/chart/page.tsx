'use client';

import TradingViewLightweightChart from '../../../components/TradingViewLightweightChart';

import Image from 'next/image';
import Link from 'next/link';
export default function ChartTestPage() {
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
      <h1 className="text-2xl font-bold mb-4">Chart Test Page</h1>

      <div className="grid grid-cols-1 gap-4">
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Bitcoin Chart</h2>
          <div className="h-64">
            <TradingViewLightweightChart
              data={sampleData}
              width={600}
              height={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
