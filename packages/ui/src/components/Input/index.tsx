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
    const fallbackId = React.useId();
    const inputId = props.id ?? fallbackId;
    const descriptionId = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={cn('ui-input-wrapper', className, Icon && 'has-icon')}>
        {label && <label className="input-label" htmlFor={inputId}>{label}</label>}
        <div className="input-container">
          {Icon && <Icon className="input-icon" size={18} />}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn('ui-input', error && 'has-error')}
            aria-invalid={Boolean(error)}
            aria-describedby={descriptionId}
            {...props}
          />
        </div>
        {error && <span className="input-error" id={`${inputId}-error`}>{error}</span>}
        {!error && helperText && <span className="input-helper" id={`${inputId}-helper`}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
