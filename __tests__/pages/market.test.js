import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MarketPage from '../../app/tracker/page';
import * as useMarketDataHook from '../../lib/hooks/useMarketData';

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

// Mock React's useState
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useState: jest.fn((initialState) => {
      const state = typeof initialState === 'function' 
        ? initialState() 
        : initialState;
      const setState = jest.fn((newState) => {
        state = typeof newState === 'function' ? newState(state) : newState;
      });
      return [state, setState];
    })
  };
});

// Mock the useMarketData hook
jest.mock('../../lib/hooks/useMarketData', () => ({
  useMarketData: jest.fn()
}));

describe('Market Page', () => {
  let mockSetSelectedCategory;
  let mockSelectedCategory;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock for useState
    mockSelectedCategory = 'All';
    mockSetSelectedCategory = jest.fn((newCategory) => {
      mockSelectedCategory = newCategory;
    });

    React.useState.mockImplementation((initialState) => {
      const state = typeof initialState === 'function' 
        ? initialState() 
        : initialState;
      return [mockSelectedCategory, mockSetSelectedCategory];
    });

    // Setup default mock for useMarketData
    useMarketDataHook.useMarketData.mockReturnValue({
      popularAssets: [],
      loading: false,
      error: null
    });
  });

  it('renders market page components with default data', () => {
    // Setup mock hook return value
    useMarketDataHook.useMarketData.mockReturnValue({
      popularAssets: [
        { id: '1', symbol: 'BTC', name: 'Bitcoin' },
        { id: '2', symbol: 'ETH', name: 'Ethereum' }
      ],
      loading: false,
      error: null
    });

    render(<MarketPage />);

    // Check for components
    expect(screen.getByTestId('mock-asset-search')).toBeInTheDocument();
    expect(screen.getByTestId('mock-asset-price-table')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    // Setup mock hook return value for loading state
    useMarketDataHook.useMarketData.mockReturnValue({
      popularAssets: [],
      loading: true,
      error: null
    });

    render(<MarketPage />);

    // Check for loading indicator
    expect(screen.getByText(/loading market data/i)).toBeInTheDocument();
  });

  it('handles error state', () => {
    // Setup mock hook return value for error state
    const errorMessage = 'Failed to fetch market data';
    useMarketDataHook.useMarketData.mockReturnValue({
      popularAssets: [],
      loading: false,
      error: errorMessage
    });

    render(<MarketPage />);

    // Check for error message
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('initializes with default category', () => {
    render(<MarketPage />);

    // Verify the default category is 'All'
    const allCategoryButton = screen.getByText('All');
    expect(allCategoryButton).toHaveClass('asset-category-btn-active');
  });

  it('allows changing category', () => {
    // Initial render with 'All' category
    const { rerender } = render(<MarketPage />);

    // Find and click the Stocks category button
    const stocksButton = screen.getByText('Stocks');
    fireEvent.click(stocksButton);

    // Verify the setSelectedCategory was called with 'Stocks'
    expect(mockSetSelectedCategory).toHaveBeenCalledWith('Stocks');

    // Update the mock selected category to simulate state change
    mockSelectedCategory = 'Stocks';

    // Re-render to reflect the new state
    rerender(<MarketPage />);

    // Verify the asset price table reflects the selected category
    const assetPriceTable = screen.getByTestId('mock-asset-price-table');
    expect(assetPriceTable).toHaveTextContent('Mock Asset Price Table for Stocks');
  });
});
