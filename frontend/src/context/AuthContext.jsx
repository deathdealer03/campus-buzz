/**
 * Authentication Context
 * Provides authentication state and methods across the app
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    // Fetch user profile
    async function fetchProfile() {
        try {
            const response = await authAPI.getProfile();
            setUser(response.data.user);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }

    // Login function
    async function login(email, password) {
        setError(null);
        try {
            const response = await authAPI.login({ email, password });
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }

    // Register function
    async function register(userData) {
        setError(null);
        try {
            const response = await authAPI.register(userData);
            localStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }

    // Logout function
    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    }

    // Check if user has specific role
    function hasRole(...roles) {
        return user && roles.some(r => user.role.toLowerCase() === r.toLowerCase());
    }

    // Check if user is admin or faculty (staff)
    function isStaff() {
        return hasRole('admin', 'faculty');
    }

    // Check if user is admin
    function isAdmin() {
        return hasRole('admin');
    }

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        hasRole,
        isStaff,
        isAdmin,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
