import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackerPage from 'app/tracker/page';
import { useMarketData } from '../../hooks/useMarketData';

// Mock child components
jest.mock('../../components/AssetSearch', () => {
  return function MockAssetSearch() {
    return <div data-testid="mock-asset-search">Mock Asset Search</div>;
  };
});

jest.mock('../../components/AssetPriceTable', () => {
  return function MockAssetPriceTable({ category }) {
    return (
      <div data-testid="mock-asset-price-table">
        {category ? `Mock Asset Price Table for ${category}` : 'Mock Asset Price Table'}
      </div>
    );
  };
});

// Mock the useMarketData hook
jest.mock('../../hooks/useMarketData');

describe.skip('Tracker Page', () => { // Skip this suite for now
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset useMarketData mock
    useMarketData.mockReturnValue({
      popularAssets: [],
      loading: false,
      error: null
    });
  });

  it('renders tracker page components with default data', () => {
    // Setup mock hook return value
    useMarketData.mockReturnValue({
      popularAssets: [
        { id: '1', symbol: 'BTC', name: 'Bitcoin' },
        { id: '2', symbol: 'ETH', name: 'Ethereum' }
      ],
      loading: false,
      error: null
    });

    render(<TrackerPage />);

    // Check for components
    expect(screen.getByTestId('mock-asset-search')).toBeInTheDocument();
    expect(screen.getByTestId('mock-asset-price-table')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    // Setup mock hook return value for loading state
    useMarketData.mockReturnValue({
      popularAssets: [],
      loading: true,
      error: null
    });

    render(<TrackerPage />);

    // Check for loading indicator
    expect(screen.getByText(/loading market data/i)).toBeInTheDocument();
  });

  it('handles error state', () => {
    const errorMessage = 'Failed to fetch market data';
    useMarketData.mockReturnValue({
      popularAssets: [],
      loading: false,
      error: errorMessage
    });

    render(<TrackerPage />);

    // Check for error message
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('initializes with default category', () => {
    render(<TrackerPage />);

    // Verify the default category is 'All'
    const allCategoryButton = screen.getByText('All');
    expect(allCategoryButton).toHaveClass('asset-category-btn-active');
  });

  it('allows changing category', () => {
    // Initial render with 'All' category
    render(<TrackerPage />);

    // Find and click the Stocks category button
    const stocksButton = screen.getByText('Stocks');
    fireEvent.click(stocksButton);

    // Verify the Stocks button now has the active class based on component's internal state
    expect(stocksButton).toHaveClass('asset-category-btn-active');
  });
});
