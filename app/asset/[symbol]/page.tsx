// app/asset/[symbol]/page.tsx
import marketDataService from '../../../lib/services/marketDataService';
import type { AssetData } from '../../../lib/types';
import HighchartsView from '../../../components/HighchartsView'; // Import the Highcharts component

// Define a type for historical data based on expected backend response
// Assuming the backend returns an array of objects like { timestamp: number, price: number }
interface HistoricalDataItem {
  timestamp: number; // Unix timestamp
  price: number;
}

// Server-side data fetching for current asset data
async function fetchAssetData(symbol: string): Promise<AssetData | null> {
  try {
    const marketService = marketDataService;
    // This currently uses a local service, we might want to proxy this later too
    return await marketService.getAssetPrice(symbol);
  } catch (err) {
    console.error('Error fetching asset data:', err);
    return null;
  }
}

// Server-side data fetching for historical data using the new proxy route
async function fetchHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataItem[] | null> {
  try {
    // Call the new frontend API proxy route
    const response = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/historical-data/${symbol}?days=${days}`);

    if (!response.ok) {
      console.error(`Error fetching historical data from proxy: ${response.status} ${response.statusText}`);
      // Attempt to read error body if available
      try {
        const errorBody = await response.json();
        console.error('Error details:', errorBody);
      } catch (jsonError) {
        console.error('Could not parse error body as JSON', jsonError);
      }
      return null;
    }

    const data = await response.json();
    // Assuming the backend returns an array of historical data items directly
    return data;

  } catch (err: any) {
    console.error(`Error fetching historical data for ${symbol}:`, err);
    return null;
  }
}


// Loading component
function LoadingState() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF9500]"></div>
    </div>
  );
}

// Error component
function ErrorState({ symbol }: { symbol: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
        <p className="text-red-500 mb-6">Failed to load asset data for {symbol}</p>
        <a href="/tracker" className="bg-[#FF9500] hover:bg-opacity-90 text-white px-6 py-2 rounded-md transition-colors">
          Back to Asset Tracker
        </a>
      </div>
    </div>
  );
}

type AssetDetailPageProps = { params: { symbol: string } };

export default async function AssetDetailPage(props: AssetDetailPageProps) {
  const { symbol } = props.params;

  // Fetch both current asset data and historical data concurrently
  const [assetData, historicalData] = await Promise.all([
    fetchAssetData(symbol),
    fetchHistoricalData(symbol, 90) // Fetch 90 days of historical data
  ]);


  if (!assetData) {
    return <ErrorState symbol={symbol} />;
  }

  // Prepare data for Highcharts - it expects an array of [timestamp, price]
  const chartData = historicalData?.map(item => [item.timestamp * 1000, item.price]) || []; // Convert timestamp to milliseconds


  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{symbol}</h1>
          <p className="text-gray-400">Symbol: {symbol}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Asset Performance</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-black">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Change
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Change %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {assetData.price ? assetData.price.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={assetData.change && assetData.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {assetData.change ? `${assetData.change >= 0 ? '+' : ''}${assetData.change.toFixed(2)}` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={assetData.changePercent && assetData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {assetData.changePercent ? `${assetData.changePercent >= 0 ? '+' : ''}${assetData.changePercent.toFixed(2)}%` : 'N/A'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Add the HighchartsView component to display historical data */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
           <h2 className="text-xl font-bold text-white mb-4">Historical Data</h2>
           {historicalData === null ? (
             <p className="text-red-500">Failed to load historical data.</p>
           ) : historicalData.length === 0 ? (
             <p className="text-gray-400">No historical data available.</p>
           ) : (
             <HighchartsView data={chartData} title={`${symbol} Historical Price`} />
           )}
        </div>

      </div>
    </div>
  );
}

// Enable static generation for specific symbols
export async function generateStaticParams() {
  return [
    { symbol: 'BTC' },
    { symbol: 'ETH' },
    { symbol: 'AAPL' },
    { symbol: 'GOOGL' }
  ];
}
