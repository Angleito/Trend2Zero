import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarketPage from '../../pages/market';
import { usePopularAssets, useAssetsByType, useAssetSearch } from '../../lib/hooks/useMarketData';

// Mock the hooks
jest.mock('../../lib/hooks/useMarketData', () => ({
  usePopularAssets: jest.fn(),
  useAssetsByType: jest.fn(),
  useAssetSearch: jest.fn()
}));

// Mock the AssetCard component
jest.mock('../../components/AssetCard', () => {
  return function MockAssetCard({ asset }) {
    return (
      <div data-testid="asset-card">
        <div data-testid="asset-symbol">{asset.symbol}</div>
        <div data-testid="asset-name">{asset.name}</div>
      </div>
    );
  };
});

// Mock next/head
jest.mock('next/head', () => {
  return function MockHead({ children }) {
    return <div data-testid="head">{children}</div>;
  };
});

describe('Market Page', () => {
  const mockPopularAssets = [
    { symbol: 'BTC', name: 'Bitcoin', assetType: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', assetType: 'crypto' },
    { symbol: 'AAPL', name: 'Apple Inc', assetType: 'stock' }
  ];

  const mockCryptoAssets = [
    { symbol: 'BTC', name: 'Bitcoin', assetType: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', assetType: 'crypto' }
  ];

  const mockSearchResults = [
    { symbol: 'BTC', name: 'Bitcoin', assetType: 'crypto' },
    { symbol: 'BCH', name: 'Bitcoin Cash', assetType: 'crypto' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    usePopularAssets.mockReturnValue({
      popularAssets: mockPopularAssets,
      loading: false,
      error: null,
      refetch: jest.fn()
    });
    
    useAssetsByType.mockReturnValue({
      assets: mockCryptoAssets,
      loading: false,
      error: null,
      refetch: jest.fn()
    });
    
    useAssetSearch.mockReturnValue({
      search: jest.fn(),
      searchResults: [],
      loading: false,
      error: null
    });
  });

  it('renders the page title and search bar', () => {
    render(<MarketPage />);
    
    // Check page title
    expect(screen.getByText('Market Data')).toBeInTheDocument();
    
    // Check search bar
    expect(screen.getByPlaceholderText('Search assets...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('renders asset type tabs', () => {
    render(<MarketPage />);
    
    // Check asset type tabs
    expect(screen.getByRole('button', { name: 'Popular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cryptocurrencies' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stocks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Precious Metals' })).toBeInTheDocument();
  });

  it('renders popular assets by default', () => {
    render(<MarketPage />);
    
    // Check that popular assets are displayed
    const assetCards = screen.getAllByTestId('asset-card');
    expect(assetCards).toHaveLength(3);
    
    // Check specific assets
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  it('switches to cryptocurrency assets when tab is clicked', () => {
    render(<MarketPage />);
    
    // Click on Cryptocurrencies tab
    fireEvent.click(screen.getByRole('button', { name: 'Cryptocurrencies' }));
    
    // Check that crypto assets are displayed
    const assetCards = screen.getAllByTestId('asset-card');
    expect(assetCards).toHaveLength(2);
    
    // Check specific assets
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
  });

  it('performs search when search form is submitted', async () => {
    // Mock search function and results
    const mockSearch = jest.fn();
    useAssetSearch.mockReturnValue({
      search: mockSearch,
      searchResults: mockSearchResults,
      loading: false,
      error: null
    });
    
    render(<MarketPage />);
    
    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search assets...');
    fireEvent.change(searchInput, { target: { value: 'bitcoin' } });
    
    // Submit search form
    fireEvent.submit(searchInput);
    
    // Check that search function was called
    expect(mockSearch).toHaveBeenCalledWith('bitcoin');
    
    // Check that search results are displayed
    const assetCards = screen.getAllByTestId('asset-card');
    expect(assetCards).toHaveLength(2);
    
    // Check specific assets
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('BCH')).toBeInTheDocument();
  });

  it('shows loading state when fetching data', () => {
    // Mock loading state
    usePopularAssets.mockReturnValue({
      popularAssets: [],
      loading: true,
      error: null,
      refetch: jest.fn()
    });
    
    render(<MarketPage />);
    
    // Check for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryAllByTestId('asset-card')).toHaveLength(0);
  });

  it('shows empty state when no assets are found', () => {
    // Mock empty results
    usePopularAssets.mockReturnValue({
      popularAssets: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    });
    
    render(<MarketPage />);
    
    // Check for empty state message
    expect(screen.getByText('No assets found')).toBeInTheDocument();
    expect(screen.queryAllByTestId('asset-card')).toHaveLength(0);
  });

  it('shows empty search results message when search returns no results', () => {
    // Mock empty search results
    const mockSearch = jest.fn();
    useAssetSearch.mockReturnValue({
      search: mockSearch,
      searchResults: [],
      loading: false,
      error: null
    });
    
    render(<MarketPage />);
    
    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search assets...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    // Submit search form
    fireEvent.submit(searchInput);
    
    // Check for empty search results message
    expect(screen.getByText('No results found for "nonexistent"')).toBeInTheDocument();
  });
});
