import { createContext, useContext, useState, useCallback } from 'react';
import authService from '../lib/api/authService';
import { setAuthToken, getAuthToken } from '../lib/api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const signup = useCallback(async (userData) => {
        try {
            setError(null);
            setLoading(true);
            const response = await authService.signup(userData);
            if (response?.token) {
                setAuthToken(response.token);
                setUser(response.user);
            }
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (credentials) => {
        try {
            setError(null);
            setLoading(true);
            const response = await authService.login(credentials);
            if (response?.token) {
                setAuthToken(response.token);
                setUser(response.user);
            }
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setAuthToken(null);
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        error,
        signup,
        login,
        logout,
        isAuthenticated: !!getAuthToken()
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};