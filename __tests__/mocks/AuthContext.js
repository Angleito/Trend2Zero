import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const mockAuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
};

const mockAuthActions = {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    clearError: jest.fn()
};

export const AuthProvider = ({ children }) => {
    const [state, _setState] = useState(mockAuthState);

    const value = {
        ...state,
        ...mockAuthActions
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const resetAuthMocks = () => {
    Object.keys(mockAuthActions).forEach(key => {
        mockAuthActions[key].mockReset();
    });
};

// Minimal test to ensure mock works
import { render, screen } from '@testing-library/react';

describe('AuthContext Mock', () => {
 it('should have a valid mock implementation', () => {
   function TestComponent() {
     const { user, isAuthenticated, login, register, logout, error } = useAuth();
     return (
       <div>
         <span data-testid="user">{user}</span>
         <span data-testid="isAuthenticated">{isAuthenticated ? 'true' : 'false'}</span>
         <span data-testid="error">{error}</span>
         <span data-testid="login">{typeof login}</span>
         <span data-testid="register">{typeof register}</span>
         <span data-testid="logout">{typeof logout}</span>
       </div>
     );
   }
   render(
     <AuthProvider>
       <TestComponent />
     </AuthProvider>
   );
   expect(screen.getByTestId('user').textContent).toBe('');
   expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
   expect(screen.getByTestId('error').textContent).toBe('');
   expect(screen.getByTestId('login').textContent).toBe('function');
   expect(screen.getByTestId('register').textContent).toBe('function');
   expect(screen.getByTestId('logout').textContent).toBe('function');
 });
});

export { mockAuthState, mockAuthActions };
export default AuthContext;