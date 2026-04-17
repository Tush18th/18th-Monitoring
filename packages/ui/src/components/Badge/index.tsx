import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  size = 'md', 
  children, 
  ...props 
}) => {
  return (
    <span 
      className={cn('ui-badge', `variant-${variant}`, `size-${size}`, className)} 
      {...props}
    >
      {children}
    </span>
  );
};

export const StatusIndicator: React.FC<{ 
  status: 'success' | 'warning' | 'error' | 'info' | 'inactive';
  label?: string;
  className?: string;
}> = ({ status, label, className }) => {
  return (
    <div className={cn('ui-status-indicator', className)}>
      <span className={cn('status-dot', `status-${status}`)} />
      {label && <span className="status-label">{label}</span>}
    </div>
  );
};
