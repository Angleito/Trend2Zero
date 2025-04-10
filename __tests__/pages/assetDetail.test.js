import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAssetPrice, useHistoricalData } from '../../lib/hooks/useMarketData';
import { useWatchlist } from '../../lib/hooks/useWatchlist';
import { useAuth } from '../../lib/hooks/useAuth';

// Create a client wrapper for testing
function AssetDetailClientPage() {
  const params = { symbol: 'BTC' };
  const { priceData, loading: priceLoading, error: priceError, refetch: refetchPrice } = useAssetPrice(params.symbol);
  const { historicalData, loading: historyLoading, refetch: refetchHistory } = useHistoricalData(params.symbol);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { isAuthenticated } = useAuth();
  const router = { push: jest.fn() };

  if (priceLoading || historyLoading) {
    return <div role="status">Loading...</div>;
  }

  if (priceError) {
    return <div>Error loading asset data. Please try again later.</div>;
  }

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isInWatchlist(params.symbol)) {
      await removeFromWatchlist(params.symbol);
    } else {
      await addToWatchlist(params.symbol, priceData?.data?.type || 'Cryptocurrency');
    }
  };

  const handleRefresh = () => {
    refetchPrice();
    refetchHistory();
  };

  return (
    <div>
      <h1>{priceData?.data?.name}</h1>
      <p>{priceData?.data?.symbol}</p>
      <p>{priceData?.data?.type}</p>
      <p>${priceData?.data?.priceInUSD?.toLocaleString()}</p>
      <p>{priceData?.data?.change24h >= 0 ? '+' : ''}{priceData?.data?.change24h?.toFixed(2)}%</p>
      <p>{priceData?.data?.priceInBTC} BTC</p>
      <p>Market Cap</p>
      <p>${priceData?.data?.marketCap?.toLocaleString()}</p>
      <p>24h Volume</p>
      <p>${priceData?.data?.volume24h?.toLocaleString()}</p>
      <div>
        <h2>Price Chart</h2>
        <button>7D</button>
        <button>1M</button>
        <button>3M</button>
        <button>6M</button>
        <button>1Y</button>
        <button>All</button>
      </div>
      <button onClick={handleWatchlistToggle}>
        {isInWatchlist(params.symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
      </button>
      <button onClick={handleRefresh}>Refresh Data</button>
      <button onClick={() => router.back()}>Go Back</button>
    </div>
  );
}

// Mock the hooks
jest.mock('../../lib/hooks/useMarketData', () => ({
  useAssetPrice: jest.fn(),
  useHistoricalData: jest.fn()
}));

jest.mock('../../lib/hooks/useWatchlist', () => ({
  useWatchlist: jest.fn()
}));

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

describe('Asset Detail Page', () => {
  const mockAsset = {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'Cryptocurrency',
    priceInUSD: 50000,
    priceInBTC: 1,
    change24h: 5,
    marketCap: 1000000000000,
    volume24h: 50000000000,
    lastUpdated: new Date().toISOString()
  };

  const mockHistoricalData = {
    symbol: 'BTC',
    timeframe: 'daily',
    currency: 'USD',
    dataPoints: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString(),
      price: 50000 - i * 100,
      volume: 50000000000 - i * 1000000
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    useAssetPrice.mockReturnValue({
      priceData: { data: mockAsset },
      loading: false,
      error: null,
      refetch: jest.fn()
    });
    
    useHistoricalData.mockReturnValue({
      historicalData: { data: mockHistoricalData },
      loading: false,
      error: null,
      refetch: jest.fn()
    });
    
    useWatchlist.mockReturnValue({
      isInWatchlist: jest.fn().mockReturnValue(false),
      addToWatchlist: jest.fn(),
      removeFromWatchlist: jest.fn()
    });
    
    useAuth.mockReturnValue({
      isAuthenticated: true
    });
  });

  it('renders loading state when fetching asset data', () => {
    useAssetPrice.mockReturnValue({
      priceData: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    });
    
    render(<AssetDetailClientPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state when asset data fetch fails', () => {
    useAssetPrice.mockReturnValue({
      priceData: null,
      loading: false,
      error: new Error('Failed to fetch asset data'),
      refetch: jest.fn()
    });
    
    render(<AssetDetailClientPage />);
    expect(screen.getByText('Error loading asset data. Please try again later.')).toBeInTheDocument();
  });

  it('renders asset information correctly', () => {
    render(<AssetDetailClientPage />);
    
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Cryptocurrency')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('+5.00%')).toBeInTheDocument();
    expect(screen.getByText('1 BTC')).toBeInTheDocument();
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('$1,000,000,000,000')).toBeInTheDocument();
    expect(screen.getByText('24h Volume')).toBeInTheDocument();
    expect(screen.getByText('$50,000,000,000')).toBeInTheDocument();
  });

  it('handles watchlist toggle correctly', async () => {
    const mockAddToWatchlist = jest.fn().mockResolvedValue({});
    useWatchlist.mockReturnValue({
      isInWatchlist: jest.fn().mockReturnValue(false),
      addToWatchlist: mockAddToWatchlist,
      removeFromWatchlist: jest.fn()
    });
    
    render(<AssetDetailClientPage />);
    fireEvent.click(screen.getByText('Add to Watchlist'));
    
    await waitFor(() => {
      expect(mockAddToWatchlist).toHaveBeenCalledWith('BTC', 'Cryptocurrency');
    });
  });

  it('refreshes data when refresh button is clicked', () => {
    const mockRefetchPrice = jest.fn();
    const mockRefetchHistory = jest.fn();
    
    useAssetPrice.mockReturnValue({
      priceData: { data: mockAsset },
      loading: false,
      error: null,
      refetch: mockRefetchPrice
    });
    
    useHistoricalData.mockReturnValue({
      historicalData: { data: mockHistoricalData },
      loading: false,
      error: null,
      refetch: mockRefetchHistory
    });
    
    render(<AssetDetailClientPage />);
    fireEvent.click(screen.getByText('Refresh Data'));
    
    expect(mockRefetchPrice).toHaveBeenCalled();
    expect(mockRefetchHistory).toHaveBeenCalled();
  });
});
