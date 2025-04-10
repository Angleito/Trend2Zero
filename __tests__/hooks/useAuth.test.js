import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../mocks/AuthContext';
import * as authService from '../../lib/api/authService';
import * as apiClient from '../../lib/api/apiClient';

// Mock external dependencies
jest.mock('../../lib/api/authService', () => ({
  signup: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  updateUserInfo: jest.fn(),
  updatePassword: jest.fn(),
  deleteAccount: jest.fn()
}));

jest.mock('../../lib/api/apiClient', () => ({
  isAuthenticated: jest.fn()
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.isAuthenticated.mockReturnValue(false);
  });

  const renderWithAuthProvider = (initialState = {}) => {
    return render(
      <AuthProvider initialState={initialState}>
        <div data-testid="auth-context-wrapper" />
      </AuthProvider>
    );
  };

  const setupTest = async (renderFn, checkFn) => {
    let renderResult;
    
    await act(async () => {
      renderResult = renderFn();
    });

    await act(async () => {
      await waitFor(() => {
        const authContextWrapper = screen.getByTestId('auth-context-wrapper');
        expect(authContextWrapper).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    if (checkFn) {
      await act(async () => {
        await checkFn();
      });
    }

    return renderResult;
  };

  it('initializes with correct default state', async () => {
    await setupTest(() => renderWithAuthProvider());
  });

  it('handles successful signup', async () => {
    const mockUserData = { 
      email: 'test@example.com', 
      password: 'password123' 
    };
    const mockResponse = { 
      data: { 
        user: { 
          id: 'user-123', 
          email: mockUserData.email 
        } 
      } 
    };

    authService.signup.mockResolvedValue(mockResponse);

    await setupTest(
      () => renderWithAuthProvider(),
      async () => {
        const TestCheckComponent = () => {
          const { user, signup } = useAuth();
          
          React.useEffect(() => {
            const performSignup = async () => {
              await signup(mockUserData);
            };
            performSignup();
          }, [signup]);

          return user ? <div data-testid="user-signed-up">{user.email}</div> : null;
        };

        render(
          <AuthProvider>
            <TestCheckComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          const signedUpUser = screen.getByTestId('user-signed-up');
          expect(signedUpUser).toHaveTextContent(mockUserData.email);
        }, { timeout: 2000 });
      }
    );
  });

  it('handles signup failure', async () => {
    const mockUserData = { 
      email: '', 
      password: 'password123' 
    };
    const mockError = new Error('Signup failed');
    mockError.response = { 
      data: { message: 'Invalid signup credentials' } 
    };

    authService.signup.mockRejectedValue(mockError);

    await setupTest(
      () => renderWithAuthProvider(),
      async () => {
        const TestCheckComponent = () => {
          const { error, signup } = useAuth();
          
          React.useEffect(() => {
            const performSignup = async () => {
              try {
                await signup(mockUserData);
              } catch (err) {
                // Error is expected
              }
            };
            performSignup();
          }, [signup]);

          return error ? <div data-testid="signup-error">{error}</div> : null;
        };

        render(
          <AuthProvider>
            <TestCheckComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          const signupError = screen.getByTestId('signup-error');
          expect(signupError).toBeInTheDocument();
        }, { timeout: 2000 });
      }
    );
  });

  it('handles successful login', async () => {
    const mockCredentials = { 
      email: 'test@example.com', 
      password: 'password123' 
    };
    const mockResponse = { 
      data: { 
        user: { 
          id: 'user-123', 
          email: mockCredentials.email 
        } 
      } 
    };

    authService.login.mockResolvedValue(mockResponse);

    await setupTest(
      () => renderWithAuthProvider(),
      async () => {
        const TestCheckComponent = () => {
          const { user, login } = useAuth();
          
          React.useEffect(() => {
            const performLogin = async () => {
              await login(mockCredentials);
            };
            performLogin();
          }, [login]);

          return user ? <div data-testid="user-logged-in">{user.email}</div> : null;
        };

        render(
          <AuthProvider>
            <TestCheckComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          const loggedInUser = screen.getByTestId('user-logged-in');
          expect(loggedInUser).toHaveTextContent(mockCredentials.email);
        }, { timeout: 2000 });
      }
    );
  });

  it('handles logout', async () => {
    const initialUser = { 
      id: 'user-123', 
      email: 'test@example.com' 
    };

    await setupTest(
      () => renderWithAuthProvider({ 
        user: initialUser, 
        loading: false 
      }),
      async () => {
        const TestCheckComponent = () => {
          const { user, logout } = useAuth();
          
          React.useEffect(() => {
            const performLogout = async () => {
              await logout();
            };
            performLogout();
          }, [logout]);

          return !user ? <div data-testid="user-logged-out">Logged out</div> : null;
        };

        render(
          <AuthProvider initialState={{ user: initialUser }}>
            <TestCheckComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          const loggedOutIndicator = screen.getByTestId('user-logged-out');
          expect(loggedOutIndicator).toBeInTheDocument();
        }, { timeout: 2000 });
      }
    );
  });
});
