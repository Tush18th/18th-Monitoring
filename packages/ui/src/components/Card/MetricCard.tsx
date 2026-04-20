import React from 'react';
import { Typography } from '../Typography';
import { Card } from './index';
import { Badge, BadgeVariant } from '../Badge';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    isUp: boolean;
    label?: string;
  };
  state?: BadgeVariant;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  state = 'default',
  icon: Icon,
  loading,
  className
}) => {
  return (
    <Card className={cn('ui-metric-card', className)}>
      <div className="metric-header">
        <Typography variant="caption" weight="semibold" className="metric-title">
          {title}
        </Typography>
        {Icon && (
          <div className={cn('metric-icon-wrapper', `variant-${state}`)}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="metric-body">
        {loading ? (
          <div className="skeleton h-8 w-24 mb-2" />
        ) : (
          <div className="metric-value-container">
            <Typography variant="h2" weight="bold" className="metric-value" noMargin>
              {value}
            </Typography>
            {unit && (
              <Typography variant="caption" weight="medium" className="metric-unit">
                {unit}
              </Typography>
            )}
          </div>
        )}

        {!loading && (trend || state !== 'default') && (
          <div className="metric-footer">
            {trend && (
              <div className={cn('metric-trend', trend.isUp ? 'is-up' : 'is-down')}>
                {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{trend.value}%</span>
                {trend.label && <span className="trend-label">{trend.label}</span>}
              </div>
            )}
            {!trend && state !== 'default' && (
              <Badge variant={state} size="sm" dot>
                {state.toUpperCase()}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
