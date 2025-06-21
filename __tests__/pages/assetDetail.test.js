import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssetDetailPage from '../../app/asset/[symbol]/page';
import { useAssetPrice, useHistoricalData } from '../../lib/hooks/useMarketData';
import { useWatchlist } from '../../lib/hooks/useWatchlist';
import { useAuth } from '../../lib/hooks/useAuth';

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

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { symbol: 'BTC' },
    push: jest.fn(),
    back: jest.fn()
  })
}));

// Mock next/head
jest.mock('next/head', () => {
  return function MockHead({ children }) {
    return <div data-testid="head">{children}</div>;
  };
});

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
    
    render(<AssetDetailPage />);
    
    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state when asset data fetch fails', () => {
    useAssetPrice.mockReturnValue({
      priceData: null,
      loading: false,
      error: new Error('Failed to fetch asset data'),
      refetch: jest.fn()
    });
    
    render(<AssetDetailPage />);
    
    // Check for error message
    expect(screen.getByText('Error loading asset data. Please try again later.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
  });

  it('renders asset information correctly', () => {
    render(<AssetDetailPage />);
    
    // Check asset header
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Cryptocurrency')).toBeInTheDocument();
    
    // Check price information
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('+5.00%')).toBeInTheDocument();
    expect(screen.getByText('1 BTC')).toBeInTheDocument();
    
    // Check market information
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('$1,000,000,000,000')).toBeInTheDocument();
    expect(screen.getByText('24h Volume')).toBeInTheDocument();
    expect(screen.getByText('$50,000,000,000')).toBeInTheDocument();
  });

  it('renders historical chart section', () => {
    render(<AssetDetailPage />);
    
    // Check chart section
    expect(screen.getByText('Price Chart')).toBeInTheDocument();
    
    // Check time period buttons
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3M' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6M' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('changes time period when period button is clicked', () => {
    render(<AssetDetailPage />);
    
    // Click on 7D button
    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    
    // Check that useHistoricalData was called with new period
    expect(useHistoricalData).toHaveBeenCalledWith('BTC', { days: 7 });
  });

  it('renders watchlist button when authenticated', () => {
    render(<AssetDetailPage />);
    
    // Check watchlist button
    expect(screen.getByRole('button', { name: 'Add to Watchlist' })).toBeInTheDocument();
  });

  it('renders "Remove from Watchlist" button when asset is in watchlist', () => {
    useWatchlist.mockReturnValue({
      isInWatchlist: jest.fn().mockReturnValue(true),
      addToWatchlist: jest.fn(),
      removeFromWatchlist: jest.fn()
    });
    
    render(<AssetDetailPage />);
    
    // Check watchlist button
    expect(screen.getByRole('button', { name: 'Remove from Watchlist' })).toBeInTheDocument();
  });

  it('handles watchlist toggle correctly', async () => {
    const mockAddToWatchlist = jest.fn().mockResolvedValue({});
    useWatchlist.mockReturnValue({
      isInWatchlist: jest.fn().mockReturnValue(false),
      addToWatchlist: mockAddToWatchlist,
      removeFromWatchlist: jest.fn()
    });
    
    render(<AssetDetailPage />);
    
    // Click watchlist button
    fireEvent.click(screen.getByRole('button', { name: 'Add to Watchlist' }));
    
    // Check that addToWatchlist was called
    await waitFor(() => {
      expect(mockAddToWatchlist).toHaveBeenCalledWith('BTC', 'Cryptocurrency');
    });
  });

  it('redirects to login when trying to add to watchlist while not authenticated', () => {
    const mockRouter = { push: jest.fn() };
    jest.mock('next/router', () => ({
      useRouter: () => ({
        query: { symbol: 'BTC' },
        push: mockRouter.push
      })
    }));
    
    useAuth.mockReturnValue({
      isAuthenticated: false
    });
    
    render(<AssetDetailPage />);
    
    // Click watchlist button
    fireEvent.click(screen.getByRole('button', { name: 'Add to Watchlist' }));
    
    // Check that router.push was called with login path
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
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
    
    render(<AssetDetailPage />);
    
    // Click refresh button
    fireEvent.click(screen.getByRole('button', { name: 'Refresh Data' }));
    
    // Check that refetch functions were called
    expect(mockRefetchPrice).toHaveBeenCalled();
    expect(mockRefetchHistory).toHaveBeenCalled();
  });
});
