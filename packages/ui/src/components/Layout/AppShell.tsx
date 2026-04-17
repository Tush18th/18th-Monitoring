import React, { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sidebar, NavGroup } from './Sidebar';
import { TopBar } from './TopBar';
import { BreadcrumbItem } from './Breadcrumbs';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppShellProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  activeHref: string;
  breadcrumbs?: BreadcrumbItem[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
  logo?: React.ReactNode;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  navGroups, 
  activeHref, 
  breadcrumbs,
  user,
  onLogout,
  logo,
  className 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load persistence from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
    setMounted(true);
  }, []);

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  return (
    <div className={cn('ui-app-shell', isCollapsed && 'sidebar-collapsed', className)}>
      <Sidebar 
        groups={navGroups} 
        activeHref={activeHref}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        logo={logo}
      />
      
      <div className="shell-main">
        <TopBar 
          breadcrumbs={breadcrumbs} 
          user={user}
          onLogout={onLogout}
        />
        <main className="shell-content">
          {children}
        </main>
      </div>
    </div>
  );
};
