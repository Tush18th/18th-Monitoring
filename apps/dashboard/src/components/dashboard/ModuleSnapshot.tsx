import React from 'react';
import { Card, Typography, Badge, BadgeVariant } from '@kpi-platform/ui';
import { ChevronRight } from 'lucide-react';

export interface SnapshotMetric {
  label: string;
  value: string | number;
  unit?: string;
  status?: BadgeVariant;
}

export interface ModuleSnapshotProps {
  title: string;
  icon: any;
  status: BadgeVariant;
  metrics: SnapshotMetric[];
  href: string;
  children?: React.ReactNode;
  className?: string;
}

export const ModuleSnapshot: React.FC<ModuleSnapshotProps> = ({
  title,
  icon: Icon,
  status,
  metrics,
  href,
  children,
  className = ''
}) => {
  return (
    <Card className={`p-0 overflow-hidden group hover:border-primary/20 transition-all border-subtle ${className}`.trim()}>
      <div className="p-4 border-b border-subtle flex justify-between items-center bg-muted/20">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface text-text-muted group-hover:text-primary transition-colors border border-subtle shadow-sm">
               <Icon size={18} />
            </div>
            <Typography variant="body" weight="bold" noMargin className="text-sm">
               {title}
            </Typography>
         </div>
         <Badge variant={status} size="sm" dot>
            {status.toUpperCase()}
         </Badge>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
         {metrics.map((m, i) => (
            <div key={i}>
               <Typography variant="caption" className="text-text-muted block mb-0.5">
                  {m.label}
               </Typography>
               <div className="flex items-baseline gap-1">
                  <Typography variant="body" weight="bold" className="text-base">
                     {m.value}
                  </Typography>
                  {m.unit && <Typography variant="micro" className="text-text-muted">{m.unit}</Typography>}
                  {m.status && <div className={`w-1.5 h-1.5 rounded-full ml-1 ${m.status === 'success' ? 'bg-success' : m.status === 'error' ? 'bg-error' : 'bg-warning'}`} />}
               </div>
            </div>
         ))}
      </div>

      {children && <div className="px-4 pb-4">{children}</div>}

      <a 
        href={href}
        className="block p-3 text-center border-t border-subtle hover:bg-muted/50 transition-colors"
      >
         <Typography variant="caption" weight="bold" className="text-primary flex items-center justify-center gap-1">
            View Details <ChevronRight size={14} />
         </Typography>
      </a>
    </Card>
  );
};
