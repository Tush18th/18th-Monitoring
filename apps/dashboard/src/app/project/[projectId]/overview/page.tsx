'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Typography,
  Badge,
  BadgeVariant,
  OperationalTable,
  Column,
  TimeRangeSelector,
  TimeRangeValue
} from '@kpi-platform/ui';
import {
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Activity,
  Package,
  Users,
  Zap,
  ArrowRight,
  Clock,
  RefreshCw,
  Bell,
  Search,
  BarChart3,
  Info,
  ChevronRight,
  LayoutDashboard,
  BrainCircuit,
  Database
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { PerformanceChart } from '../../../../components/ui/PerformanceChart';
import { DashboardSectionErrorBoundary } from '../../../../components/dashboard/DashboardSectionErrorBoundary';

// --- Local Components for Control Tower Specifics ---

const SubsystemStatusCard = ({ module }: any) => {
  const Icon = module.icon;
  const statusColors = {
    healthy: 'bg-success',
    degraded: 'bg-warning',
    critical: 'bg-error',
    stale: 'bg-stale'
  };

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-bg-muted/30 border border-border-subtle hover:border-primary/30 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-text-muted group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{module.name}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${statusColors[module.status as keyof typeof statusColors]} shadow-sm`} />
      </div>
      <div className="mt-1">
        <Typography variant="body" weight="bold" className="text-sm font-black tracking-tight" noMargin>
          {module.label.split(': ')[1] || module.label}
        </Typography>
        <Typography variant="micro" color="muted" className="opacity-60">{module.label.split(': ')[0]}</Typography>
      </div>
    </div>
  );
};

const ExecutiveKpiCard = ({ title, value, unit, trend, status, insight }: any) => {
  return (
    <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle hover:border-primary/20 hover:shadow-lg transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <Typography variant="micro" color="muted" weight="bold" className="uppercase tracking-widest">{title}</Typography>
        <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${status === 'optimal' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
          {status}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <Typography variant="h2" weight="bold" noMargin className="text-3xl font-black tracking-tighter text-text-primary">
          {value}
        </Typography>
        {unit && <span className="text-sm font-bold text-text-muted">{unit}</span>}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-success">
        <TrendingUp size={12} />
        {trend}
      </div>
      <div className="mt-4 pt-4 border-t border-border-subtle/40">
        <Typography variant="micro" color="muted" className="italic leading-relaxed">{insight}</Typography>
      </div>
    </div>
  );
};

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { token, apiFetch, user, outageStatus, lastUpdated } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('24h');

  const isExpired = outageStatus === 'expired';

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);

    const fetchSection = async (path: string, setter: (data: any) => void, fallback: any) => {
      try {
        const result = await apiFetch(path);
        setter(result || fallback);
      } catch (err) {
        setter(fallback);
      }
    };

    try {
      await Promise.all([
        fetchSection(`/api/v1/dashboard/summaries?siteId=${projectId}&range=${timeRange}`, setMetrics, []),
        fetchSection(`/api/v1/dashboard/alerts?siteId=${projectId}`, (d) => setAlerts(Array.isArray(d) ? d : d?.alerts || []), []),
        fetchSection(`/api/v1/dashboard/performance/trends?siteId=${projectId}&range=${timeRange}`, setTrends, []),
        fetchSection(`/api/v1/dashboard/orders/summary?siteId=${projectId}&range=${timeRange}`, setStats, null)
      ]);
    } finally {
      setLoading(false);
    }
  }, [projectId, token, timeRange, apiFetch]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const activeAlerts = useMemo(() => alerts.filter(a => a.status === 'active'), [alerts]);

  const moduleHealths = useMemo(() => {
    const findMetric = (name: string) => metrics.find(m => m.kpiName === name);
    return [
      {
        name: 'Integrations',
        status: (findMetric('syncSuccessRate')?.state === 'critical' ? 'critical' : findMetric('syncSuccessRate')?.state === 'warning' ? 'degraded' : 'healthy'),
        icon: RefreshCw,
        href: `/project/${projectId}/integrations`,
        label: `Reliability: ${findMetric('syncSuccessRate')?.value || 0}%`
      },
      {
        name: 'Orders',
        status: (stats?.failedCount > 0 ? 'critical' : stats?.delayedCount > 0 ? 'degraded' : 'healthy'),
        icon: Package,
        href: `/project/${projectId}/orders`,
        label: `Velocity: ${stats?.ordersPerMinute || '0.00'} RPM`
      },
      {
        name: 'Performance',
        status: (findMetric('errorRatePct')?.state || 'healthy'),
        icon: Activity,
        href: `/project/${projectId}/performance`,
        label: `Client Latency: ${findMetric('pageLoadTime')?.value || 0}ms`
      },
      {
        name: 'Customers',
        status: 'healthy',
        icon: Users,
        href: `/project/${projectId}/customers`,
        label: `Live Sessions: ${findMetric('activeUsers')?.value || 0}`
      }
    ];
  }, [projectId, metrics, stats]);

  const overallHealth = useMemo(() => {
    const isCritical = moduleHealths.some(m => m.status === 'critical');
    const isDegraded = moduleHealths.some(m => m.status === 'degraded');
    if (isCritical) return { variant: 'error' as BadgeVariant, label: 'CRITICAL STATE' };
    if (isDegraded) return { variant: 'warning' as BadgeVariant, label: 'SYSTEM DEGRADED' };
    return { variant: 'success' as BadgeVariant, label: 'SYSTEM HEALTHY' };
  }, [moduleHealths]);

  const alertColumns: Column<any>[] = [
    {
      key: 'severity',
      header: 'Level',
      width: '100px',
      render: (val) => (
        <div className="flex items-center gap-2 px-2">
          <div className={`w-1.5 h-1.5 rounded-full ${val === 'high' || val === 'critical' ? 'bg-error animate-pulse' : 'bg-warning'}`} />
          <Badge variant={val === 'high' || val === 'critical' ? 'error' : 'warning'} size="sm" className="font-black text-[9px] px-2">{val?.toUpperCase()}</Badge>
        </div>
      )
    },
    {
      key: 'message',
      header: 'Intelligence Alert',
      render: (val, row) => (
        <div className="py-1">
          <Typography variant="body" weight="bold" className="text-sm text-text-primary" noMargin>{row.kpiName}</Typography>
          <Typography variant="micro" className="text-text-muted line-clamp-1">{val}</Typography>
        </div>
      )
    },
    {
      key: 'timestamp',
      header: 'Detected',
      width: '100px',
      align: 'right',
      render: (val) => <span className="text-text-muted font-mono text-[11px]">{new Date(val || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    },
    {
      key: 'actions',
      header: '',
      width: '40px',
      align: 'right',
      render: () => <ChevronRight size={14} className="text-text-muted" />
    }
  ];

  if (loading && metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-bg-muted flex items-center justify-center">
          <BrainCircuit size={32} className="text-text-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-bg-muted rounded mx-auto" />
          <div className="h-4 w-64 bg-bg-muted rounded opacity-50 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-20">
      {/* 4. Header Section Refinement */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2 pb-4 border-b border-border-subtle/30">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck size={20} />
            </div>
            <Typography variant="h1" noMargin className="text-2xl font-black tracking-tight text-text-primary uppercase">
              Control Tower
            </Typography>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-black text-success uppercase tracking-widest">Live</span>
            </div>
          </div>
          <Typography variant="body" color="muted" className="text-xs font-medium tracking-tight ml-10">
            Unified executive observability and operational oversight.
          </Typography>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-muted/40 border border-border-subtle text-[11px] font-black text-text-muted uppercase tracking-widest">
            <Database size={12} className="text-primary" />
            Env: {projectId.toUpperCase()}
          </div>
          <Badge variant={isExpired ? 'stale' : 'success'} size="sm" dot className="font-black px-4 py-1.5 rounded-full">
            {isExpired ? 'CACHE SNAPSHOT' : 'LIVE FEED ACTIVE'}
          </Badge>
          <div className="h-8 w-px bg-border-subtle mx-2" />
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <button onClick={loadData} className="p-2 hover:bg-bg-muted rounded-xl border border-border-subtle text-text-muted transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* 5. System Health Strip (Horizontal Health Bar System) */}
      <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
          {/* Primary Health Card - 40% */}
          <div className={`p-6 flex items-center gap-6 border-l-4 ${overallHealth.variant === 'error' ? 'border-error bg-error/5' : overallHealth.variant === 'warning' ? 'border-warning bg-warning/5' : 'border-success bg-success/5'}`}>
             <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm flex items-center justify-center">
                {overallHealth.variant === 'success' ? <ShieldCheck size={32} className="text-success" /> : <AlertTriangle size={32} className="text-warning" />}
             </div>
             <div>
                <Typography variant="h2" noMargin weight="bold" className="text-xl font-black text-text-primary tracking-tight">
                  {overallHealth.label}
                </Typography>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${overallHealth.variant === 'success' ? 'text-success' : 'text-error'}`}>
                     All Systems Nominal
                   </span>
                   <div className={`w-1.5 h-1.5 rounded-full ${overallHealth.variant === 'success' ? 'bg-success' : 'bg-error'} animate-pulse`} />
                </div>
             </div>
          </div>

          {/* Subsystems - 60% */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-subtle/30">
             {moduleHealths.map((m, i) => (
               <div key={i} className="bg-bg-surface p-4 flex flex-col justify-center gap-2 hover:bg-bg-muted/20 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2">
                     <m.icon size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{m.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-text-primary">{m.label.split(': ')[1]}</span>
                     <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'healthy' ? 'bg-success' : 'bg-warning'} shadow-[0_0_4px_currentColor]`} />
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 6 & 7. Anomalies + Executive KPI Surface (12-column grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Operational Anomalies - 8 Columns */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-error/10 text-error">
                <Bell size={18} />
              </div>
              <Typography variant="h3" noMargin weight="bold" className="uppercase tracking-tight">Operational Anomalies</Typography>
              {activeAlerts.length > 0 && <Badge variant="error" size="sm">{activeAlerts.length} Active</Badge>}
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-[10px] font-black px-4 bg-bg-surface">
              AI DIAGNOSTIC HISTORY
            </Button>
          </div>

          <Card padding="none" className="flex-1 overflow-hidden rounded-3xl border-border-subtle/60 shadow-xl shadow-black/5 flex flex-col min-h-[400px]">
             {activeAlerts.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-success/5 gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-bg-surface border border-success/30 flex items-center justify-center text-success shadow-lg shadow-success/10">
                     <ShieldCheck size={32} />
                  </div>
                  <div className="space-y-1">
                    <Typography variant="h3" noMargin weight="bold" className="text-success">Operational Integrity Confirmed</Typography>
                    <Typography variant="body" color="muted" className="text-sm">Secure health baseline maintained. No active anomalies detected.</Typography>
                  </div>
               </div>
             ) : (
               <div className="flex-1 overflow-auto">
                 <OperationalTable
                   columns={alertColumns}
                   data={activeAlerts}
                   isDense
                   getRowKey={(item) => item.alertId}
                 />
               </div>
             )}
             <div className="px-6 py-4 bg-bg-muted/20 border-t border-border-subtle/40 flex justify-between items-center">
                <span className="text-[11px] font-bold text-text-muted flex items-center gap-2">
                  <Clock size={14} /> Synchronized {lastUpdated}
                </span>
                <span className="text-[10px] font-black text-primary hover:underline cursor-pointer tracking-widest uppercase">System Audit Log →</span>
             </div>
          </Card>
        </div>

        {/* Executive KPI Surface - 4 Columns */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Zap size={18} />
            </div>
            <Typography variant="h3" noMargin weight="bold" className="uppercase tracking-tight">Executive KPI Surface</Typography>
          </div>
          
          <div className="flex flex-col gap-4 h-full">
            <ExecutiveKpiCard
              title="SLA Adherence"
              value="99.4"
              unit="%"
              trend="+0.2% vs prev window"
              status="optimal"
              insight="Synthetics confirm baseline availability above 99.9% across all endpoints."
            />
            <ExecutiveKpiCard
              title="Success Flow"
              value="1.2"
              unit="K"
              trend="Stable processing volume"
              status="optimal"
              insight="Transaction lifecycle remains within p95 performance thresholds."
            />
            <div className="p-6 rounded-3xl bg-primary text-white shadow-xl shadow-primary/20 flex flex-col justify-between flex-1 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Package size={80} />
               </div>
               <div className="relative z-10">
                  <Typography variant="micro" className="text-white/70 font-black uppercase tracking-widest mb-1">Project Value at Risk</Typography>
                  <div className="flex items-baseline gap-2">
                     <span className="text-2xl font-black text-white/60">$</span>
                     <Typography variant="h1" noMargin weight="bold" className="text-4xl font-black tracking-tighter text-white">
                       {((stats?.delayedCount || 0) * 850).toLocaleString()}
                     </Typography>
                  </div>
               </div>
               <Button variant="outline" className="mt-8 bg-white/10 border-white/20 hover:bg-white/20 text-white font-black rounded-2xl w-full flex justify-between group/btn" onClick={() => router.push(`/project/${projectId}/orders`)}>
                  Resolve Exceptions
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
               </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Subsystem Cards Row */}
      <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle shadow-sm">
              <LayoutDashboard size={18} className="text-primary" />
           </div>
           <Typography variant="h3" noMargin weight="bold" className="uppercase tracking-tight">Subsystem Snapshots</Typography>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {moduleHealths.map((m, i) => (
            <div key={i} className="group flex flex-col bg-bg-surface border border-border-subtle rounded-2xl p-5 hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden" onClick={() => router.push(m.href)}>
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full -mr-12 -mt-12" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-xl ${m.status === 'healthy' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'} group-hover:scale-110 transition-transform shadow-sm`}>
                          <m.icon size={20} />
                       </div>
                       <div>
                          <Typography variant="body" weight="bold" className="text-sm uppercase tracking-wider leading-none" noMargin>{m.name}</Typography>
                          <Typography variant="micro" color="muted">Domain Snapshot</Typography>
                       </div>
                    </div>
                    <Badge variant={m.status === 'healthy' ? 'success' : 'warning'} size="sm" className="font-black text-[9px]">{m.status.toUpperCase()}</Badge>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">Real-time Metric</span>
                        <Typography variant="h3" noMargin weight="bold" className="text-2xl tracking-tighter text-text-primary">
                          {m.label.split(': ')[1]}
                        </Typography>
                     </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border-subtle/30 flex items-center justify-between">
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Deep Dive <ChevronRight size={12} />
                     </span>
                     <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowRight size={14} />
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Bottom Analytics Section (Charts + Activity) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        {/* Latency Chart - 60% (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <Activity size={18} />
              </div>
              <Typography variant="h3" noMargin weight="bold" className="uppercase tracking-tight">Latency Confidence Profile</Typography>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-info animate-pulse" />
               <span className="text-[10px] font-black text-info uppercase tracking-widest">Live Profile</span>
            </div>
          </div>
          <Card padding="none" className="overflow-hidden rounded-3xl border-border-subtle/60 shadow-xl shadow-black/5 bg-bg-surface h-[400px] flex flex-col">
             <div className="p-8 flex-1 flex flex-col justify-center">
                <PerformanceChart data={trends} title="" />
             </div>
             <div className="px-8 py-4 bg-bg-muted/10 border-t border-border-subtle/40 flex justify-center gap-8">
                {['FCP', 'LCP', 'Page Load', 'TTFB'].map((label, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-success' : idx === 1 ? 'bg-warning' : idx === 2 ? 'bg-primary' : 'bg-error'}`} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</span>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Recent Activity - 40% (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle shadow-sm">
                <Clock size={18} className="text-text-muted" />
              </div>
              <Typography variant="h3" noMargin weight="bold" className="uppercase tracking-tight">Recent System Activity</Typography>
            </div>
            <span className="text-[10px] font-black text-primary hover:underline cursor-pointer tracking-widest uppercase">Full Audit Trail</span>
          </div>
          <Card padding="none" className="overflow-hidden rounded-3xl border-border-subtle/60 shadow-xl shadow-black/5 bg-bg-surface h-[400px] flex flex-col">
             <div className="flex-1 overflow-auto divide-y divide-border-subtle/30">
                {activeAlerts.length > 0 ? activeAlerts.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="p-4 px-6 flex gap-4 hover:bg-bg-muted/20 transition-all group relative cursor-pointer">
                    <div className="mt-1.5">
                       <div className={`w-2.5 h-2.5 rounded-full ${item.severity === 'high' || item.severity === 'critical' ? 'bg-error shadow-[0_0_8px_var(--error)]' : 'bg-warning shadow-[0_0_8px_var(--warning)]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start">
                          <Typography variant="body" weight="bold" className="text-xs group-hover:text-primary transition-colors line-clamp-1">{item.message}</Typography>
                          <span className="text-[10px] font-mono text-text-muted whitespace-nowrap ml-4">{new Date(item.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                       <Typography variant="micro" color="muted" className="uppercase tracking-widest opacity-60 mt-0.5">{item.kpiName}</Typography>
                    </div>
                  </div>
                )) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4 h-full opacity-60">
                     <div className="p-4 rounded-2xl border-2 border-dashed border-border-subtle">
                        <Clock size={32} className="text-text-muted" />
                     </div>
                     <Typography variant="body" weight="bold" className="uppercase tracking-widest text-text-muted text-xs">No recent events detected</Typography>
                  </div>
                )}
             </div>
             <div className="p-4 bg-bg-muted/5 border-t border-border-subtle/40 text-center">
                <button className="text-[11px] font-black text-primary hover:scale-105 transition-transform uppercase tracking-widest">
                  Load More Activity
                </button>
             </div>
          </Card>
        </div>
      </section>

      <style jsx global>{`
        .animate-slide-up {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
