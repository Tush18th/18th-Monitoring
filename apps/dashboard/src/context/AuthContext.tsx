'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

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
        const fetchUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        const headers = {
            ...options.headers,
            'session-token': token || localStorage.getItem('session-token') || ''
        };
        
        try {
            const res = await axios({
                url: fetchUrl,
                method: options.method || 'GET',
                headers,
                data: options.body ? JSON.parse(options.body) : undefined
            });
            return res.data;
        } catch (error: any) {
             if (error.response?.status === 401) {
                logout();
                throw new Error('Unauthorized');
            }
            if (error.response?.status === 403) {
                router.push('/unauthorized');
                throw new Error('Forbidden');
            }
            throw new Error(error.response?.data?.message || error.message);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const res = await axios.post(`${API_BASE}/api/v1/auth/login`, { email, password });
            const { token, user } = res.data;
            
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
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Invalid credentials');
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
