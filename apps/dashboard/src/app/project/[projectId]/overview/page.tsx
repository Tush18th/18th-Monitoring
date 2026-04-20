'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Button, 
  Card, 
  PageLayout, 
  Typography, 
  Badge, 
  BadgeVariant,
  OperationalTable,
  Column,
  InformationState,
  MetricCard
} from '@kpi-platform/ui';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  PlayCircle, 
  Settings, 
  ShieldCheck, 
  TrendingUp,
  Activity,
  Package,
  Users,
  Zap,
  ArrowRight,
  Clock,
  ExternalLink,
  ChevronRight,
  Bell,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

// Logic & UI Primitives
import { PerformanceChart } from '../../../../components/ui/PerformanceChart';
// Metrics and specific cards

// Dashboard Specific Components
import { SystemHealthOverview } from '../../../../components/dashboard/SystemHealthOverview';
import { ModuleSnapshot } from '../../../../components/dashboard/ModuleSnapshot';

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
  
  const isExpired = outageStatus === 'expired';

  const loadData = useCallback(async () => {
    if (!token || !projectId) return;
    setLoading(true);
    try {
      const [summ, alrt, trnd, ords] = await Promise.all([
        apiFetch(`/api/v1/dashboard/summaries?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/alerts?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/performance/trends?siteId=${projectId}`),
        apiFetch(`/api/v1/dashboard/orders/summary?siteId=${projectId}`)
      ]);
      
      setMetrics(Array.isArray(summ) ? summ : []);
      setAlerts(Array.isArray(alrt) ? alrt : []);
      setTrends(Array.isArray(trnd) ? trnd : []);
      setStats(ords);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, token, apiFetch]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // 1 min refresh for high-level overview
    return () => clearInterval(interval);
  }, [loadData]);

  // Derivations
  const activeAlerts = useMemo(() => alerts.filter(a => a.status === 'active'), [alerts]);
  
  const moduleHealths = useMemo(() => {
    const findMetric = (name: string) => metrics.find(m => m.kpiName === name);
    
    return [
      { 
        name: 'Integrations', 
        status: (findMetric('syncSuccessRate')?.state === 'critical' ? 'critical' : findMetric('syncSuccessRate')?.state === 'warning' ? 'degraded' : 'healthy') as any, 
        icon: RefreshCw, 
        href: `/project/${projectId}/integrations`,
        label: `Reliability: ${findMetric('syncSuccessRate')?.value || 0}%`
      },
      { 
        name: 'Orders', 
        status: (stats?.failedCount > 0 ? 'critical' : stats?.delayedCount > 0 ? 'degraded' : 'healthy') as any, 
        icon: Package, 
        href: `/project/${projectId}/orders`,
        label: `Velocity: ${stats?.ordersPerMinute || '0.00'} RPM`
      },
      { 
        name: 'Performance', 
        status: (findMetric('errorRatePct')?.state || 'healthy') as any, 
        icon: Gauge, 
        href: `/project/${projectId}/performance`,
        label: `Client Latency: ${findMetric('pageLoadTime')?.value || 0}ms`
      },
      { 
        name: 'Customers', 
        status: 'healthy' as any, 
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
      width: '80px',
      render: (val) => <Badge variant={val === 'high' || val === 'critical' ? 'error' : 'warning'} size="sm">{val?.toUpperCase()}</Badge> 
    },
    { 
      key: 'message', 
      header: 'Intelligence Alert', 
      render: (val, row) => (
        <div>
          <Typography variant="body" weight="bold" className="text-sm" noMargin>{row.kpiName}</Typography>
          <Typography variant="micro" className="text-text-muted">{val}</Typography>
        </div>
      )
    },
    { 
      key: 'timestamp', 
      header: 'Detected', 
      align: 'right',
      render: (val) => <span className="text-text-muted">{new Date(val || Date.now()).toLocaleTimeString()}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => <ArrowRight size={14} className="text-text-muted" />
    }
  ];

  return (
    <PageLayout
      title="Control Tower"
      subtitle="Unified executive observability and operational oversight."
      icon={<ShieldCheck size={24} />}
      actions={
        <div className="flex items-center gap-3">
          <Badge variant={isExpired ? 'stale' : 'success'} size="sm" dot>
            {isExpired ? 'DATA STALE' : 'LIVE FEED ACTIVE'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      }
    >
      <div className="dashboard-page-body">
        {/* 1. Global System Health */}
        <SystemHealthOverview 
          modules={moduleHealths}
          overallStatus={overallHealth.variant}
          overallLabel={overallHealth.label}
          loading={loading}
        />

        {/* 2. Intelligence Area: Critical Anomalies & Alerts */}
        <div className="dashboard-split-grid">
          <Card padding="none" className="overflow-hidden border-l-4" style={{ borderLeftColor: 'var(--error)' }}>
            <div className="p-5 bg-error-bg/20 border-b border-error/15 flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-error flex-shrink-0" />
                <Typography variant="body" weight="bold" noMargin className="text-error">Active Intelligence Alerts</Typography>
              </div>
              <Badge variant="error" size="sm">{activeAlerts.length} ISSUES</Badge>
            </div>
            <OperationalTable 
              columns={alertColumns} 
              data={activeAlerts.slice(0, 5)} 
              isDense 
              isEmpty={activeAlerts.length === 0}
              emptyTitle="No active anomalies detected"
            />
          </Card>

          <Card padding="lg">
            <div className="dashboard-stack gap-4">
              <div>
                <Typography variant="caption" weight="bold" className="uppercase tracking-wider block mb-4" color="muted">
                  Executive Summary (24h)
                </Typography>
                <div className="dashboard-stack gap-3">
                  <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                    <Typography variant="body" weight="bold">Total Volume</Typography>
                    <Typography variant="h3" weight="bold" noMargin>{stats?.ordersTotal || 0}</Typography>
                  </div>
                  <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                    <Typography variant="body" weight="bold">Revenue Integrity</Typography>
                    <Badge variant="success" size="sm">99.8%</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border border-warning/20">
                    <Typography variant="body" weight="bold">Delayed Value</Typography>
                    <Typography variant="body" weight="bold" className="text-warning">${(stats?.delayedCount || 0) * 85}</Typography>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="md"
                onClick={() => router.push(`/project/${projectId}/management`)}
              >
                System Governance <ExternalLink size={14} />
              </Button>
            </div>
          </Card>
        </div>

        {/* 3. Operational Domain Snapshots */}
        <div className="dashboard-metrics-grid">
          <ModuleSnapshot 
            title="Integrations"
            icon={RefreshCw}
            status={moduleHealths[0].status}
            href={`/project/${projectId}/integrations`}
            metrics={[
              { label: 'Sync Health', value: metrics.find(m => m.kpiName === 'syncSuccessRate')?.value || 0, unit: '%', status: 'success' },
              { label: 'Failed (24h)', value: activeAlerts.filter(a => a.kpiName.includes('sync')).length, status: 'error' }
            ]}
          />
          <ModuleSnapshot 
            title="Orders"
            icon={Package}
            status={moduleHealths[1].status}
            href={`/project/${projectId}/orders`}
            metrics={[
              { label: 'Velocity', value: stats?.ordersPerMinute || '0.0', unit: 'RPM' },
              { label: 'Exceptions', value: (stats?.failedCount || 0) + (stats?.delayedCount || 0), status: 'warning' }
            ]}
          />
          <ModuleSnapshot 
            title="Performance"
            icon={Gauge}
            status={moduleHealths[2].status}
            href={`/project/${projectId}/performance`}
            metrics={[
              { label: 'p95 Latency', value: metrics.find(m => m.kpiName === 'pageLoadTime')?.value || 0, unit: 'ms' },
              { label: 'Error Rate', value: metrics.find(m => m.kpiName === 'errorRatePct')?.value || 0, unit: '%', status: 'error' }
            ]}
          />
          <ModuleSnapshot 
            title="Customers"
            icon={Users}
            status={moduleHealths[3].status}
            href={`/project/${projectId}/customers`}
            metrics={[
              { label: 'Live Users', value: metrics.find(m => m.kpiName === 'activeUsers')?.value || 0 },
              { label: 'Retention', value: '42%', unit: 'CR' }
            ]}
          />
        </div>

        {/* 4. Trends & System Activity */}
        <div className="dashboard-split-grid">
          <Card padding="lg">
            <div className="dashboard-stack gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-text-muted" />
                  <Typography variant="caption" weight="bold" className="uppercase tracking-wider text-text-muted" noMargin>
                    Latency Confidence Profile
                  </Typography>
                </div>
                <Badge variant="info" size="sm">REAL-TIME</Badge>
              </div>
              <PerformanceChart data={trends} title="" />
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-subtle bg-muted/20 flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-text-muted" />
                <Typography variant="caption" weight="bold" className="uppercase tracking-wider text-text-muted" noMargin>
                  Recent System Activity
                </Typography>
              </div>
              <Typography variant="micro" className="text-primary font-bold cursor-pointer hover:underline">
                View Audit
              </Typography>
            </div>
            <div className="divide-y divide-subtle">
              {activeAlerts.length > 0 ? activeAlerts.slice(0, 6).map((item, idx) => (
                <div key={idx} className="p-4 flex gap-3 hover:bg-muted/40 transition-colors group cursor-pointer">
                  <div className="mt-1 w-2 h-2 rounded-full bg-error flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <Typography variant="body" weight="semibold" className="text-sm">{item.message}</Typography>
                      <Typography variant="micro" className="text-text-muted flex-shrink-0">{new Date(item.timestamp || Date.now()).toLocaleTimeString()}</Typography>
                    </div>
                    <Typography variant="micro" className="text-text-muted block mt-1 uppercase">Source: {item.kpiName}</Typography>
                  </div>
                  <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0" />
                </div>
              )) : (
                <div className="p-12 text-center">
                  <Typography variant="caption" color="muted">No recent system activity detected.</Typography>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
