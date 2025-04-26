import { AssetPrice, HistoricalDataPoint } from '../lib/types';
import { AssetPriceChart } from './AssetPriceChart';

interface AssetDetailViewProps {
  symbol: string;
  asset: AssetPrice | null;
  historicalData: HistoricalDataPoint[];
}

export function AssetDetailView({ symbol, asset, historicalData }: AssetDetailViewProps) {
  if (!asset) {
    return (
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Asset not found: {symbol.toUpperCase()}</h1>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{asset.name}</h1>
          <p className="text-gray-500">{symbol.toUpperCase()}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">${asset.priceInUSD.toLocaleString()}</div>
          <div className={`text-lg ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Price Chart</h2>
        <div className="h-[400px]">
          <AssetPriceChart data={historicalData} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Price (USD)</dt>
            <dd className="text-lg font-medium">${asset.priceInUSD.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Price (BTC)</dt>
            <dd className="text-lg font-medium">{asset.priceInBTC.toFixed(8)} BTC</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">24h Change</dt>
            <dd className={`text-lg font-medium ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Asset Type</dt>
            <dd className="text-lg font-medium">{asset.type}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}