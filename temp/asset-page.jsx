export default function AssetDetailPage({ params }) {
    const symbol = params.symbol;
    return (<div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{symbol}</h1>
          <p className="text-gray-400">Symbol: {symbol}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Asset Performance</h2>
          <p>Detailed asset data will be displayed here.</p>
        </div>
      </div>
    </div>);
}
export function generateStaticParams() {
    return [
        { symbol: 'BTC' },
        { symbol: 'ETH' },
        { symbol: 'AAPL' },
        { symbol: 'GOOGL' }
    ];
}
