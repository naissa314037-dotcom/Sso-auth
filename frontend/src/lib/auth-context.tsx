'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';
import { AuthUser, LoginResponse } from './types';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (login: string, password: string) => Promise<void>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/api/auth/me');
            setUser(res.data.user);
        } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (loginStr: string, password: string) => {
        const res = await api.post<LoginResponse>('/api/auth/login', {
            login: loginStr,
            password,
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.is_super_admin) return true;
        return user.permissions.includes(permission);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                hasPermission,
                isAuthenticated: !!user,
            }}
        >
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
