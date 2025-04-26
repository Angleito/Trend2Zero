import { getPopularAssets } from '../lib/services/marketDataService';
import { AssetList } from '../components/AssetList';
import { Metadata } from 'next';
import ClientWrapper from '../components/ClientWrapper';

export const metadata: Metadata = {
  title: 'Market Overview - Real-time Asset Prices',
  description: 'View real-time prices and market data for top cryptocurrencies, stocks, and precious metals'
};

export default async function HomePage() {
  const popularAssets = await getPopularAssets();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <ClientWrapper>
        <AssetList assets={popularAssets} />
      </ClientWrapper>
    </main>
  );
}
