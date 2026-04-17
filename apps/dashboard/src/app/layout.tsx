'use client';
import React, { useEffect } from 'react';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Script from 'next/script';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { OutageNotificationShell } from '../components/layout/OutageNotificationShell';
import { ThemeProvider } from '@kpi-platform/ui';
import { DashboardShell } from '../components/layout/DashboardShell';
import './globals.css';

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === '/' || pathname === '/login' || pathname === '/unauthorized';

  if (isPublic) return <>{children}</>;
  return <DashboardShell>{children}</DashboardShell>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, currentProject, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Guests can only visit / (Landing) or /login
        if (pathname !== '/' && pathname !== '/login') {
          router.push('/login');
        }
      } else {
        const assignedProjects = user.assignedProjects || [];
        
        // 1. Root Landing Logic for Logged-in Users
        if (pathname === '/') {
          if (user.role === 'CUSTOMER' && assignedProjects.length === 1) {
            router.push(`/project/${assignedProjects[0]}/overview`);
          } else {
            router.push('/projects');
          }
        }
        
        // 2. Viewer (CUSTOMER) - Direct redirect to single project if landing on portfolio
        if (pathname === '/projects' && user.role === 'CUSTOMER' && assignedProjects.length === 1) {
          router.push(`/project/${assignedProjects[0]}/overview`);
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) return <div style={{ background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Initializing...</div>;

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
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
        <Script src="/agent.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
