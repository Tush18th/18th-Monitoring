'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'PROJECT_ADMIN' | 'OPERATOR' | 'VIEWER' | 'CUSTOMER';
    status: 'active' | 'suspended';
    tenantId: string;
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
    outageStatus: 'none' | 'stale' | 'expired';
    lastUpdated: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [currentProject, setCurrentProject] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [outageStatus, setOutageStatus] = useState<'none' | 'stale' | 'expired'>('none');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
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

    const logout = React.useCallback(() => {
        setToken(null);
        setUser(null);
        setCurrentProject(null);
        localStorage.clear();
        router.push('/login');
    }, [router]);

    const apiFetch = React.useCallback(async (url: string, options: any = {}) => {
        let fetchUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        
        // Auto-Scoping Dashboard Logic:
        // If url starts with /api/v1/dashboard and project context is available, 
        // rewrite to the new RESTful scoped structure.
        if (url.startsWith('/api/v1/dashboard') && user?.tenantId && currentProject) {
            const subPath = url.replace('/api/v1/dashboard', '');
            fetchUrl = `${API_BASE}/api/v1/tenants/${user.tenantId}/projects/${currentProject}${subPath}`;
        }

        const activeToken = token || localStorage.getItem('session-token');
        const cacheKey = `api_cache_${url.replace(/\W/g, '_')}`;

        const headers = {
            ...options.headers,
            'Authorization': activeToken ? `Bearer ${activeToken}` : '',
            'session-token': activeToken || ''
        };
        
        try {
            let requestData = options.body;
            if (requestData && typeof requestData === 'string') {
                try {
                    requestData = JSON.parse(requestData);
                } catch (e) {
                    // fall back to raw string if it's not JSON
                }
            }

            const res = await axios({
                url: fetchUrl,
                method: options.method || 'GET',
                headers,
                data: requestData,
                timeout: 10000 
            });

            // Cache Success
            if (options.method === 'GET' || !options.method) {
                const timestamp = new Date().toISOString();
                localStorage.setItem(cacheKey, JSON.stringify({ data: res.data, timestamp }));
                setOutageStatus('none');
                setLastUpdated(timestamp);
            }

            // Automatic response unwrapping for standardized contracts
            if (res.data && typeof res.data === 'object' && 'success' in res.data) {
                return res.data.data;
            }

            return res.data;
        } catch (error: any) {
             const status = error.response?.status;
             const backendError = error.response?.data?.error;
             const backendMessage = backendError?.message || error.response?.data?.message || error.response?.data?.error;
             const backendCode = backendError?.code || 'FETCH_ERROR';
             const correlationId = backendError?.correlationId;
             
             // Structured logging for development
             if (process.env.NODE_ENV !== 'production') {
                 console.group(`[API ERROR] ${options.method || 'GET'} ${url}`);
                 console.error(`Status: ${status || 'Network Error'}`);
                 console.error(`Code: ${backendCode}`);
                 console.error(`Message: ${backendMessage || error.message}`);
                 if (correlationId) console.error(`Correlation ID: ${correlationId}`);
                 if (backendError?.details) console.error(`Details:`, backendError.details);
                 console.groupEnd();
             }

             if (status === 401) {
                logout();
                throw new Error('Session Expired');
            }
            
            // Outage / Connectivity Error Handling
            if (!status || status >= 500 || error.code === 'ECONNABORTED') {
                const cached = localStorage.getItem(cacheKey);
                if (cached && (options.method === 'GET' || !options.method)) {
                    const { data, timestamp } = JSON.parse(cached);
                    console.warn(`[AuthContext] API 500/Outage. Serving STALE data from ${timestamp}`);
                    setOutageStatus('stale');
                    return data;
                }
            }

            if (status === 403) {
                router.push('/unauthorized');
                throw new Error('Access Denied');
            }

            // Create a structured error for the consumer
            const apiError = new Error(backendMessage || `Request failed with status ${status || 'Unknown'}`);
            (apiError as any).status = status;
            (apiError as any).isApiError = true;
            throw apiError;
        }
    }, [token, API_BASE, router, logout]);

    const setProject = React.useCallback((id: string) => {
        setCurrentProject(id);
        localStorage.setItem('current-project', id);
    }, []);

    const login = React.useCallback(async (email: string, password: string) => {
        try {
            const res = await axios.post(`${API_BASE}/api/v1/auth/login`, { email, password });
            const { token: newToken, user: newUser } = res.data.data;
            
            setToken(newToken);
            setUser(newUser);
            localStorage.setItem('session-token', newToken);
            localStorage.setItem('session-user', JSON.stringify(newUser));

            if (newUser.assignedProjects.length === 1 && newUser.role !== 'SUPER_ADMIN') {
                setProject(newUser.assignedProjects[0]);
                router.push(`/project/${newUser.assignedProjects[0]}/overview`);
            } else {
                router.push('/projects');
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Invalid credentials');
        }
    }, [API_BASE, router, setProject]);

    return (
        <AuthContext.Provider value={{ 
            user, token, currentProject, login, logout, setProject, isLoading, apiFetch,
            outageStatus, lastUpdated 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
