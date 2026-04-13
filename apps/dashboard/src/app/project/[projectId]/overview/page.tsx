'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { MetricCard } from '../../../../components/ui/MetricCard';

const API = 'http://localhost:4000';

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { token, apiFetch } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !projectId) return;

    setLoading(true);
    Promise.all([
      apiFetch(`${API}/api/v1/dashboard/summaries?siteId=${projectId}`),
      apiFetch(`${API}/api/v1/dashboard/alerts?siteId=${projectId}`)
    ]).then(([m, a]) => {
      setMetrics(Array.isArray(m) ? m : []);
      setAlerts(Array.isArray(a) ? a : []);
      setLoading(false);
    }).catch(e => {
      console.error('Data fetch error:', e);
      setLoading(false);
    });
  }, [projectId, token, apiFetch]);

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading project overview...</div>;

  const activeAlerts = alerts.filter((a: any) => a.status === 'active');

  const metricLabelMap: Record<string, { title: string, icon: string, unit?: string }> = {
    'pageLoadTime':      { title: 'Page Load Avg', icon: '⚡', unit: 'ms' },
    'errorRatePct':       { title: 'Client Errors', icon: '⚠️', unit: 'events' },
    'activeUsers':        { title: 'Active Users',   icon: '👥' },
    'ordersTotal':        { title: 'Total Orders',   icon: '🛍️' },
    'ordersDelayCount':   { title: 'Delayed Orders', icon: '⏳' },
    'syncSuccessRate':    { title: 'Integrations Sync', icon: '🔗', unit: '%' },
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '32px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.4px' }}>
          Project Dashboard
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          Real-time metrics for <strong>{projectId}</strong> · All systems operational
        </p>
      </header>

      {/* Metric Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px'
      }}>
        {metrics.map((m: any) => {
          const cfg = metricLabelMap[m.kpiName] || { title: m.kpiName, icon: '📈' };
          return (
            <MetricCard
              key={m.kpiName}
              title={cfg.title}
              value={m.value}
              unit={cfg.unit}
              state={m.state}
              icon={cfg.icon}
              trendPct={m.trendPct}
            />
          );
        })}
      </div>

      {activeAlerts.length > 0 && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.04)', border: '1px solid rgba(220, 38, 38, 0.15)',
          borderRadius: '16px', padding: '24px', marginBottom: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
                <div className="status-dot" style={{ background: 'var(--accent-red)', width: '12px', height: '12px' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-red)' }}>
                {activeAlerts.length} Active Alerts require attention
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {activeAlerts.slice(0, 2).map((a: any) => a.kpiName).join(' · ')}
              </p>
            </div>
          </div>
          <a href={`/project/${projectId}/alerts`} style={{
            background: 'var(--accent-red)', color: '#fff', padding: '10px 20px',
            borderRadius: '10px', fontSize: '13px', fontWeight: '800', textDecoration: 'none'
          }}>View Alerts →</a>
        </div>
      )}

      {/* Capabilities & Governance */}
      <div style={{ marginTop: '48px', padding: '32px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Platform Capabilities</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'var(--border-light)', borderRadius: '16px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚀</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Real-time Monitoring</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Low-latency data ingestion and processing for immediate insights into {projectId}.</p>
              </div>
              <div style={{ padding: '20px', background: 'var(--border-light)', borderRadius: '16px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔒</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Data Security</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Strict isolation and project-based access control for your privacy.</p>
              </div>
              {user?.role !== 'CUSTOMER' && (
                  <div style={{ padding: '20px', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '16px', border: '1px dashed var(--accent-blue)' }}>
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>🛠️</div>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '4px' }}>Admin Governance</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure thresholds, manage users, and simulate event streams for this project.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
