'use client';

import React, { useRef, useEffect, useState } from 'react';
// We'll use types for TypeScript but import the actual library dynamically

// Define ColorType enum since we're not importing it directly
enum ColorType {
  Solid = 'solid',
}

// We'll dynamically import the chart library on the client side
let createChart: any = null;

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
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Generate data based on symbol or use provided data
  useEffect(() => {
    const generateData = () => {
      try {
        setIsLoading(true);
        setIsError(false);

        // If data is provided directly, use it
        if (data && data.length > 0) {
          console.log(`[Chart] Using provided data with ${data.length} points`);
          setChartData(data);
          setIsLoading(false);
          return;
        }

        // Generate sample data based on symbol
        if (symbol) {
          console.log(`[Chart] Generating data for symbol: ${symbol}, days: ${days}`);
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

          console.log(`[Chart] Generated ${generatedData.length} data points`);
          setChartData(generatedData);
          setIsLoading(false);
        } else {
          // No data and no symbol provided
          console.error('[Chart] No data or symbol provided');
          setIsError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[Chart] Error generating chart data:', error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    generateData();
  }, [data, symbol, days]);

  // Create and update chart
  useEffect(() => {
    if (isLoading || !chartContainerRef.current) {
      console.log('[Chart] Skipping chart creation - still loading or no container');
      return;
    }

    if (isError) {
      console.log('[Chart] Skipping chart creation - in error state');
      return;
    }

    console.log('[Chart] Creating chart...');

    // Clear previous chart
    if (chartContainerRef.current) {
      console.log('[Chart] Clearing previous chart');
      chartContainerRef.current.innerHTML = '';
    }

    // Debug info
    const debugData = {
      containerExists: !!chartContainerRef.current,
      containerDimensions: chartContainerRef.current ? {
        clientWidth: chartContainerRef.current.clientWidth,
        clientHeight: chartContainerRef.current.clientHeight,
        offsetWidth: chartContainerRef.current.offsetWidth,
        offsetHeight: chartContainerRef.current.offsetHeight
      } : null,
      dataPoints: chartData.length,
      theme,
      width,
      height,
      timestamp: new Date().toISOString()
    };
    setDebugInfo(debugData);
    console.log('[Chart] Debug info:', debugData);

    // Dynamically import the chart library
    const initChart = async () => {
      try {
        // Import the library dynamically
        if (!createChart) {
          console.log('[Chart] Dynamically importing lightweight-charts');
          const chartModule = await import('lightweight-charts');
          createChart = chartModule.createChart;
          console.log('[Chart] Chart library loaded successfully');
        }

        if (!chartContainerRef.current) {
          console.log('[Chart] Chart container no longer exists');
          return;
        }

        // Create chart with explicit dimensions
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
            timeVisible: true,
            secondsVisible: false,
          },
        });

        console.log('[Chart] Chart created');

        // Add line series
        const lineSeries = chart.addLineSeries({
          color: '#FF9500',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
        });

        console.log('[Chart] Line series added');

        // Set data
        if (chartData.length > 0) {
          console.log(`[Chart] Setting data with ${chartData.length} points`);

          // Ensure time is in the correct format
          const formattedData = chartData.map(point => ({
            time: typeof point.time === 'string' ? point.time : point.time,
            value: point.value
          }));

          lineSeries.setData(formattedData);
          console.log('[Chart] Data set successfully');
        } else {
          // Fallback data if chartData is empty
          console.log('[Chart] Using fallback data');
          lineSeries.setData([
            { time: Math.floor(Date.now() / 1000) - 86400, value: 100 },
            { time: Math.floor(Date.now() / 1000), value: 110 },
          ]);
        }

        // Fit content
        chart.timeScale().fitContent();
        console.log('[Chart] Fitted content');

        // Force a resize to ensure proper rendering
        setTimeout(() => {
          if (chartContainerRef.current) {
            console.log('[Chart] Forcing resize');
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight
            });
            chart.timeScale().fitContent();
          }
        }, 100);

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
          console.log('[Chart] Added resize listener');
        }

        // Store cleanup function
        return () => {
          console.log('[Chart] Cleaning up chart');
          if (typeof window !== 'undefined') {
            window.removeEventListener('resize', handleResize);
          }
          chart.remove();
        };
      } catch (error) {
        console.error('[Chart] Error creating chart:', error);
        setIsError(true);
        return undefined;
      }
    };

    // Initialize the chart
    let cleanup: (() => void) | undefined;
    initChart().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    // Return cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [chartData, isLoading, isError, width, height, theme]);

  // Handle retry
  const handleRetry = () => {
    console.log('[Chart] Retry clicked');
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
          <div className="text-xs text-gray-500 mt-2">
            Debug: {JSON.stringify(debugInfo).substring(0, 100)}...
          </div>
        </div>
      </div>
    );
  }

  // Chart container
  return (
    <div
      ref={chartContainerRef}
      data-testid="chart-container"
      className="chart-container"
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

export default TradingViewLightweightChart;
