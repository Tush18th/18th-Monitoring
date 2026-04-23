'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  AlertTriangle,
  Activity,
  Bell,
  BrainCircuit,
  Clock,
  Database,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Package,
  Users,
  Layers3,
  ChevronRight,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  OperationalTable,
  TimeRangeSelector,
  TimeRangeValue,
  Typography,
  Column,
} from '@kpi-platform/ui';
import { useAuth } from '../../../../context/AuthContext';
import { PerformanceChart } from '../../../../components/ui/PerformanceChart';

type Metric = {
  kpiName: string;
  value?: number;
  state?: 'healthy' | 'warning' | 'critical' | 'stale';
  trend?: string;
  insight?: string;
};

type AlertItem = {
  alertId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  kpiName?: string;
  timestamp?: string;
  source?: string;
};

type StatSummary = {
  failedCount?: number;
  delayedCount?: number;
  ordersPerMinute?: string | number;
  revenueAtRisk?: number;
};

const moduleToneClasses = {
  healthy: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  critical: 'border-error/20 bg-error/10 text-error',
  stale: 'border-stale/20 bg-stale/10 text-stale',
} as const;

const severityColors = {
  low: 'bg-success',
  medium: 'bg-warning',
  high: 'bg-error',
  critical: 'bg-error',
} as const;

function formatTime(value?: string) {
  if (!value) return 'Now';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Now';
  }
}

function formatCount(value?: number | string) {
  const numberValue = Number(value || 0);
  return new Intl.NumberFormat('en-US').format(Number.isFinite(numberValue) ? numberValue : 0);
}

function trendSeries(range: TimeRangeValue) {
  const scale = range === '7d' ? 1.08 : range === '30d' ? 1.18 : 1;

  return Array.from({ length: 12 }).map((_, index) => ({
    timestamp: `${String(index * 2).padStart(2, '0')}:00`,
    pageLoadTime: 180 + index * 9 * scale + Math.sin(index / 2) * 14,
    ttfb: 65 + index * 3 * scale + Math.cos(index / 2) * 5,
    fcp: 120 + index * 5 * scale + Math.sin(index / 3) * 7,
    lcp: 310 + index * 12 * scale + Math.cos(index / 4) * 12,
  }));
}

function deriveHealth(metrics: Metric[], stats: StatSummary | null) {
  const map = new Map(metrics.map((metric) => [metric.kpiName, metric]));
  const sync = map.get('syncSuccessRate');
  const errorRate = map.get('errorRatePct');

  const scoreFromMetric =
    sync?.value !== undefined
      ? Number(sync.value)
      : errorRate?.value !== undefined
        ? Math.max(0, 100 - Number(errorRate.value))
        : 100;

  const failedCount = stats?.failedCount || 0;
  const delayedCount = stats?.delayedCount || 0;

  const score = Math.max(0, Math.min(100, scoreFromMetric - failedCount * 2 - delayedCount * 1.5));

  if (score < 90) {
    return { label: 'System degraded', tone: 'critical' as const, score };
  }
  if (score < 97) {
    return { label: 'System under watch', tone: 'warning' as const, score };
  }
  return { label: 'All systems nominal', tone: 'healthy' as const, score };
}

