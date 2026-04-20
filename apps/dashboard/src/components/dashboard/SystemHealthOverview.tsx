import React from 'react';
import { Typography, Badge, BadgeVariant, Card } from '@kpi-platform/ui';
import { Activity, Package, Clock, Zap, Users, ShieldCheck, AlertCircle } from 'lucide-react';

export interface ModuleHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'stale';
  count?: number;
  label?: string;
  icon: any;
  href: string;
}

export interface SystemHealthOverviewProps {
  modules: ModuleHealth[];
  overallStatus: BadgeVariant;
  overallLabel: string;
  loading?: boolean;
}

export const SystemHealthOverview: React.FC<SystemHealthOverviewProps> = ({
  modules,
  overallStatus,
  overallLabel,
  loading
}) => {
  const getStatusVariant = (s: string): BadgeVariant => {
    switch (s) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'critical': return 'error';
      case 'stale': return 'stale';
      default: return 'default';
    }
  };

  return (
    <Card className="p-0 overflow-hidden border-subtle">
       <div className="flex flex-col md:flex-row w-full">
          {/* Left: Overall Health Summary */}
          <div className={`p-6 md:w-1/3 flex flex-col justify-center items-center text-center gap-2 border-r border-subtle ${overallStatus === 'success' ? 'bg-success-bg/20' : overallStatus === 'error' ? 'bg-error-bg/20' : 'bg-warning-bg/20'}`}>
             <div className={`w-16 h-16 rounded-full flex items-center justify-center ${overallStatus === 'success' ? 'text-success bg-white/50' : overallStatus === 'error' ? 'text-error bg-white/50' : 'text-warning bg-white/50'}`}>
                {overallStatus === 'success' ? <ShieldCheck size={40} strokeWidth={2.5}/> : <AlertCircle size={40} strokeWidth={2.5}/>}
             </div>
             <div>
                <Typography variant="h2" weight="bold" noMargin className="text-xl">
                   {overallLabel}
                </Typography>
                <Typography variant="caption" className="text-text-muted">
                   System-wide Health Aggregate
                </Typography>
             </div>
             <Badge variant={overallStatus} size="sm" dot>
                {overallStatus === 'success' ? 'ALL SYSTEMS NOMINAL' : 'ATTENTION REQUIRED'}
             </Badge>
          </div>

          {/* Right: Module Breakdown */}
          <div className="md:w-2/3 grid grid-cols-2 lg:grid-cols-4 divide-x divide-y md:divide-y-0 border-t md:border-t-0 border-subtle">
             {modules.map((module, idx) => {
                const Icon = module.icon;
                return (
                   <a 
                     key={idx} 
                     href={module.href}
                     className="p-5 flex flex-col gap-3 hover:bg-muted/30 transition-colors group"
                   >
                      <div className="flex justify-between items-start">
                         <div className={`p-2 rounded-xl bg-muted text-text-muted group-hover:bg-primary/5 group-hover:text-primary transition-colors`}>
                            <Icon size={20} />
                         </div>
                         <Badge variant={getStatusVariant(module.status)} size="sm" dot hideLabel suppressDot />
                      </div>
                      <div>
                         <Typography variant="caption" weight="bold" className="text-text-muted block mb-1">
                            {module.name}
                         </Typography>
                         <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${module.status === 'healthy' ? 'bg-success' : module.status === 'degraded' ? 'bg-warning' : 'bg-error'}`} />
                            <Typography variant="body" weight="bold" className="text-sm">
                               {module.status.toUpperCase()}
                            </Typography>
                         </div>
                      </div>
                      {module.label && (
                        <Typography variant="micro" className="text-text-muted mt-auto">
                           {module.label}
                        </Typography>
                      )}
                   </a>
                );
             })}
          </div>
       </div>
    </Card>
  );
};
