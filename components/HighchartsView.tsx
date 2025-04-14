'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import { useEffect, useState } from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

import { MarketDataService } from '../lib/services/marketDataService';
import type { HistoricalDataPoint } from '../lib/types';

// Load Highcharts modules
// Using dynamic imports for client-side only modules
// Define types for Highcharts modules
type HighchartsModule = (H: typeof Highcharts) => void;

// Initialize module variables
let exporting: HighchartsModule | null = null;
let exportData: HighchartsModule | null = null;
let accessibility: HighchartsModule | null = null;

if (typeof window !== 'undefined') {
  // This will only run on the client side
  import('highcharts/modules/exporting').then(module => {
    exporting = module.default;
    exporting(Highcharts);
  });

  import('highcharts/modules/export-data').then(module => {
    exportData = module.default;
    exportData(Highcharts);
  });

  import('highcharts/modules/accessibility').then(module => {
    accessibility = module.default;
    accessibility(Highcharts);
  });
}

interface HighchartsViewProps {
  symbol: string;
  theme?: 'light' | 'dark';
  days?: number;
}

const HighchartsView = ({
  symbol,
  theme = 'dark',
  days = 30,
}: HighchartsViewProps) => {
  const [chartOptions, setChartOptions] = useState<Highcharts.Options>({
    chart: {
      backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
      style: {
        fontFamily: 'Inter, sans-serif',
      },
    },
    title: {
      text: `${symbol} Price History`,
      style: {
        color: theme === 'dark' ? '#FFFFFF' : '#000000',
      },
    },
    credits: {
      enabled: false,
    },
    xAxis: {
      type: 'datetime',
      labels: {
        style: {
          color: theme === 'dark' ? '#CCCCCC' : '#666666',
        },
      },
      lineColor: theme === 'dark' ? '#333333' : '#CCCCCC',
      tickColor: theme === 'dark' ? '#333333' : '#CCCCCC',
    },
    yAxis: [
      {
        title: {
          text: 'Price (USD)',
          style: {
            color: theme === 'dark' ? '#CCCCCC' : '#666666',
          },
        },
        labels: {
          style: {
            color: theme === 'dark' ? '#CCCCCC' : '#666666',
          },
        },
        lineColor: theme === 'dark' ? '#333333' : '#CCCCCC',
        tickColor: theme === 'dark' ? '#333333' : '#CCCCCC',
      },
      {
        title: {
          text: 'Volume',
          style: {
            color: theme === 'dark' ? '#CCCCCC' : '#666666',
          },
        },
        labels: {
          style: {
            color: theme === 'dark' ? '#CCCCCC' : '#666666',
          },
        },
        opposite: true,
        lineColor: theme === 'dark' ? '#333333' : '#CCCCCC',
        tickColor: theme === 'dark' ? '#333333' : '#CCCCCC',
      },
    ],
    legend: {
      enabled: true,
      itemStyle: {
        color: theme === 'dark' ? '#CCCCCC' : '#333333',
      },
      itemHoverStyle: {
        color: theme === 'dark' ? '#FFFFFF' : '#000000',
      },
    },
    plotOptions: {
      series: {
        animation: true,
      },
    },
    series: [
      {
        type: 'line',
        name: `${symbol} Price`,
        data: [],
        color: '#FF9500',
        tooltip: {
          valueDecimals: 2,
          valuePrefix: '$',
        },
      },
      {
        type: 'column',
        name: 'Volume',
        data: [],
        color: 'rgba(255, 149, 0, 0.3)',
        yAxis: 1,
      },
    ],
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500,
          },
          chartOptions: {
            chart: {
              height: 300,
            },
            subtitle: {
              text: undefined,
            },
            navigator: {
              enabled: false,
            },
          },
        },
      ],
    },
  });
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

        if (historicalData.length === 0) {
          throw new Error('No historical data available');
        }

        // Filter out points with invalid date or missing price
        const validHistoricalData = historicalData.filter(
          (dp: HistoricalDataPoint) =>
            dp.price != null &&
            (dp.date instanceof Date ||
              ((typeof dp.date === 'string' || typeof dp.date === 'number') &&
                !isNaN(new Date(dp.date).getTime())))
        );

        // Format data for Highcharts using only valid points
        const priceData = validHistoricalData.map((dataPoint: HistoricalDataPoint) => {
          // Handle both Date objects and ISO strings/numbers
          const timestamp = dataPoint.date instanceof Date
            ? dataPoint.date.getTime()
            : new Date(dataPoint.date!).getTime(); // Safe due to filter

          return [
            timestamp,
            dataPoint.price!, // Safe due to filter
          ];
        });

        const volumeData = validHistoricalData.map((dataPoint: HistoricalDataPoint) => {
          // Handle both Date objects and ISO strings/numbers
          const timestamp = dataPoint.date instanceof Date
            ? dataPoint.date.getTime()
            : new Date(dataPoint.date!).getTime(); // Safe due to filter

          // Use a default volume if missing
          const volume = dataPoint.volume ?? 0;

          return [
            timestamp,
            volume,
          ];
        });

        // Update chart options with the new data
        setChartOptions(prevOptions => ({
          ...prevOptions,
          series: [
            {
              ...prevOptions.series?.[0],
              type: 'line',
              data: priceData,
            } as Highcharts.SeriesOptionsType,
            {
              ...prevOptions.series?.[1],
              type: 'column',
              data: volumeData,
            } as Highcharts.SeriesOptionsType,
          ],
        }));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
        setLoading(false);
      }
    };

    fetchData();
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
            onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}
            className="px-4 py-2 bg-[#FF9500] text-white rounded hover:bg-opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={chartOptions}
      constructorType={'stockChart'}
    />
  );
};

export default HighchartsView;
