'use client';

import React, { useEffect } from 'react';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { OutageNotificationShell } from '../layout/OutageNotificationShell';
import { ThemeProvider } from '@kpi-platform/ui';
import { DashboardShell } from '../layout/DashboardShell';

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === '/' || pathname === '/login' || pathname === '/unauthorized';

  if (isPublic) return <>{children}</>;
  return <DashboardShell>{children}</DashboardShell>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        if (pathname !== '/' && pathname !== '/login') {
          router.push('/login');
        }
      } else {
        const assignedProjects = user.assignedProjects || [];
        if (pathname === '/') {
          if (user.role === 'CUSTOMER' && assignedProjects.length === 1) {
            router.push(`/project/${assignedProjects[0]}/overview`);
          } else {
            router.push('/projects');
          }
        }
        if (pathname === '/projects' && user.role === 'CUSTOMER' && assignedProjects.length === 1) {
          router.push(`/project/${assignedProjects[0]}/overview`);
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="app-loading-shell" role="status" aria-label="Loading application">
        <div className="app-loading-spinner" />
        <span className="app-loading-text">Initializing workspace…</span>
      </div>
    );
  }

  return <>{children}</>;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <OutageNotificationShell />
          <AuthGuard>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthGuard>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
