'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Settings, 
  PlayCircle, 
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { PageLayout, Grid, Col, Card, Button, Typography, StatusIndicator, Badge } from '@kpi-platform/ui';
import { PerformanceChart } from '../../../../components/ui/PerformanceChart';
import { MetricCard } from '../../../../components/ui/MetricCard';
import { MonitoringFilterBar } from '../../../../components/ui/MonitoringFilterBar';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { SortableTable, TableColumn } from '../../../../components/ui/SortableTable';

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { token, apiFetch, user, outageStatus, lastUpdated } = useAuth();
  
  const [metrics, setMetrics] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isExpired = outageStatus === 'expired';

  useEffect(() => {
    if (!token || !projectId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    Promise.allSettled([
      apiFetch(`/api/v1/dashboard/summaries?siteId=${projectId}`),
      apiFetch(`/api/v1/dashboard/alerts?siteId=${projectId}`),
      apiFetch(`/api/v1/dashboard/performance/trends?siteId=${projectId}`)
    ]).then((results) => {
      if (!isMounted) return;

      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        const firstError = (errors[0] as PromiseRejectedResult).reason;
        setErrorMsg(firstError?.message || 'Failed to fetch dashboard data.');
      }

      const [m, a, t] = results.map(r => r.status === 'fulfilled' ? r.value : []);
      
      setMetrics(Array.isArray(m) ? m : []);
      setAlerts(Array.isArray(a) ? a : []);
      setTrends(Array.isArray(t) ? t : []);
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, [projectId, token, apiFetch]);

  const activeAlerts = (alerts || []).filter((a: any) => a.status === 'active');

  const metricLabelMap: Record<string, { title: string, icon: string, unit?: string }> = {
    'pageLoadTime':      { title: 'Page Load Avg', icon: '⚡', unit: 'ms' },
    'errorRatePct':       { title: 'Client Errors', icon: '⚠️', unit: 'events' },
    'activeUsers':        { title: 'Active Users',   icon: '👥' },
    'ordersTotal':        { title: 'Total Orders',   icon: '🛍️' },
    'ordersDelayCount':   { title: 'Delayed Orders', icon: '⏳' },
    'syncSuccessRate':    { title: 'Integrations Sync', icon: '🔗', unit: '%' },
  };

  const PageActions = (
    <>
      <Button variant="outline" icon={Settings}>Manage</Button>
      <Button 
        variant="primary" 
        icon={PlayCircle}
        onClick={() => {
          apiFetch('/api/v1/simulate', { method: 'POST', body: JSON.stringify({ siteId: projectId }) })
            .then(() => window.location.reload());
        }}
      >
        Simulate Traffic
      </Button>
    </>
  );

  return (
    <PageLayout
      title="Project Overview"
      subtitle={`Viewing real-time telemetry for platform ID: ${projectId}`}
      actions={user?.role !== 'CUSTOMER' ? PageActions : undefined}
      className={isExpired ? 'is-expired' : ''}
    >
      {isExpired && (
        <div className="expired-overlay">
           <Card className="expired-card">
              <div className="expired-icon-wrapper">
                <AlertTriangle size={32} color="var(--error)" />
              </div>
              <Typography variant="h2" align="center">Data Lifecycle Expired</Typography>
              <Typography variant="body" align="center" color="muted">
                Last successful sync: <strong>{lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown'}</strong>.
              </Typography>
              <Button variant="primary" onClick={() => window.location.reload()} fullWidth>
                Attempt Reconnection
              </Button>
           </Card>
        </div>
      )}

      {errorMsg && (
        <Card className="error-card" variant="outline">
          <Badge variant="error" icon={AlertTriangle}>{errorMsg}</Badge>
        </Card>
      )}

      <div style={{ paddingBottom: '24px' }}>
         <MonitoringFilterBar lastRefreshed={new Date()} />
      </div>

      <Grid gap={6}>
        {/* Main Content Area */}
        <Col span={12} lg={8}>
          <Grid gap={4}>
            {/* KPI Section */}
            <Col span={12}>
              <SectionHeader title="Platform KPIs" subtitle="Live aggregate metrics across all monitoring dimensions" icon="📊" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i: number) => (
                    <MetricCard key={`loader-${i}`} title="Computing" value="—" state="healthy" icon="🔄" loading={true} />
                  ))
                ) : metrics.length === 0 ? (
                  <Card variant="outline" className="empty-state">
                    <ShieldCheck size={48} className="empty-icon" />
                    <Typography variant="h3">Waiting for Telemetry</Typography>
                    <Typography variant="body" color="muted">No live events tracked yet.</Typography>
                  </Card>
                ) : (
                  metrics.map((m: any) => {
                    const cfg = metricLabelMap[m?.kpiName] || { title: m?.kpiName || 'Unknown KPI', icon: '📈' };
                    return (
                      <MetricCard
                        key={m?.kpiName}
                        title={cfg.title}
                        value={m?.value}
                        unit={cfg.unit}
                        state={m?.state || 'healthy'}
                        icon={cfg.icon}
                        trendPct={m?.trendPct}
                        loading={false}
                      />
                    );
                  })
                )}
              </div>
            </Col>

            {/* Chart Section */}
            <Col span={12}>
              <SectionHeader title="Latency Trend" subtitle="Rolling performance profile over the selected timeframe" icon="📈" />
              <Card title="">
                {loading ? (
                  <div className="skeleton" style={{ height: '300px', width: '100%', borderRadius: '12px' }} />
                ) : (
                  <PerformanceChart data={trends || []} title="" />
                )}
              </Card>
            </Col>

            {/* Events Summary Table */}
            <Col span={12}>
              <SectionHeader title="Events Summary" subtitle="Detailed breakdown of each tracked KPI metric" icon="📋" />
              <SortableTable
                columns={[
                  { key: 'kpiName', label: 'Metric', sortable: true, render: (v, row) => <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{metricLabelMap[v]?.title || v}</span> },
                  { key: 'value', label: 'Value', sortable: true, align: 'right', render: (v, row) => <span style={{ fontWeight: 800 }}>{v ?? '—'}{metricLabelMap[row.kpiName]?.unit ? ` ${metricLabelMap[row.kpiName].unit}` : ''}</span> },
                  { key: 'state', label: 'Status', sortable: true, width: '110px', render: (v) => {
                    const statusColor = v === 'healthy' ? 'var(--success)' : v === 'warning' ? 'var(--warning)' : 'var(--error)';
                    const statusBg = v === 'healthy' ? 'var(--success-bg)' : v === 'warning' ? 'var(--warning-bg)' : 'var(--error-bg)';
                    return (
                      <span style={{ 
                        padding: '4px 10px', 
                        background: statusBg, 
                        color: statusColor, 
                        border: `1px solid ${statusColor}15`,
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        textTransform: 'capitalize' 
                      }}>
                        {v || 'unknown'}
                      </span>
                    );
                  }},
                  { key: 'trendPct', label: 'Trend', sortable: true, align: 'right', render: (v) => {
                    if (v === undefined || v === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                    const up = v >= 0;
                    return <span style={{ color: up ? '#ef4444' : '#10b981', fontWeight: 800, fontSize: '13px' }}>{up ? '↑' : '↓'} {Math.abs(v).toFixed(1)}%</span>;
                  }},
                ]}
                data={metrics}
                loading={loading}
                emptyMessage="No KPI data available for this session"
              />
            </Col>
          </Grid>
        </Col>

        {/* Sidebar Area */}
        <Col span={12} lg={4}>
          <Grid gap={6}>
            {/* Alerts Section */}
            <Col span={12}>
              <Card 
                title="Active Alerts" 
                extra={<Badge variant={activeAlerts.length > 0 ? 'error' : 'success'}>{activeAlerts.length}</Badge>}
              >
                {activeAlerts.length === 0 ? (
                  <div className="empty-alerts">
                    <CheckCircle2 size={32} color="var(--success)" style={{ opacity: 0.5 }} />
                    <Typography variant="body" color="muted">No critical breaches detected</Typography>
                  </div>
                ) : (
                  <div className="alerts-list">
                    {activeAlerts.slice(0, 3).map((a: any) => (
                      <div key={a.alertId} className="alert-item">
                        <div className="alert-item-header">
                          <Typography variant="body" weight="bold" color="error">{a.kpiName}</Typography>
                          <Typography variant="caption" color="muted">2m ago</Typography>
                        </div>
                        <Typography variant="caption" color="secondary">{a.message}</Typography>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" icon={ChevronRight} className="view-all-alerts">
                      View all alerts
                    </Button>
                  </div>
                )}
              </Card>
            </Col>

            {/* Governance Section */}
            <Col span={12}>
              <Card title="Governance">
                <div className="governance-list">
                  <div className="gov-item">
                    <div className="gov-info">
                      <TrendingUp size={14} color="var(--warning)" />
                      <Typography variant="caption">Trend Ingestion</Typography>
                    </div>
                    <StatusIndicator status="success" label="Active" />
                  </div>
                  <div className="gov-item">
                    <div className="gov-info">
                      <Clock size={14} color="var(--error)" />
                      <Typography variant="caption">Auto-Recovery</Typography>
                    </div>
                    <StatusIndicator status="success" label="Enabled" />
                  </div>
                </div>
              </Card>
            </Col>
          </Grid>
        </Col>
      </Grid>

      <style jsx>{`
        .is-expired .ui-page-layout > header,
        .is-expired .ui-page-layout > .page-content {
          opacity: 0.3;
          pointer-events: none;
        }
        
        .expired-overlay {
          position: absolute;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-10);
          backdrop-filter: blur(4px);
        }

        :global(.expired-card) {
          max-width: 440px;
          display: flex !important;
          flex-direction: column;
          align-items: center;
          gap: var(--space-6);
          padding: var(--space-8) !important;
          background: var(--bg-surface) !important;
          box-shadow: var(--shadow-2xl) !important;
        }

        .expired-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-2xl);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex !important;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-10) !important;
        }

        .empty-icon {
          color: var(--text-muted);
          opacity: 0.5;
          margin-bottom: var(--space-4);
        }

        .empty-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-6) 0;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .alert-item {
          padding: var(--space-3);
          background: rgba(var(--error-rgb), 0.05);
          border: 1px solid rgba(var(--error-rgb), 0.1);
          border-radius: var(--radius-lg);
        }

        .alert-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-1);
        }

        .governance-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .gov-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .gov-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
      `}</style>
    </PageLayout>
  );
}
