'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
    status: 'active' | 'suspended';
    assignedProjects: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    currentProject: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setProject: (id: string) => void;
    isLoading: boolean;
    apiFetch: (url: string, options?: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [currentProject, setCurrentProject] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    useEffect(() => {
        const storedToken = localStorage.getItem('session-token');
        const storedUser = localStorage.getItem('session-user');
        const storedProject = localStorage.getItem('current-project');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setCurrentProject(storedProject || null);
        }
        setIsLoading(false);
    }, []);

    const apiFetch = async (url: string, options: any = {}) => {
        const headers = {
            ...options.headers,
            'session-token': token || localStorage.getItem('session-token') || ''
        };
        
        const res = await fetch(url, { ...options, headers });
        
        if (res.status === 401) {
            logout();
            throw new Error('Unauthorized');
        }
        
        if (res.status === 403) {
            router.push('/unauthorized');
            throw new Error('Forbidden');
        }
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return res.json();
        }
        return res.text();
    };

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) throw new Error('Invalid credentials');

        const { token, user } = await res.json();
        
        setToken(token);
        setUser(user);
        localStorage.setItem('session-token', token);
        localStorage.setItem('session-user', JSON.stringify(user));

        if (user.assignedProjects.length === 1) {
            setProject(user.assignedProjects[0]);
            router.push('/');
        } else {
            router.push('/projects');
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setCurrentProject(null);
        localStorage.clear();
        router.push('/login');
    };

    const setProject = (id: string) => {
        setCurrentProject(id);
        localStorage.setItem('current-project', id);
    };

    return (
        <AuthContext.Provider value={{ user, token, currentProject, login, logout, setProject, isLoading, apiFetch }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
