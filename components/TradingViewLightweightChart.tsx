'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineData } from 'lightweight-charts';
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
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch historical data for the symbol
        const marketService = new MarketDataService();
        const historicalData = await marketService.getHistoricalData(symbol, days);

        // Format data for the chart
        const chartData: LineData[] = historicalData.map((dataPoint: HistoricalDataPoint) => ({
          time: dataPoint.date,
          value: dataPoint.price,
        }));

        if (chartData.length === 0) {
          throw new Error('No historical data available');
        }

        // Update the chart with the new data
        if (seriesRef.current) {
          seriesRef.current.setData(chartData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, days]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current?.clientWidth || 600
        });
      }
    };

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
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
      crosshair: {
        mode: 0,
      },
    });

    // Create the line series
    const lineSeries = chart.addLineSeries({
      color: '#FF9500',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    // Store references
    chartRef.current = chart;
    seriesRef.current = lineSeries;

    // Add event listeners
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [theme]);

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
            onClick={() => window.location.reload()}
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
