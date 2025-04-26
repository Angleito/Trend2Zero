'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getHistoricalData } from '../lib/services/marketDataService';
import type { HistoricalDataPoint } from '../lib/types';

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

export function ChartContainer({ symbol }: { symbol: string }) {
  const [chartType, setChartType] = useState<'lightweight' | 'highcharts'>('lightweight');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | '90d'>('30d');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  useEffect(() => {
    async function fetchData() {
      const days = getDays();
      const data = await getHistoricalData(symbol, days);
      setHistoricalData(data);
    }
    fetchData();
  }, [symbol, timeframe]);

  const getDays = () => {
    switch (timeframe) {
      case '1d': return 1;
      case '7d': return 7;
      case '90d': return 90;
      default: return 30;
    }
  };

  // Transform data for TradingView Lightweight Chart
  const lightweightChartData = useMemo(() => {
    return historicalData.map(item => ({
      time: item.timestamp / 1000, // Lightweight chart expects timestamp in seconds
      value: item.price,
    }));
  }, [historicalData]);

  // Transform data for Highcharts
  const highchartsData = useMemo(() => {
    return historicalData.map(item => [
      item.timestamp, // Highcharts expects timestamp in milliseconds
      item.price,
    ]);
  }, [historicalData]);


  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="space-x-2">
          <button
            onClick={() => setChartType('lightweight')}
            className={`px-3 py-1 rounded ${
              chartType === 'lightweight' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Lightweight
          </button>
          <button
            onClick={() => setChartType('highcharts')}
            className={`px-3 py-1 rounded ${
              chartType === 'highcharts' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Highcharts
          </button>
        </div>
        
        <div className="space-x-2">
          <button
            onClick={() => setTheme('light')}
            className={`px-3 py-1 rounded ${
              theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-3 py-1 rounded ${
              theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Dark
          </button>
        </div>

        <div className="space-x-2">
          <button
            onClick={() => setTimeframe('1d')}
            className={`px-3 py-1 rounded ${
              timeframe === '1d' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            1D
          </button>
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3 py-1 rounded ${
              timeframe === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            1W
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1 rounded ${
              timeframe === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            1M
          </button>
          <button
            onClick={() => setTimeframe('90d')}
            className={`px-3 py-1 rounded ${
              timeframe === '90d' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            3M
          </button>
        </div>
      </div>

      <div className="h-[400px]">
        {chartType === 'lightweight' ? (
          <TradingViewLightweightChart
            data={lightweightChartData}
            theme={theme}
          />
        ) : (
          <HighchartsView
            symbol={symbol}
            theme={theme}
            days={getDays()}
            data={highchartsData}
            title={`${symbol.toUpperCase()} Price Chart`}
          />
        )}
      </div>
    </div>
  );
}
