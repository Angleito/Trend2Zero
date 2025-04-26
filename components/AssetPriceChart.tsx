'use client';

import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import type { HistoricalDataPoint } from '../lib/types';

interface AssetPriceChartProps {
  data: HistoricalDataPoint[];
}

export function AssetPriceChart({ data }: AssetPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);

  // Effect to create and cleanup the chart instance
  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null; // Clear the ref on cleanup
        }
      };
    }
  }, []); // Empty dependency array means this effect runs only on mount and unmount

  // Effect to update the data when the data prop changes
  useEffect(() => {
    if (candlestickSeriesRef.current && data) {
      const formattedData = data.map(item => ({
        time: item.timestamp / 1000,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      candlestickSeriesRef.current.setData(formattedData);
    }
  }, [data]); // This effect runs when the data prop changes

  return <div ref={chartContainerRef} />;
}