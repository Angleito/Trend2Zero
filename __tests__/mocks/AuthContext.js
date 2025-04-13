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
describe('AuthContext Mock', () => {
  it('should have a valid mock implementation', () => {
    const { user, isAuthenticated, login, register, logout, error } = useAuth();
    
    expect(user).toBe(null);
    expect(isAuthenticated).toBe(false);
    expect(error).toBe(null);
    expect(login).toBeInstanceOf(Function);
    expect(register).toBeInstanceOf(Function);
    expect(logout).toBeInstanceOf(Function);
  });
});

export { mockAuthState, mockAuthActions };
export default AuthContext;