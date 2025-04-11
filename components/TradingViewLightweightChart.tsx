import React, { useRef, useEffect, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData } from 'lightweight-charts';

export interface TradingViewLightweightChartProps {
  data?: LineData[];
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
  height = 400,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [isError, setIsError] = useState(false);

  // State to hold the chart data
  const [chartData, setChartData] = useState<LineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate sample data based on symbol and days
  useEffect(() => {
    if (data && data.length > 0) {
      // If data is provided directly, use it
      setChartData(data);
      setIsLoading(false);
      return;
    }

    if (symbol) {
      // Generate sample data based on symbol and days
      setIsLoading(true);

      // Generate mock historical data
      const generatedData: LineData[] = [];
      const today = new Date();
      let basePrice = 100;

      if (symbol === 'BTC') basePrice = 60000;
      else if (symbol === 'ETH') basePrice = 3000;
      else if (symbol === 'AAPL') basePrice = 180;
      else if (symbol === 'GOOGL') basePrice = 125;
      else if (symbol === 'XAU') basePrice = 2000;

      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Add some random variation
        const randomFactor = 0.98 + Math.random() * 0.04; // Between 0.98 and 1.02
        const price = basePrice * randomFactor;

        generatedData.push({
          time: Math.floor(date.getTime() / 1000) as any,
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
  }, [data, symbol, days]);

  // Create and update the chart
  useEffect(() => {
    console.log('TradingViewLightweightChart chart creation effect called', {
      chartData,
      width,
      height,
      dataLength: chartData?.length,
      theme
    });

    if (!chartContainerRef.current) {
      console.error('Chart container ref is null');
      setIsError(true);
      return;
    }

    // Reset error state
    setIsError(false);

    // Cleanup previous chart if exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    // If no data, set error state
    if (!chartData || chartData.length === 0) {
      console.warn('No chart data available, setting error state');
      setIsError(true);
      return;
    }

    try {
      // Force canvas creation with minimal configuration
      const chart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { color: theme === 'dark' ? '#1E1E2D' : '#FFFFFF' },
          textColor: theme === 'dark' ? '#D9D9D9' : '#191919',
        },
        grid: {
          vertLines: { color: theme === 'dark' ? '#2B2B43' : '#E6E6E6' },
          horzLines: { color: theme === 'dark' ? '#2B2B43' : '#E6E6E6' },
        },
        timeScale: {
          borderColor: theme === 'dark' ? '#2B2B43' : '#E6E6E6',
        },
        handleScale: true,
        handleScroll: true,
      });
      chartRef.current = chart;

      // Add a minimal line series even with limited data
      const lineSeries = chart.addLineSeries({
        color: '#FF9500',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      seriesRef.current = lineSeries;

      // Ensure some data is set, even if minimal
      const safeData = chartData.length > 0 ? chartData : [
        { time: '2023-01-01' as any, value: 0 },
        { time: '2023-01-02' as any, value: 0 }
      ];

      lineSeries.setData(safeData);

      // Ensure chart is visible
      chart.timeScale().fitContent();

      // Force canvas creation logging
      const canvasElements = chartContainerRef.current.getElementsByTagName('canvas');
      console.log('Canvas elements created:', canvasElements.length);

      // Responsive resize
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.resize(
            chartContainerRef.current.clientWidth,
            height
          );
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleResize);
        }
        chart.remove();
      };
    } catch (error) {
      console.error('Error creating chart:', error, {
        chartData,
        width,
        height,
        dataLength: chartData?.length,
        theme
      });
      setIsError(true);
    }
  }, [chartData, width, height, theme]);

  const handleRetry = () => {
    console.log('Retry button clicked');
    // Reset the component state
    setIsError(false);
    setIsLoading(true);

    // If we have a symbol, regenerate the data
    if (symbol) {
      // This will trigger the data generation effect
      setChartData([]);
    } else if (typeof window !== 'undefined') {
      // If no symbol, reload the page as a fallback
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div
        data-testid="chart-loading"
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #eee',
          background: theme === 'dark' ? '#1E1E2D' : '#FFFFFF',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #eee',
            borderTop: '3px solid #FF9500',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (isError) {
    console.log('Rendering error state', {
      chartData,
      width,
      height,
      dataLength: chartData?.length,
      theme
    });
    return (
      <div
        data-testid="chart-error"
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #eee',
          background: theme === 'dark' ? '#1E1E2D' : '#FFFFFF',
          color: theme === 'dark' ? '#D9D9D9' : '#191919',
        }}
      >
        <div>
          <div
            data-testid="error-message"
            style={{
              color: '#FF3B30',
              fontWeight: 600,
              marginBottom: 8,
              textAlign: 'center'
            }}
          >
            Failed to load chart data
          </div>
          <button
            data-testid="retry-button"
            style={{
              padding: '6px 16px',
              background: '#FF9500',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'block',
              margin: '0 auto'
            }}
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <div ref={chartContainerRef} style={{ width, height }} />;
};

export default TradingViewLightweightChart;
