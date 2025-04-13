'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import chart components to avoid SSR issues
const TradingViewLightweightChart = dynamic(
  () => import('./TradingViewLightweightChart'),
  { ssr: false }
);
const HighchartsView = dynamic(
  () => import('./HighchartsView'),
  { ssr: false }
);

interface ChartContainerProps {
  symbol: string;
  height?: number;
  theme?: 'light' | 'dark';
  interval?: '1d' | '1w' | '1m';
}

const ChartContainer = ({
  symbol,
  height = 400,
  theme = 'dark',
  interval = '1d',
}: ChartContainerProps) => {
  const [chartType, setChartType] = useState<'lightweight' | 'highcharts'>('lightweight');
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | '5y'>('30d');

  // Convert timeRange to days for API calls
  const getDays = (): number => {
    switch (timeRange) {
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      case '5y': return 1825;
      default: return 30;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Price Chart</h2>
        <div className="flex space-x-2">
          <div className="flex bg-gray-800 rounded-md p-1">
            <button
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === 'lightweight'
                  ? 'bg-[#FF9500] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setChartType('lightweight')}
            >
              Basic
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === 'highcharts'
                  ? 'bg-[#FF9500] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setChartType('highcharts')}
            >
              Advanced
            </button>
          </div>
          <div className="flex bg-gray-800 rounded-md p-1">
            <button
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                timeRange === '30d'
                  ? 'bg-[#FF9500] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setTimeRange('30d')}
            >
              30D
            </button>
            <button
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                timeRange === '90d'
                  ? 'bg-[#FF9500] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setTimeRange('90d')}
            >
              90D
            </button>
            <button
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                timeRange === '1y'
                  ? 'bg-[#FF9500] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setTimeRange('1y')}
            >
              1Y
            </button>
            <button
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                timeRange === '5y'
                  ? 'bg-[#FF9500] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setTimeRange('5y')}
            >
              5Y
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: `${height}px` }}>
        {chartType === 'lightweight' ? (
          <TradingViewLightweightChart
            symbol={symbol}
            theme={theme}
            days={getDays()}
          />
        ) : (
          <HighchartsView
            symbol={symbol}
            theme={theme}
            days={getDays()}
          />
        )}
      </div>
    </div>
  );
};

export default ChartContainer;
