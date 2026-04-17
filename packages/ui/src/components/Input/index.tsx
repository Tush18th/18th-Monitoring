import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { LucideIcon } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon: Icon, type = 'text', ...props }, ref) => {
    return (
      <div className={cn('ui-input-wrapper', className, Icon && 'has-icon')}>
        {label && <label className="input-label">{label}</label>}
        <div className="input-container">
          {Icon && <Icon className="input-icon" size={18} />}
          <input
            ref={ref}
            type={type}
            className={cn('ui-input', error && 'has-error')}
            {...props}
          />
        </div>
        {error && <span className="input-error">{error}</span>}
        {!error && helperText && <span className="input-helper">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
