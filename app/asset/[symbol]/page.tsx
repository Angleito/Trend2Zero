import { MarketDataService } from '../../../lib/services/marketDataService';
import type { AssetData } from '../../../lib/types';

// Server-side data fetching
async function fetchAssetData(symbol: string): Promise<AssetData | null> {
  try {
    const marketService = new MarketDataService();
    return await marketService.getAssetPriceInBTC(symbol);
  } catch (err) {
    console.error('Error fetching asset data:', err);
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
  const assetData = await fetchAssetData(symbol);

  if (!assetData) {
    return <ErrorState symbol={symbol} />;
  }

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
                    {assetData.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={assetData.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {assetData.change >= 0 ? '+' : ''}{assetData.change.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={assetData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {assetData.changePercent >= 0 ? '+' : ''}{assetData.changePercent.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
