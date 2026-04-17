'use client';
import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Icon emoji or React node to display before the title */
  icon?: string | React.ReactNode;
  className?: string;
}

/**
 * SectionHeader — consistent section divider used across all monitoring pages.
 * Renders a title row with optional subtitle and right-side action slot.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  className = '',
}) => {
  return (
    <div style={wrapperStyle} className={className}>
      <div style={leftStyle}>
        <div style={titleRowStyle}>
          {icon && <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>}
          <h3 style={titleStyle}>{title}</h3>
        </div>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {action && <div style={actionStyle}>{action}</div>}
    </div>
  );
};

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border-subtle)',
  gap: '16px',
};

const leftStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: 1,
  minWidth: 0,
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  margin: 0,
  marginTop: '2px',
};

const actionStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};
