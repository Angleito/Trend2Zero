'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export interface TradingViewLightweightChartProps {
  data?: any[];
  symbol?: string;
  theme?: 'light' | 'dark';
  days?: number;
  width?: number;
  height?: number;
}

const TradingViewLightweightChart: React.FC<TradingViewLightweightChartProps> = ({
  data,
  symbol,
  theme = 'dark',
  days = 30,
  width = 600,
  height = 300,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate data based on symbol or use provided data
  useEffect(() => {
    const generateData = () => {
      try {
        setIsLoading(true);
        setIsError(false);

        // If data is provided directly, use it
        if (data && data.length > 0) {
          setChartData(data);
          setIsLoading(false);
          return;
        }

        // Generate sample data based on symbol
        if (symbol) {
          const generatedData = [];
          const today = new Date();
          let basePrice = 100;

          // Set base price based on symbol
          if (symbol === 'BTC') basePrice = 60000;
          else if (symbol === 'ETH') basePrice = 3000;
          else if (symbol === 'AAPL') basePrice = 180;
          else if (symbol === 'GOOGL') basePrice = 125;
          else if (symbol === 'XAU') basePrice = 2000;

          // Generate data points
          for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Add some random variation
            const randomFactor = 0.98 + Math.random() * 0.04; // Between 0.98 and 1.02
            const price = basePrice * randomFactor;
            
            generatedData.push({
              time: Math.floor(date.getTime() / 1000),
              value: price
            });
            
            // Update base price for next day
            basePrice = price;
          }

          setChartData(generatedData);
          setIsLoading(false);
        } else {
          // No data and no symbol provided
          setIsError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error generating chart data:', error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    generateData();
  }, [data, symbol, days]);

  // Create and update chart
  useEffect(() => {
    if (isLoading || isError || !chartContainerRef.current) return;

    // Clear previous chart
    chartContainerRef.current.innerHTML = '';

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: width,
        height: height,
        layout: {
          background: { 
            type: ColorType.Solid, 
            color: theme === 'dark' ? '#1E1E2D' : '#FFFFFF' 
          },
          textColor: theme === 'dark' ? '#D9D9D9' : '#191919',
        },
        grid: {
          vertLines: { color: theme === 'dark' ? '#2B2B43' : '#E6E6E6' },
          horzLines: { color: theme === 'dark' ? '#2B2B43' : '#E6E6E6' },
        },
        timeScale: {
          borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
        },
      });

      // Add line series
      const lineSeries = chart.addLineSeries({
        color: '#FF9500',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });

      // Set data
      if (chartData.length > 0) {
        lineSeries.setData(chartData);
      } else {
        // Fallback data if chartData is empty
        lineSeries.setData([
          { time: Math.floor(Date.now() / 1000) - 86400, value: 100 },
          { time: Math.floor(Date.now() / 1000), value: 110 },
        ]);
      }

      // Fit content
      chart.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight
          });
        }
      };

      // Add resize listener
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
      }

      // Cleanup
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleResize);
        }
        chart.remove();
      };
    } catch (error) {
      console.error('Error creating chart:', error);
      setIsError(true);
    }
  }, [chartData, isLoading, isError, width, height, theme]);

  // Handle retry
  const handleRetry = () => {
    setIsLoading(true);
    setIsError(false);
    // This will trigger the data generation effect
    setChartData([]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div 
        data-testid="chart-loading"
        className="flex items-center justify-center"
        style={{ width, height, background: theme === 'dark' ? '#1E1E2D' : '#FFFFFF' }}
      >
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF9500]"></div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div 
        data-testid="chart-error"
        className="flex items-center justify-center"
        style={{ width, height, background: theme === 'dark' ? '#1E1E2D' : '#FFFFFF' }}
      >
        <div className="text-center">
          <p 
            data-testid="error-message"
            className="text-red-500 mb-2"
          >
            Failed to load chart data
          </p>
          <button
            data-testid="retry-button"
            className="px-4 py-2 bg-[#FF9500] text-white rounded hover:bg-opacity-90 transition-colors"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Chart container
  return (
    <div 
      ref={chartContainerRef} 
      data-testid="chart-container"
      style={{ width, height }}
    />
  );
};

export default TradingViewLightweightChart;
