'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  PageLayout, 
  Grid, 
  Col, 
  Card, 
  Typography, 
  Badge
} from '@kpi-platform/ui';
import { 
  Building2, 
  AlertTriangle, 
  Users,
  Activity,
  Server,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { PerformanceChart } from '../../components/ui/PerformanceChart';
import { ClickableCard } from '../../components/ui/ClickableCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function SuperAdminDashboard() {
    const { user, token, apiFetch, setProject } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        apiFetch('/api/v1/projects')
            .then(data => {
                const results = Array.isArray(data) ? data : [];
                // Only load assigned projects (or all if SUPER_ADMIN)
                const authorized = results.filter(p => 
                  user?.role === 'SUPER_ADMIN' || user?.assignedProjects?.includes(p.id)
                );
                setProjects(authorized);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [token, apiFetch, user?.role, user?.assignedProjects]);

    // Computed Aggregation Logic from standard portfolio schema
    const aggregateMetrics = useMemo(() => {
      let totalUsers = 0;
      let totalErrors = 0;
      let criticalAlerts = 0;
      
      projects.forEach(p => {
        totalUsers += p.metricsSummary?.activeUsers || 0;
        totalErrors += p.metricsSummary?.errorRate || 0;
        criticalAlerts += (p.metricsSummary?.errorRate && p.metricsSummary.errorRate > 0) ? 1 : 0;
      });

      const avgHealth = projects.length > 0 ? 100 - (totalErrors / projects.length) : 100;
      
      return {
        totalProjects: projects.length,
        activeUsers: totalUsers,
        avgHealth: avgHealth.toFixed(1),
        criticalAlerts: criticalAlerts * 3 // Weighted projection for mock
      };
    }, [projects]);

    // High Density Chart Mocks
    const mockLatencyData = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => ({
            timestamp: `${i * 2}:00`,
            pageLoadTime: 200 + Math.random() * 150,
            ttfb: 100 + Math.random() * 50,
            fcp: 150 + Math.random() * 60,
            lcp: 400 + Math.random() * 200,
        }));
    }, []);

    const apiUsageData = useMemo(() => {
       if(projects.length === 0) return [];
       return projects.slice(0, 5).map(p => ({
         name: p.name.substring(0, 10),
         requests: Math.floor(Math.random() * 50000) + 10000
       }));
    }, [projects]);

    const globalAlerts = [
      { id: 1, severity: 'critical', project: 'ecommerce-prod', msg: 'API Rate Limit Exceeded' },
      { id: 2, severity: 'critical', project: 'auth-service', msg: 'Elevated 5xx Responses' },
      { id: 3, severity: 'warning', project: 'inventory-sync', msg: 'Sync delay > 5m' },
      { id: 4, severity: 'warning', project: 'payment-gateway', msg: 'Latency spike detected' },
    ];

    if (!user) return null;

    if (loading) {
      return (
        <div style={{ padding: '80px', textAlign: 'center' }}>
            <Typography variant="body" color="muted">Initializing Control Center...</Typography>
        </div>
      );
    }

    return (
      <PageLayout
        title="Global Control Center"
        subtitle="High-density aggregate platform observability"
      >
        <div className="sa-dashboard">
          
          {/* TOP KPI STRIP */}
          <div className="kpi-strip">
            <ClickableCard
              onClick={() => router.push('/projects')}
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}
              accentColor="#2563eb"
            >
              <div className="kpi-icon-wrap bg-blue"><Building2 size={18} /></div>
              <div className="kpi-data">
                <Typography variant="caption" color="muted" weight="bold">TOTAL INSTANCES</Typography>
                <div className="kpi-value-row">
                  <Typography variant="h3" noMargin>{aggregateMetrics.totalProjects}</Typography>
                  <span className="kpi-trend up"><TrendingUp size={12} /> All active</span>
                </div>
              </div>
            </ClickableCard>

            <ClickableCard
              onClick={() => router.push('/projects')}
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}
              accentColor="#10b981"
            >
              <div className="kpi-icon-wrap bg-green"><Activity size={18} /></div>
              <div className="kpi-data">
                <Typography variant="caption" color="muted" weight="bold">GLOBAL HEALTH</Typography>
                <div className="kpi-value-row">
                  <Typography variant="h3" noMargin color={Number(aggregateMetrics.avgHealth) < 95 ? 'error' : 'success'}>
                    {aggregateMetrics.avgHealth}%
                  </Typography>
                  <span className="kpi-trend up"><TrendingUp size={12} /> Nominal</span>
                </div>
              </div>
            </ClickableCard>

            <ClickableCard
              onClick={() => router.push('/projects')}
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}
              accentColor="#8b5cf6"
            >
              <div className="kpi-icon-wrap bg-purple"><Users size={18} /></div>
              <div className="kpi-data">
                <Typography variant="caption" color="muted" weight="bold">ACTIVE USERS</Typography>
                <div className="kpi-value-row">
                  <Typography variant="h3" noMargin>{aggregateMetrics.activeUsers.toLocaleString()}</Typography>
                </div>
              </div>
            </ClickableCard>

            <ClickableCard
              onClick={() => {}}
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}
              accentColor="#ef4444"
            >
              <div className="kpi-icon-wrap bg-red"><AlertTriangle size={18} /></div>
              <div className="kpi-data">
                <Typography variant="caption" color="error" weight="bold">ACTIVE BREACHES</Typography>
                <div className="kpi-value-row">
                  <Typography variant="h3" noMargin color="error">{aggregateMetrics.criticalAlerts || globalAlerts.length}</Typography>
                  <span className="kpi-trend down">Needs review</span>
                </div>
              </div>
            </ClickableCard>
          </div>

          <Grid gap={4}>
            
            {/* LEFT COLUMN (70%) - Core Analytics & Grid Data */}
            <Col span={12} lg={8}>
               <Grid gap={4}>
                  <Col span={12}>
                     <Card title="Traffic & Latency Profile" className="dense-card">
                        <div style={{ marginTop: '-20px' }}>
                           <PerformanceChart data={mockLatencyData} title="" />
                        </div>
                     </Card>
                  </Col>
                  
                  <Col span={12} md={6}>
                     <Card title="API Requests Distribution" className="dense-card">
                        <div style={{ width: '100%', height: 260 }}>
                           <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={apiUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="var(--text-secondary)" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                <Tooltip cursor={{fill: 'rgba(0,0,0,0.03)'}} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                                <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                                  {apiUsageData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="var(--primary)" />
                                  ))}
                                </Bar>
                             </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </Card>
                  </Col>

                  <Col span={12} md={6}>
                     <Card title="Node Integrity Status" className="dense-card">
                        <div className="dense-table-wrapper">
                           <table className="dense-table">
                              <thead>
                                 <tr>
                                    <th>PROJECT</th>
                                    <th>STATUS</th>
                                    <th>SYNC</th>
                                    <th></th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {projects.slice(0, 6).map(p => (
                                    <tr key={p.id} style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                                      onClick={() => { setProject(p.id); router.push(`/project/${p.id}/overview`); }}
                                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                                    >
                                      <td className="fw-500">{p.name}</td>
                                      <td><Badge variant={p.status === 'active' ? 'success' : 'warning'}>{p.status}</Badge></td>
                                      <td>Current</td>
                                      <td style={{ textAlign: 'right', paddingRight: '8px' }}><ArrowRight size={12} color="var(--primary)" /></td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </Card>
                  </Col>
               </Grid>
            </Col>

            {/* RIGHT COLUMN (30%) - Priority Actions & Feeds */}
            <Col span={12} lg={4}>
               <Grid gap={4}>
                 
                 {/* Super Admin Status Summary */}
                 <Col span={12}>
                    <Card title="Network Capability" className="dense-card bg-subtle">
                       <div className="status-grid">
                          <div className="status-box">
                             <Typography variant="h2" color="success" noMargin>100%</Typography>
                             <Typography variant="caption" color="muted">API Uptime</Typography>
                          </div>
                          <div className="status-box">
                             <Typography variant="h2" color="success" noMargin>99.9%</Typography>
                             <Typography variant="caption" color="muted">Node Sync</Typography>
                          </div>
                       </div>
                    </Card>
                 </Col>

                 {/* Active Alerts List */}
                 <Col span={12}>
                    <Card title="Platform Alert Stack" className="dense-card">
                       <div className="alert-counters">
                          <div className="counter c-crit">
                             <Typography variant="caption" weight="bold">SEV 1</Typography>
                             <span>{aggregateMetrics.criticalAlerts || 2}</span>
                          </div>
                          <div className="counter c-warn">
                             <Typography variant="caption" weight="bold">SEV 2</Typography>
                             <span>{globalAlerts.filter(a => a.severity === 'warning').length}</span>
                          </div>
                       </div>

                       <div className="alert-stack">
                           {globalAlerts.map(a => (
                               <div key={a.id} className={`alert-row ${a.severity}`} style={{ cursor: 'pointer' }} onClick={() => {}}>
                                   <div className="a-marker"></div>
                                   <div className="a-content">
                                       <div className="a-ctx">
                                          <Server size={12} />
                                          <span>{a.project}</span>
                                       </div>
                                       <span className="a-msg">{a.msg}</span>
                                   </div>
                                   <ArrowRight size={12} style={{ marginLeft: 'auto', color: 'var(--text-muted)', flexShrink: 0 }} />
                               </div>
                           ))}
                       </div>
                    </Card>
                 </Col>

                 {/* Instance Quick Actions */}
                 <Col span={12}>
                    <Card title="Drill-down Access" className="dense-card">
                       <div className="target-list">
                          {projects.map(p => (
                             <ClickableCard
                               key={p.id}
                               onClick={() => { setProject(p.id); router.push(`/project/${p.id}/overview`); }}
                               style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-muted)', marginBottom: '8px' }}
                             >
                                <div>
                                   <Typography variant="body" weight="bold" noMargin>{p.name}</Typography>
                                   <Typography variant="caption" color="muted">{p.id}</Typography>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '12px', fontWeight: 700 }}>
                                  Enter Project <ArrowRight size={14} />
                                </div>
                             </ClickableCard>
                          ))}
                       </div>
                    </Card>
                 </Col>

               </Grid>
            </Col>

          </Grid>
        </div>

        <style jsx>{`
          .sa-dashboard {
             display: flex;
             flex-direction: column;
             gap: var(--space-4);
          }

          .kpi-strip {
             display: grid;
             grid-template-columns: repeat(4, minmax(0, 1fr));
             gap: var(--space-4);
          }

          :global(.kpi-mini-card) {
             padding: var(--space-3.5) var(--space-4) !important;
             display: flex;
             align-items: center;
             gap: var(--space-4);
          }

          .kpi-icon-wrap {
             width: 44px;
             height: 44px;
             border-radius: var(--radius-lg);
             display: flex;
             align-items: center;
             justify-content: center;
             flex-shrink: 0;
          }
          
          .bg-blue { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
          .bg-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .bg-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
          .bg-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

          .kpi-data {
             flex: 1;
             display: flex;
             flex-direction: column;
             gap: var(--space-1);
          }

          .kpi-value-row {
             display: flex;
             align-items: center;
             gap: var(--space-2);
          }

          .kpi-trend {
             font-size: 11px;
             font-weight: 700;
             display: flex;
             align-items: center;
             gap: 3px;
             padding: 2px 8px;
             border-radius: 20px;
          }

          .kpi-trend.up { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .kpi-trend.down { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

          :global(.dense-card) {
             padding: var(--space-4) !important;
          }

          .bg-subtle {
             background: var(--bg-muted) !important;
             border: none !important;
          }
          
          .status-grid {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: var(--space-3);
          }

          .status-box {
             text-align: center;
             background: var(--bg-surface);
             padding: var(--space-4) var(--space-2);
             border-radius: var(--radius-lg);
             border: 1px solid var(--border-light);
             display: flex;
             flex-direction: column;
             gap: var(--space-1);
          }

          .alert-counters {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: var(--space-3);
             margin-bottom: var(--space-5);
          }

          .counter {
             display: flex;
             flex-direction: column;
             align-items: center;
             padding: var(--space-3);
             border-radius: var(--radius-md);
             gap: var(--space-1);
          }

          .c-crit { background: rgba(239,68,68,0.1); color: #ef4444; }
          .c-crit span { font-size: 26px; font-weight: 800; line-height: 1; }
          .c-warn { background: rgba(245,158,11,0.1); color: #f59e0b; }
          .c-warn span { font-size: 26px; font-weight: 800; line-height: 1; }

          .alert-stack {
             display: flex;
             flex-direction: column;
             gap: var(--space-3);
          }

          .alert-row {
             display: flex;
             align-items: stretch;
             gap: var(--space-3);
             padding: var(--space-3);
             background: var(--bg-surface);
             border: 1px solid var(--border-subtle);
             border-radius: var(--radius-md);
             transition: transform 0.2s;
          }

          .alert-row:hover {
             border-color: var(--border);
          }

          .a-marker {
             width: 4px;
             border-radius: 4px;
             flex-shrink: 0;
          }

          .alert-row.critical .a-marker { background: #ef4444; }
          .alert-row.warning .a-marker { background: #f59e0b; }

          .a-content {
             display: flex;
             flex-direction: column;
             gap: 4px;
          }

          .a-ctx {
             display: flex;
             align-items: center;
             gap: 4px;
             font-size: 11px;
             color: var(--text-muted);
             text-transform: uppercase;
             font-weight: 700;
             letter-spacing: 0.05em;
          }

          .a-msg {
             font-size: 14px;
             color: var(--text-primary);
             font-weight: 600;
          }

          .target-list {
             display: flex;
             flex-direction: column;
          }

          .dense-table-wrapper {
             width: 100%;
             overflow-x: auto;
             max-height: 250px;
             overflow-y: auto;
             border-radius: var(--radius-md);
             border: 1px solid var(--border-subtle);
          }

          .dense-table {
             width: 100%;
             border-collapse: collapse;
             font-size: 13px;
          }

          .dense-table th {
             text-align: left;
             padding: var(--space-2) var(--space-3);
             color: var(--text-muted);
             font-weight: 700;
             border-bottom: 1px solid var(--border-subtle);
             position: sticky;
             top: 0;
             background: var(--bg-surface);
             z-index: 1;
          }

          .dense-table td {
             padding: var(--space-2) var(--space-3);
             border-bottom: 1px solid var(--border-light);
             color: var(--text-secondary);
          }

          .fw-500 { font-weight: 500; color: var(--text-primary) !important; }

          @media (max-width: 1024px) {
             .kpi-strip {
                grid-template-columns: repeat(2, minmax(0, 1fr));
             }
          }
          
          @media (max-width: 640px) {
             .kpi-strip {
                grid-template-columns: 1fr;
             }
          }
        `}</style>
      </PageLayout>
    );
}
