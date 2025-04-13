import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../lib/api/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            setError(null);
            const { user: userData, token } = await authService.login(credentials);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const signup = async (userData) => {
        try {
            setError(null);
            const newUser = await authService.signup(userData);
            const { token } = await authService.login({
                email: userData.email,
                password: userData.password
            });
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(newUser));
            setUser(newUser);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        error,
        loading,
        login,
        signup,
        logout,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}