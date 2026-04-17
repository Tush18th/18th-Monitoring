import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

/**
 * A layout container for form sections.
 */
export const FormSection = ({ title, description, icon, dangerouslyRed = false, children, style }: any) => {
    return (
        <fieldset style={{
            background: dangerouslyRed ? 'rgba(239, 68, 68, 0.02)' : 'white',
            border: dangerouslyRed ? '1px solid rgba(239, 68, 68, 0.1)' : '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: dangerouslyRed ? 'none' : 'var(--shadow-sm)',
            margin: '0 0 32px 0',
            position: 'relative',
            ...style
        }}>
            <legend style={{
                fontSize: '18px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0 8px',
                marginLeft: '-8px',
                color: dangerouslyRed ? 'var(--accent-red)' : 'var(--text-primary)'
            }}>
                {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
                {title}
            </legend>
            {description && (
                <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    marginBottom: '32px',
                    marginTop: '-12px',
                    lineHeight: '1.5'
                }}>
                    {description}
                </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {children}
            </div>
        </fieldset>
    );
};

export const FormGroup = ({ children, style }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...style }}>
        {children}
    </div>
);

export const FormLabel = ({ children, required }: any) => (
    <label style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>
        {children} {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}
    </label>
);

export const FormHelper = ({ children, error }: any) => {
    if (!children) return null;
    return (
        <div style={{
            fontSize: '12px',
            color: error ? 'var(--accent-red)' : 'var(--text-secondary)',
            marginBottom: '8px',
            lineHeight: '1.4',
            fontWeight: error ? '700' : '400'
        }}>
            {children}
        </div>
    );
};

export const FormInput = ({ error, style, rightElement, ...props }: any) => {
    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <input 
                {...props}
                style={{
                    padding: '12px 14px',
                    background: 'var(--bg-app)',
                    border: error ? '1px solid var(--accent-red)' : '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    width: '100%',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    boxShadow: error ? '0 0 0 1px rgba(239, 68, 68, 0.2)' : 'none',
                    transition: 'border-color 0.2s',
                    ...style
                }}
                onFocus={(e: any) => {
                    if (!error) e.target.style.borderColor = 'var(--accent-blue)';
                    if (props.onFocus) props.onFocus(e);
                }}
                onBlur={(e: any) => {
                    if (!error) e.target.style.borderColor = 'var(--border)';
                    if (props.onBlur) props.onBlur(e);
                }}
            />
            {rightElement && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    {rightElement}
                </div>
            )}
        </div>
    );
};

export const FormSelect = ({ error, style, children, ...props }: any) => (
    <select 
        {...props}
        style={{
            padding: '12px 14px',
            background: 'var(--bg-app)',
            border: error ? '1px solid var(--accent-red)' : '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            width: '100%',
            outline: 'none',
            color: 'var(--text-primary)',
            transition: 'border-color 0.2s',
            ...style
        }}
        onFocus={(e: any) => {
            if (!error) e.target.style.borderColor = 'var(--accent-blue)';
            if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e: any) => {
            if (!error) e.target.style.borderColor = 'var(--border)';
            if (props.onBlur) props.onBlur(e);
        }}
    >
        {children}
    </select>
);

export const FormCheckboxItem = ({ checked, onChange, title, description }: any) => (
    <div 
        onClick={() => onChange(!checked)}
        style={{
            padding: '16px',
            background: checked ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-app)',
            border: checked ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid var(--border)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
        }}
    >
        <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{title}</div>
            {description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{description}</div>}
        </div>
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={e => {
                // Prevent bubbling to the div
                e.stopPropagation();
                onChange(e.target.checked);
            }} 
            onClick={e => e.stopPropagation()}
            style={{ width: '20px', height: '20px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }} 
        />
    </div>
);

export const MaskedRevealInput = ({ value, label }: any) => {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '16px' }}>
            {label && <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', letterSpacing: visible ? 'normal' : '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {visible ? value : value.replace(/./g, '•')}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => setVisible(!visible)} 
                        title={visible ? 'Hide secret' : 'Reveal secret'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                        onClick={handleCopy}
                        title="Copy to clipboard"
                        style={{ 
                            background: copied ? 'var(--accent-green)' : 'var(--bg-surface)', 
                            border: '1px solid var(--border)', 
                            cursor: 'pointer', 
                            color: copied ? 'white' : 'var(--text-primary)', 
                            padding: '6px 12px', 
                            borderRadius: '8px',
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            fontSize: '11px',
                            fontWeight: '800',
                            transition: 'all 0.2s'
                        }}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};
