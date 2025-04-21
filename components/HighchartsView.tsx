// components/HighchartsView.tsx
'use client';

/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */

import { useEffect, useState, useRef } from 'react'; // Keep useRef for Highcharts instance
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

// Import necessary Highcharts modules dynamically
type HighchartsModule = (H: typeof Highcharts) => void;

// Initialize module variables
let exporting: HighchartsModule | null = null;
let exportData: HighchartsModule | null = null;
let accessibility: HighchartsModule | null = null;

if (typeof window !== 'undefined') {
  // This will only run on the client side
  import('highcharts/modules/exporting').then(module => {
    exporting = module.default;
    if (Highcharts) exporting(Highcharts);
  });

  import('highcharts/modules/export-data').then(module => {
    exportData = module.default;
    if (Highcharts) exportData(Highcharts);
  });

  import('highcharts/modules/accessibility').then(module => {
    accessibility = module.default;
    if (Highcharts) accessibility(Highcharts);
  });
}

// Update the props interface to accept data and title
export interface HighchartsViewProps {
  data: (number | null | [number, number | null])[][]; // Highcharts data format: array of [timestamp, value]
  title: string;
  symbol?: string; // Keep symbol as optional if still needed for context, but not for data fetching
  theme?: 'light' | 'dark';
  days?: number; // Keep days as optional, not used for data fetching here
}

const HighchartsView = ({
  data, // Accept data prop
  title, // Accept title prop
  symbol, // Keep symbol prop (optional)
  theme = 'dark',
  days = 30, // Keep days prop (optional)
}: HighchartsViewProps) => {
  // Use useRef to hold the chart instance if needed for direct manipulation
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

  // Define chart options based on props
  const chartOptions: Highcharts.Options = {
    chart: {
      backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
      style: {
        fontFamily: 'Inter, sans-serif',
      },
    },
    title: {
      text: title, // Use the title prop
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
    yAxis: { // Simplified to one Y-axis for price data
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
        name: `${symbol || 'Asset'} Price`, // Use symbol prop if available, otherwise default
        data: data, // Use the data prop
        color: '#FF9500',
        tooltip: {
          valueDecimals: 2,
          valuePrefix: '$',
        },
      },
      // Removed the volume series as the historical data endpoint only provides price
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
  };

  // Removed internal loading and error states, and the useEffect for data fetching

  // The parent component (AssetDetailPage) will handle loading and error states
  // Render the chart only if data is provided and not empty
  if (!data || data.length === 0) {
      // This case should ideally be handled by the parent component rendering logic
      // but as a fallback, we can return null or a message here.
      // However, the parent is already checking for historicalData === null or length === 0
      // So, if we reach here, data should be a non-empty array.
      return null; // Or a placeholder if needed
  }


  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={chartOptions}
      constructorType={'stockChart'}
      ref={chartComponentRef} // Attach ref
    />
  );
};

export default HighchartsView;
