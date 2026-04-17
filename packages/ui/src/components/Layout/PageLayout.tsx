import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Typography } from '../Typography';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
  title, 
  subtitle, 
  actions, 
  children, 
  className 
}) => {
  return (
    <div className={cn('ui-page-layout', className)}>
      <header className="page-header">
        <div className="header-content">
          <Typography variant="h1" noMargin className="page-title">{title}</Typography>
          {subtitle && (
            <Typography variant="body" noMargin className="page-subtitle">
              {subtitle}
            </Typography>
          )}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
      
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};
