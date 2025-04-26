import { getPopularAssets } from '../../lib/services/marketDataService';
import { AssetTracker } from '../../components/AssetTracker';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Asset Tracker - Monitor Your Portfolio',
  description: 'Track and monitor your cryptocurrency, stock, and precious metal investments in real-time'
};

export default async function TrackerPage() {
  const assets = await getPopularAssets();
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <AssetTracker initialAssets={assets} />
    </main>
  );
}