function KPIBlock({
  title,
  value,
  subtitle,
  ctaLabel,
  ctaHref,
  ctaTone = 'default',
  onCtaClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaTone?: 'default' | 'critical' | 'success';
  onCtaClick?: () => void;
}) {
  const toneClasses = {
    default: 'text-primary border-primary/15 bg-primary/8',
    critical: 'text-error border-error/15 bg-error/8',
    success: 'text-success border-success/15 bg-success/8',
  } as const;

  return (
    <div className="group flex h-full min-h-[160px] flex-col justify-between rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5">
      <div className="space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">{title}</div>
        <div className="text-3xl font-black tracking-tight text-text-primary">{value}</div>
        <div className="text-sm leading-6 text-text-muted">{subtitle}</div>
      </div>

      {ctaLabel && (
        <div className="pt-4">
          <button
            type="button"
            onClick={onCtaClick}
            className={`ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-150 active:scale-[0.98] ${toneClasses[ctaTone]}`}
          >
            {ctaLabel}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function SubsystemCard({
  name,
  status,
  metric,
  subMetric,
  icon: Icon,
  onClick,
}: {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'stale';
  metric: string;
  subMetric: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-[210px] flex-col justify-between rounded-2xl border border-border-subtle bg-bg-surface p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99]"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl border p-2.5 transition-colors ${moduleToneClasses[status]} group-hover:shadow-sm`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-text-primary">{name}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">Domain snapshot</div>
            </div>
          </div>
          <Badge
            variant={status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : status === 'critical' ? 'error' : 'stale'}
            size="sm"
            dot
            className="font-black"
          >
            {status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Primary Metric</div>
          <div className="text-2xl font-black tracking-tight text-text-primary">{metric}</div>
        </div>

        <div className="space-y-1 border-t border-border-subtle/70 pt-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Secondary Metric</div>
          <div className="text-sm font-medium text-text-secondary">{subMetric}</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border-subtle/60 pt-4">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">Domain deep dive</span>
        <ChevronRight size={16} className="text-text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </button>
  );
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { token, apiFetch, user, outageStatus, lastUpdated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState<StatSummary | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('24h');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isExpired = outageStatus === 'expired';
  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.severity && alert.severity !== 'low'), [alerts]);
  const health = useMemo(() => deriveHealth(metrics, stats), [metrics, stats]);

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;

    setLoading(true);
    const fetchSection = async (path: string, fallback: any) => {
      try {
        return await apiFetch(path);
      } catch {
        return fallback;
      }
    };

    try {
      const [summaryData, alertData, trendData, statsData] = await Promise.all([
        fetchSection(`/api/v1/dashboard/summaries?siteId=${projectId}&range=${timeRange}`, []),
        fetchSection(`/api/v1/dashboard/alerts?siteId=${projectId}`, []),
        fetchSection(`/api/v1/dashboard/performance/trends?siteId=${projectId}&range=${timeRange}`, []),
        fetchSection(`/api/v1/dashboard/orders/summary?siteId=${projectId}&range=${timeRange}`, null),
      ]);

      setMetrics(Array.isArray(summaryData) ? summaryData : []);
      setAlerts(Array.isArray(alertData) ? alertData : alertData?.alerts || []);
      setTrends(Array.isArray(trendData) ? trendData : []);
      setStats(statsData || null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, projectId, timeRange, token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const alertColumns: Column<any>[] = [
    {
      key: 'severity',
      header: 'Level',
      width: '100px',
      render: (val) => (
        <div className="flex items-center gap-2 px-2">
          <div className={`h-2 w-2 rounded-full ${val === 'high' || val === 'critical' ? 'bg-error' : 'bg-warning'} animate-pulse`} />
          <Badge variant={val === 'high' || val === 'critical' ? 'error' : 'warning'} size="sm" className="font-black">
            {String(val || '').toUpperCase()}
          </Badge>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Signal',
      render: (val, row) => (
        <div className="py-1">
          <Typography variant="body" weight="bold" className="text-sm text-text-primary" noMargin>
            {row.kpiName}
          </Typography>
          <Typography variant="micro" className="text-text-muted">
            {val}
          </Typography>
        </div>
      ),
    },
    {
      key: 'timestamp',
      header: 'Detected',
      width: '110px',
      align: 'right',
      render: (val) => (
        <span className="font-mono text-[11px] text-text-muted">
          {formatTime(val)}
        </span>
      ),
    },
  ];

  if (loading && metrics.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center animate-pulse">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-muted">
          <BrainCircuit size={32} className="text-text-muted" />
        </div>
        <div className="space-y-2">
          <div className="mx-auto h-6 w-56 rounded-full bg-bg-muted" />
          <div className="mx-auto h-4 w-72 rounded-full bg-bg-muted/70" />
        </div>
      </div>
    );
  }

  const subsystemCards = [
    {
      name: 'Integrations',
      status: metrics.find((metric) => metric.kpiName === 'syncSuccessRate')?.state || 'healthy',
      metric: `${metrics.find((metric) => metric.kpiName === 'syncSuccessRate')?.value || 0}%`,
      subMetric: `Reliability • ${metrics.find((metric) => metric.kpiName === 'syncSuccessRate')?.trend || 'Stable'}`,
      icon: RefreshCw,
      href: `/project/${projectId}/integrations`,
    },
    {
      name: 'Orders',
      status: stats?.failedCount ? 'critical' : stats?.delayedCount ? 'warning' : 'healthy',
      metric: `${stats?.ordersPerMinute || '0.00'} RPM`,
      subMetric: `Delayed ${stats?.delayedCount || 0} • Failed ${stats?.failedCount || 0}`,
      icon: Package,
      href: `/project/${projectId}/orders`,
    },
    {
      name: 'Performance',
      status: metrics.find((metric) => metric.kpiName === 'errorRatePct')?.state || 'healthy',
      metric: `${metrics.find((metric) => metric.kpiName === 'pageLoadTime')?.value || 0}ms`,
      subMetric: `Error rate • ${metrics.find((metric) => metric.kpiName === 'errorRatePct')?.value || 0}%`,
      icon: Activity,
      href: `/project/${projectId}/performance`,
    },
    {
      name: 'Customers',
      status: 'healthy',
      metric: `${metrics.find((metric) => metric.kpiName === 'activeUsers')?.value || 0}`,
      subMetric: `Live sessions • Engaged users`,
      icon: Users,
      href: `/project/${projectId}/customers`,
    },
  ] as const;

  const routeActivity = () => {
    setLoadingAction('activity');
    router.push(`/project/${projectId}/management/audit`);
  };

  const resolveModule = (href: string, id: string) => {
    setLoadingAction(id);
    router.push(href);
  };

  const resolveKpi = (kpiKey: string) => {
    setLoadingAction(kpiKey);
    router.push(`/project/${projectId}/kpi/${kpiKey}`);
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 pb-20 pt-4 sm:px-6 lg:px-8">
      <header className="grid grid-cols-1 gap-4 border-b border-border-subtle/50 pb-4 xl:grid-cols-[1.4fr_auto] xl:items-end">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-2.5 text-primary shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-semibold tracking-tight text-text-primary sm:text-[30px]">Control Tower</h1>
              <span className="inline-flex h-2 w-2 rounded-full bg-success shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-success">
              Live
            </span>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-text-muted">
            Unified executive observability and operational oversight for {user?.name || 'the current operator'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-text-muted shadow-sm">
            <Database size={12} className="text-primary" />
            Env {projectId.toUpperCase()}
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] shadow-sm ${isExpired ? 'border-stale/20 bg-stale/10 text-stale' : 'border-success/20 bg-success/10 text-success'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isExpired ? 'bg-stale' : 'bg-success'} animate-pulse`} />
            {isExpired ? 'Cached feed' : 'Live feed active'}
          </div>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <button
            type="button"
            onClick={loadData}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-muted transition-all duration-150 hover:border-primary/25 hover:text-primary hover:shadow-md active:scale-[0.98]"
            aria-label="Refresh control tower"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1.85fr]">
        <Card className={`h-full rounded-3xl border-border-subtle/60 p-6 shadow-sm ${moduleToneClasses[health.tone]}`}>
          <div className="flex h-full items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border-subtle bg-bg-surface shadow-sm">
              {health.tone === 'healthy' ? <ShieldCheck size={30} className="text-success" /> : <AlertTriangle size={30} className="text-warning" />}
            </div>
            <div className="min-w-0 space-y-2">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">Primary Health</div>
              <div className="text-2xl font-semibold tracking-tight text-text-primary">{health.label}</div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                <span className="font-mono font-semibold text-text-primary">{health.score.toFixed(1)}%</span>
                <span>All systems nominal baseline at a glance.</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Integrations', metric: `${metrics.find((m) => m.kpiName === 'syncSuccessRate')?.value || 0}%`, status: metrics.find((m) => m.kpiName === 'syncSuccessRate')?.state || 'healthy' },
            { label: 'Orders', metric: `${stats?.ordersPerMinute || '0.00'} RPM`, status: stats?.failedCount ? 'critical' : stats?.delayedCount ? 'warning' : 'healthy' },
            { label: 'Performance', metric: `${metrics.find((m) => m.kpiName === 'pageLoadTime')?.value || 0}ms`, status: metrics.find((m) => m.kpiName === 'errorRatePct')?.state || 'healthy' },
            { label: 'Customers', metric: `${metrics.find((m) => m.kpiName === 'activeUsers')?.value || 0}`, status: 'healthy' as const },
          ].map((item) => (
            <Card key={item.label} className="rounded-3xl border-border-subtle/60 p-5 shadow-sm">
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{item.label}</div>
                  <div className="text-2xl font-black tracking-tight text-text-primary">{item.metric}</div>
                </div>
                <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${moduleToneClasses[item.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'healthy' ? 'bg-success' : item.status === 'warning' ? 'bg-warning' : 'bg-error'} animate-pulse`} />
                  {item.status}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-border-subtle bg-bg-surface p-2 text-primary shadow-sm">
                <Bell size={18} />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-text-primary">Operational Anomalies</div>
                <div className="text-sm text-text-muted">Exceptions and alerts with direct diagnostic context.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={activeAlerts.length > 0 ? 'warning' : 'success'} size="sm" className="font-black">
                {activeAlerts.length > 0 ? `${activeAlerts.length} active` : 'clear'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-border-subtle bg-bg-surface px-4 text-[11px] font-black uppercase tracking-[0.16em]"
                onClick={routeActivity}
              >
                AI Diagnostic History
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-3xl border-border-subtle/60 shadow-sm">
            {activeAlerts.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 bg-success/5 px-8 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-success/20 bg-bg-surface text-success shadow-sm">
                  <ShieldCheck size={30} />
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-semibold tracking-tight text-success">Operational integrity confirmed</div>
                  <div className="text-sm leading-6 text-text-muted">
                    No active anomalies detected. The control surface is stable and all monitored signals remain within expected thresholds.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-5">
                {activeAlerts.slice(0, 6).map((alert, index) => (
                  <button
                    key={alert.alertId || index}
                    type="button"
                    onClick={routeActivity}
                    className="group flex w-full items-start gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
                  >
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${severityColors[alert.severity || 'medium']}`} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="truncate text-sm font-semibold text-text-primary">{alert.kpiName}</div>
                        <span className="font-mono text-[11px] text-text-muted">{formatTime(alert.timestamp)}</span>
                      </div>
                      <div className="text-sm leading-6 text-text-secondary">{alert.message}</div>
                    </div>
                    <ChevronRight size={16} className="mt-1 text-text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border-subtle/60 bg-bg-muted/15 px-5 py-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-muted">
                <Clock size={14} />
                Synchronized {lastUpdated || 'just now'}
              </div>
              <button
                type="button"
                onClick={routeActivity}
                className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-primary transition-all duration-150 hover:shadow-md active:scale-[0.98]"
              >
                System audit log
                <ArrowRight size={14} />
              </button>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="rounded-xl border border-border-subtle bg-bg-surface p-2 text-primary shadow-sm">
              <Gauge size={18} />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-text-primary">Executive KPI Surface</div>
              <div className="text-sm text-text-muted">Independent cards with direct executive actions.</div>
            </div>
          </div>

          <div className="space-y-4">
            <KPIBlock
              title="SLA Adherence"
              value="99.4%"
              subtitle="Synthetics and baseline checks remain above target across monitored endpoints."
            />
            <KPIBlock
              title="Success Flow"
              value={`${formatCount(stats?.ordersPerMinute || 0)} RPM`}
              subtitle="Transaction flow is stable and processing volume remains predictable."
            />
            <KPIBlock
              title="Project Value at Risk"
              value={`$${formatCount((stats?.delayedCount || 0) * 850)}`}
              subtitle="Revenue exposure is derived from delayed orders and the current exception surface."
              ctaLabel="Resolve exceptions"
              ctaTone="critical"
              onCtaClick={() => resolveModule(`/project/${projectId}/orders`, 'risk')}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="rounded-xl border border-border-subtle bg-bg-surface p-2 text-primary shadow-sm">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-text-primary">Subsystem Snapshots</div>
            <div className="text-sm text-text-muted">Each domain card is clickable and opens the corresponding deep-dive module.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {subsystemCards.map((card) => (
            <SubsystemCard
              key={card.name}
              name={card.name}
              status={card.status}
              metric={card.metric}
              subMetric={card.subMetric}
              icon={card.icon}
              onClick={() => resolveModule(card.href, card.name)}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-border-subtle bg-bg-surface p-2 text-primary shadow-sm">
                <TrendingUp size={18} />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-text-primary">Latency Confidence Profile</div>
                <div className="text-sm text-text-muted">Trend clarity, axis readability, and hover tooltips for fast interpretation.</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live profile
            </div>
          </div>

          <Card className="rounded-3xl border-border-subtle/60 p-5 shadow-sm">
            <PerformanceChart data={trends} title="" height={320} />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 border-t border-border-subtle/60 pt-4">
              {[
                { label: 'FCP', color: 'bg-success' },
                { label: 'LCP', color: 'bg-warning' },
                { label: 'Page Load', color: 'bg-primary' },
                { label: 'TTFB', color: 'bg-error' },
              ].map((item) => (
                <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-border-subtle bg-bg-surface p-2 text-primary shadow-sm">
                <Activity size={18} />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-text-primary">Recent System Activity</div>
                <div className="text-sm text-text-muted">Event stream and audit history for quick review.</div>
              </div>
            </div>
          </div>

          <Card className="flex min-h-[420px] flex-col overflow-hidden rounded-3xl border-border-subtle/60 shadow-sm">
            <div className="flex-1 overflow-auto">
              {activeAlerts.length > 0 ? (
                <div className="divide-y divide-border-subtle/60">
                  {activeAlerts.slice(0, 6).map((item, index) => (
                    <button
                      key={item.alertId || index}
                      type="button"
                      onClick={routeActivity}
                      className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-bg-muted/20 active:scale-[0.99]"
                    >
                      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${severityColors[item.severity || 'medium']}`} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="truncate text-sm font-semibold text-text-primary">{item.message}</div>
                          <span className="font-mono text-[11px] text-text-muted">{formatTime(item.timestamp)}</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                          {item.kpiName || 'Activity'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border-subtle bg-bg-muted text-text-muted">
                    <Clock size={30} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-semibold tracking-tight text-text-primary">No recent activity</div>
                    <div className="text-sm leading-6 text-text-muted">The activity feed is quiet. Use the audit log to inspect historical events.</div>
                  </div>
                  <button
                    type="button"
                    onClick={routeActivity}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-150 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                  >
                    Load more activity
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-border-subtle/60 bg-bg-muted/15 px-5 py-4">
              <button
                type="button"
                onClick={routeActivity}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border-subtle bg-bg-surface px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-primary transition-all duration-150 hover:shadow-md active:scale-[0.98]"
              >
                Open audit trail
                <ArrowRight size={14} />
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
