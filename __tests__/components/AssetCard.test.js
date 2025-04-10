import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssetCard from '../../components/AssetCard';
import { useAssetPrice } from '../../lib/hooks/useMarketData';
import { useWatchlist } from '../../lib/hooks/useWatchlist';
import { useAuth } from '../../lib/hooks/useAuth';

// Mock the hooks
jest.mock('../../lib/hooks/useMarketData', () => ({
  useAssetPrice: jest.fn()
}));

jest.mock('../../lib/hooks/useWatchlist', () => ({
  useWatchlist: jest.fn()
}));

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('AssetCard Component', () => {
  const mockAsset = {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'Cryptocurrency',
    priceInUSD: 50000,
    priceInBTC: 1,
    change24h: 5,
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    useAssetPrice.mockReturnValue({
      priceData: { data: mockAsset },
      loading: false,
      error: null
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

  it('renders asset information correctly', () => {
    const { container } = render(<AssetCard asset={mockAsset} />);
    console.log('Container HTML:', container.innerHTML);

    // Check if asset name and symbol are displayed
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();

    // Check if price is displayed using a more flexible regex
    const priceElements = screen.getAllByText(/\$50,?000/);
    expect(priceElements.length).toBeGreaterThan(0);

    // Check if price change is displayed
    const changeElements = screen.getAllByText(/\+5\.00%/);
    expect(changeElements.length).toBeGreaterThan(0);
  });

  it('shows loading state when fetching price data', () => {
    useAssetPrice.mockReturnValue({
      priceData: null,
      loading: true,
      error: null
    });

    render(<AssetCard asset={mockAsset} />);

    // Check for loading indicators
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('handles error state correctly', () => {
    useAssetPrice.mockReturnValue({
      priceData: null,
      loading: false,
      error: new Error('Failed to fetch')
    });

    render(<AssetCard asset={mockAsset} />);

    // Check for error message
    expect(screen.getByText('Error loading data')).toBeInTheDocument();
  });

  it('shows additional details when showDetails is true', () => {
    const assetWithDetails = {
      ...mockAsset,
      marketCap: 1000000000000,
      volume24h: 50000000000,
      returns: {
        ytd: 20
      }
    };

    useAssetPrice.mockReturnValue({
      priceData: { data: assetWithDetails },
      loading: false,
      error: null
    });

    render(<AssetCard asset={assetWithDetails} showDetails={true} />);

    // Check if additional details are displayed
    expect(screen.getByText('Market Cap:')).toBeInTheDocument();
    expect(screen.getByText('24h Volume:')).toBeInTheDocument();
    expect(screen.getByText('YTD Return:')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('handles watchlist toggle correctly when authenticated', async () => {
    const mockIsInWatchlist = jest.fn().mockReturnValue(false);
    const mockAddToWatchlist = jest.fn().mockResolvedValue({});

    useWatchlist.mockReturnValue({
      isInWatchlist: mockIsInWatchlist,
      addToWatchlist: mockAddToWatchlist,
      removeFromWatchlist: jest.fn()
    });

    render(<AssetCard asset={mockAsset} />);

    // Find and click the watchlist button
    const watchlistButton = screen.getByTitle('Add to watchlist');
    fireEvent.click(watchlistButton);

    // Check if addToWatchlist was called with correct parameters
    await waitFor(() => {
      expect(mockAddToWatchlist).toHaveBeenCalledWith('BTC', 'Cryptocurrency');
    });
  });

  it('handles watchlist toggle correctly when already in watchlist', async () => {
    const mockIsInWatchlist = jest.fn().mockReturnValue(true);
    const mockRemoveFromWatchlist = jest.fn().mockResolvedValue({});

    useWatchlist.mockReturnValue({
      isInWatchlist: mockIsInWatchlist,
      addToWatchlist: jest.fn(),
      removeFromWatchlist: mockRemoveFromWatchlist
    });

    render(<AssetCard asset={mockAsset} />);

    // Find and click the watchlist button
    const watchlistButton = screen.getByTitle('Remove from watchlist');
    fireEvent.click(watchlistButton);

    // Check if removeFromWatchlist was called with correct parameters
    await waitFor(() => {
      expect(mockRemoveFromWatchlist).toHaveBeenCalledWith('BTC');
    });
  });

  it('does not show watchlist button when not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false
    });

    render(<AssetCard asset={mockAsset} />);

    // Check that watchlist button is not present
    expect(screen.queryByTitle('Add to watchlist')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove from watchlist')).not.toBeInTheDocument();
  });
});
