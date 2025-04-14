import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../app/page';

// Mock the marketDataService
jest.mock('../lib/services/marketDataService', () => ({
  getAssetPriceInBTC: jest.fn().mockResolvedValue({
    symbol: 'BTC',
    price: 67890.12,
    change: 1234.56,
    changePercent: 2.34,
    priceInBTC: 1.0,
    priceInUSD: 67890.12,
    lastUpdated: new Date().toISOString()
  })
}));

// Mock any components or hooks used in the Home component
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    pathname: '/',
  }),
}));

// Mock the BitcoinTicker or any other component that might be causing delays
jest.mock('../components/BitcoinTicker', () => {
  // Define the mock component *outside* the factory return if it uses hooks
  const MockBitcoinTicker = () => {
    const [price, setPrice] = React.useState('...'); 
    React.useEffect(() => { 
      // Simulate fetching price after initial render
      const timer = setTimeout(() => setPrice('65000'), 10); // Short delay to mimic async
      return () => clearTimeout(timer); // Cleanup timer
    }, []);

    return <div data-testid="mock-bitcoin-ticker">Bitcoin Price: {price}</div>;
  };
  return MockBitcoinTicker; // Return the component itself
});

describe('Home Page', () => {
  it('renders main heading without crashing', async () => {
    render(<Home />);
    
    // Wait for the heading to be in the document, accounting for any loading states
    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', {
        name: /Everything Trends to Zero in Bitcoin Terms/i
      });
      expect(mainHeading).toBeInTheDocument();
    });
  });
});
