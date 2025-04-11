'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { MarketDataService } from '../lib/services/marketDataService';
import type { HistoricalDataPoint } from '../lib/types';

interface TradingViewLightweightChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  days?: number;
}

const TradingViewLightweightChart: React.FC<TradingViewLightweightChartProps> = ({
  symbol,
  theme = 'dark',
  days = 30,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let chart: any = null;
    let series: any = null;

    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    const initChart = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!chartContainerRef.current) {
          return;
        }

        // Fetch historical data for the symbol
        const marketService = new MarketDataService();
        const historicalData = await marketService.getHistoricalData(symbol, days);

        // Format data for the chart
        const chartData = historicalData.map((dataPoint: HistoricalDataPoint) => {
          // Handle both Date objects and ISO strings
          const timestamp = dataPoint.date instanceof Date
            ? dataPoint.date.getTime()
            : new Date(dataPoint.date).getTime();

          return {
            time: Math.floor(timestamp / 1000),
            value: dataPoint.price,
          };
        });

        if (chartData.length === 0) {
          throw new Error('No historical data available');
        }

        // Create chart
        chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: theme === 'dark' ? '#1E1E1E' : '#FFFFFF' },
            textColor: theme === 'dark' ? '#D9D9D9' : '#191919',
          },
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
          grid: {
            vertLines: {
              color: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
            },
            horzLines: {
              color: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
            },
          },
          timeScale: {
            borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
          },
        });

        // Create the line series
        series = chart.addLineSeries({
          color: '#FF9500',
          lineWidth: 2,
          priceLineVisible: true,
          priceLineWidth: 1,
          priceLineColor: '#FF9500',
          priceLineStyle: 0,
          lastValueVisible: true,
          title: 'Price',
        });

        // Set the data
        series.setData(chartData);

        // Add event listeners
        if (typeof window !== 'undefined') {
          window.addEventListener('resize', handleResize);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Failed to load chart data');
        setLoading(false);
      }
    };

    initChart();

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      if (chart) {
        chart.remove();
      }
    };
  }, [symbol, days, theme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF9500]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            className="px-4 py-2 bg-[#FF9500] text-white rounded hover:bg-opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={chartContainerRef} className="w-full h-full" />
  );
};

export default TradingViewLightweightChart;
