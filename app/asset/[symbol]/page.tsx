import { Metadata } from 'next';
import { getAssetPrice, getHistoricalData } from '../../../lib/services/marketDataService';
import { AssetDetailView } from '../../../components/AssetDetailView';

export async function generateMetadata({ params }: { params: { symbol: string } }): Promise<Metadata> {
  const awaitedParams = await params; // Await params
  const { symbol } = awaitedParams; // Destructure from awaited params
  const asset = await getAssetPrice(symbol);
  
  return {
    title: asset ? `${asset.name} (${symbol.toUpperCase()}) - Price & Charts` : `${symbol.toUpperCase()} - Asset Details`,
    description: asset ? `View real-time price charts and market data for ${asset.name} (${symbol.toUpperCase()})` : `Detailed market analysis and charts for ${symbol.toUpperCase()}`
  };
}

export default async function AssetPage({ params }: { params: { symbol: string } }) {
  const awaitedParams = await params; // Await params
  const { symbol } = awaitedParams; // Destructure from awaited params
  const [asset, historicalData] = await Promise.all([
    getAssetPrice(symbol),
    getHistoricalData(symbol, 30)
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <AssetDetailView
        symbol={symbol}
        asset={asset}
        historicalData={historicalData}
      />
    </main>
  );
}
