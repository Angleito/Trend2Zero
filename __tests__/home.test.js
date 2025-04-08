import { render, screen } from '@testing-library/react';
import Home from '../app/page';

// Mock any components or hooks used in the Home component
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    pathname: '/',
  }),
}));

describe('Home Page', () => {
  it('renders main heading without crashing', () => {
    render(<Home />);
    // Look for the specific main page heading
    const mainHeading = screen.getByRole('heading', {
      name: /Everything Trends to Zero in Bitcoin Terms/i
    });
    expect(mainHeading).toBeInTheDocument();
  });
});
