import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackerPage from '../../app/tracker/page';
import * as useMarketDataHook from '../../lib/hooks/useMarketData';
import type { AssetCategory } from '../../lib/types';

// Mock child components
jest.mock('../../components/AssetSearch', () => {
  return function MockAssetSearch() {
    return <div data-testid="mock-asset-search">Mock Asset Search</div>;
  };
});

jest.mock('../../components/AssetPriceTable', () => {
  return function MockAssetPriceTable({ category }: { category?: AssetCategory | 'All' }) {
    return (
      <div data-testid="mock-asset-price-table">
        {category ? `Mock Asset Price Table for ${category}` : 'Mock Asset Price Table'}
      </div>
    );
  };
});

// Mock the useMarketData hook
jest.mock('../../lib/hooks/useMarketData', () => ({
  useMarketData: jest.fn()
}));

describe('Tracker Page', () => {
  let _mockSetSelectedCategory: jest.Mock;
  let _mockSelectedCategory: AssetCategory | 'All';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock values
    _mockSelectedCategory = 'All';
    _mockSetSelectedCategory = jest.fn((newCategory: AssetCategory | 'All') => {
      _mockSelectedCategory = newCategory;
    });

    // Setup default mock for useMarketData
    (useMarketDataHook.useMarketData as jest.Mock).mockReturnValue({
      popularAssets: [],
      loading: false,
      error: null
    });
  });

  it('renders tracker page components with default data', () => {
    // Setup mock hook return value
    (useMarketDataHook.useMarketData as jest.Mock).mockReturnValue({
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
    (useMarketDataHook.useMarketData as jest.Mock).mockReturnValue({
      popularAssets: [],
      loading: true,
      error: null
    });

    render(<TrackerPage />);

    // Check for loading indicator
    expect(screen.getByText(/loading market data/i)).toBeInTheDocument();
  });

  it('handles error state', () => {
    // Setup mock hook return value for error state
    const errorMessage = 'Failed to fetch market data';
    (useMarketDataHook.useMarketData as jest.Mock).mockReturnValue({
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
    
    // Find and verify the category button
    const button = screen.getByText('All');
    expect(button).toHaveClass('bg-[#FF9500]');
  });

  it('allows changing category', () => {
    const { rerender } = render(<TrackerPage />);

    // Find and click the Stocks category button
    const stocksButton = screen.getByTestId('category-btn-stocks');
    fireEvent.click(stocksButton);

    // Re-render to reflect the new state
    rerender(<TrackerPage />);

    // Verify the Stocks button is now active
    expect(stocksButton).toHaveClass('bg-[#FF9500]');
  });
});