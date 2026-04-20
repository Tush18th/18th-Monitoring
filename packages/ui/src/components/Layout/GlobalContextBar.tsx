import React from 'react';
import { 
  ChevronDown, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Database,
  Globe
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FreshnessStatus = 'healthy' | 'stale' | 'warning' | 'syncing';

export interface GlobalContextBarProps {
  projects?: Array<{ id: string; name: string }>;
  selectedProject?: string;
  onProjectChange?: (id: string) => void;
  
  environments?: string[];
  selectedEnvironment?: string;
  onEnvironmentChange?: (env: string) => void;
  
  dateRange?: string;
  onDateRangeClick?: () => void;
  
  lastUpdated?: string;
  onRefresh?: () => void;
  
  freshnessStatus?: FreshnessStatus;
  className?: string;
}

export const GlobalContextBar: React.FC<GlobalContextBarProps> = ({
  projects = [],
  selectedProject,
  onProjectChange,
  environments = ['Production', 'Staging', 'Development'],
  selectedEnvironment = 'Production',
  onEnvironmentChange,
  dateRange = 'Last 24 Hours',
  onDateRangeClick,
  lastUpdated = 'Just now',
  onRefresh,
  freshnessStatus = 'healthy',
  className
}) => {
  const getFreshnessIcon = () => {
    switch (freshnessStatus) {
      case 'healthy': return <CheckCircle2 size={14} className="text-success" />;
      case 'stale': return <Clock size={14} className="text-stale" />;
      case 'warning': return <AlertCircle size={14} className="text-warning" />;
      case 'syncing': return <RefreshCw size={14} className="text-processing animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className={cn('ui-global-context-bar', className)}>
      <div className="context-left">
        {/* Project Selector */}
        <div className="context-item project-selector">
          <Database size={14} className="item-icon" />
          <span className="item-label">Project:</span>
          <label className="context-select-shell">
            <span className="sr-only">Select project</span>
            <select
              className="context-select"
              value={selectedProject}
              onChange={(event) => onProjectChange?.(event.target.value)}
              disabled={!projects.length}
            >
              {!projects.length ? <option value="">No projects</option> : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="chevron" />
          </label>
        </div>

        <div className="context-divider" />

        {/* Environment Selector */}
        <div className="context-item environment-selector">
          <Globe size={14} className="item-icon" />
          <span className="item-label">Env:</span>
          <label className="context-select-shell">
            <span className="sr-only">Select environment</span>
            <select
              className="context-select"
              value={selectedEnvironment}
              onChange={(event) => onEnvironmentChange?.(event.target.value)}
            >
              {environments.map((environment) => (
                <option key={environment} value={environment}>
                  {environment}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="chevron" />
          </label>
        </div>
      </div>

      <div className="context-right">
        {/* Date Range Selector */}
        <button className="context-item date-selector" onClick={onDateRangeClick} type="button">
          <Calendar size={14} className="item-icon" />
          <span className="current-value">{dateRange}</span>
          <ChevronDown size={14} className="chevron" />
        </button>

        <div className="context-divider" />

        {/* Freshness & Refresh */}
        <div className="context-item freshness-info">
          {getFreshnessIcon()}
          <span className="last-updated">Updated: {lastUpdated}</span>
          <button className="refresh-button" onClick={onRefresh} title="Refresh Data" type="button">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
