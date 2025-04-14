import { render, act, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from '../../hooks/useAuth';
import React from 'react';
import * as apiClientModule from '../../lib/api/apiClient';  // Import the module for mocking

// Mock auth service
jest.mock('../../lib/api/authService', () => ({
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn()
}));

// Properly mock the apiClient module
jest.mock('../../lib/api/apiClient', () => ({
    ...jest.requireActual('../../lib/api/apiClient'),  // Retain original functions if needed
    getAuthToken: jest.fn(() => 'mocked-token')  // Mock getAuthToken to return a string
}));

const TestComponent = ({ onMount }) => {
    const auth = useAuth();
    React.useEffect(() => {
        if (onMount) onMount(auth);
    }, [auth, onMount]);
    
    return (
        <div data-testid="auth-context-wrapper">
            {auth.user && <div data-testid="user-logged-in">{auth.user.email}</div>}
            {auth.error && <div data-testid="auth-error">{auth.error}</div>}
        </div>
    );
};

const renderWithAuth = (ui, { providerProps } = {}) => {
    return render(
        <AuthProvider {...providerProps}>{ui}</AuthProvider>
    );
};

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        // Ensure the mock is reset
        apiClientModule.getAuthToken.mockClear();
    });

    const mockCredentials = {
        email: 'test@example.com',
        password: 'password123'
    };

    const mockUserData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
    };

    it('provides auth context', async () => {
        let authData;
        renderWithAuth(
            <TestComponent
                onMount={(data) => {
                    authData = data;
                }}
            />
        );

        await waitFor(() => {
            expect(authData).toBeDefined();
            expect(authData.login).toBeDefined();
            expect(authData.signup).toBeDefined();
            expect(authData.logout).toBeDefined();
            expect(apiClientModule.getAuthToken).toHaveBeenCalled();  // Verify it's called
        });
    });

    it('handles successful signup', async () => {
        const mockUser = { ...mockUserData, id: '123' };
        jest.spyOn(require('../../lib/api/authService'), 'signup')
            .mockResolvedValueOnce(mockUser);

        let authData;
        renderWithAuth(
            <TestComponent
                onMount={(data) => {
                    authData = data;
                }}
            />
        );

        await act(async () => {
            await authData.signup(mockUserData);
        });

        await waitFor(() => {
            expect(authData.user).toEqual(mockUser);
            expect(authData.error).toBeNull();
            expect(localStorage.getItem('token')).toBeDefined();
        });
    });

    it('handles successful login', async () => {
        const mockUser = { ...mockCredentials, id: '123' };
        jest.spyOn(require('../../lib/api/authService'), 'login')
            .mockResolvedValueOnce({ user: mockUser, token: 'test-token' });

        let authData;
        renderWithAuth(
            <TestComponent
                onMount={(data) => {
                    authData = data;
                }}
            />
        );

        await act(async () => {
            await authData.login(mockCredentials);
        });

        await waitFor(() => {
            expect(authData.user).toEqual(mockUser);
            expect(authData.error).toBeNull();
            expect(localStorage.getItem('token')).toBe('test-token');
        });
    });

    it('handles logout', async () => {
        const mockUser = { ...mockCredentials, id: '123' };
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', JSON.stringify(mockUser));

        let authData;
        renderWithAuth(
            <TestComponent
                onMount={(data) => {
                    authData = data;
                }}
            />
        );

        await act(async () => {
            await authData.logout();
        });

        await waitFor(() => {
            expect(authData.user).toBeNull();
            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
        });
    });

    it('handles login errors', async () => {
        const error = new Error('Invalid credentials');
        jest.spyOn(require('../../lib/api/authService'), 'login')
            .mockRejectedValueOnce(error);

        let authData;
        renderWithAuth(
            <TestComponent
                onMount={(data) => {
                    authData = data;
                }}
            />
        );

        await act(async () => {
            await authData.login(mockCredentials);
        });

        await waitFor(() => {
            expect(authData.error).toBe(error.message);
            expect(authData.user).toBeNull();
            expect(localStorage.getItem('token')).toBeNull();
        });
    });

    it('handles signup errors', async () => {
        const error = new Error('Email already exists');
        jest.spyOn(require('../../lib/api/authService'), 'signup')
            .mockRejectedValueOnce(error);

        let authData;
        renderWithAuth(
            <TestComponent
                onMount={(data) => {
                    authData = data;
                }}
            />
        );

        await act(async () => {
            await authData.signup(mockUserData);
        });

        await waitFor(() => {
            expect(authData.error).toBe(error.message);
            expect(authData.user).toBeNull();
            expect(localStorage.getItem('token')).toBeNull();
        });
    });
});
