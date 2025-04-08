import { render, screen } from '@testing-library/react';
import Home from '../pages/index';

// Mock any components or hooks used in the Home component
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
  }),
}));

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
    // This is a basic test - update with actual content from your Home page
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
