'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { PageLayout, Badge } from '@kpi-platform/ui';
import { MonitoringFilterBar } from '../../../../components/ui/MonitoringFilterBar';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { SortableTable, TableColumn } from '../../../../components/ui/SortableTable';
import { MetricCard } from '../../../../components/ui/MetricCard';
import { AlertTriangle, CheckCircle2, Bell, ShieldX } from 'lucide-react';

export default function AlertsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    useEffect(() => {
        if (!token || !projectId) return;
        setLoading(true);
        apiFetch(`/api/v1/dashboard/alerts?siteId=${projectId}`)
            .then(data => {
                setAlerts(Array.isArray(data) ? data : []);
                setLastRefreshed(new Date());
                setLoading(false);
            })
            .catch(e => { console.error(e); setLoading(false); });
    }, [projectId, token, apiFetch]);

    const activeAlerts   = useMemo(() => alerts.filter(a => a.status === 'active'), [alerts]);
    const criticalAlerts = useMemo(() => activeAlerts.filter(a => a.severity === 'critical'), [activeAlerts]);
    const warningAlerts  = useMemo(() => activeAlerts.filter(a => a.severity === 'warning'), [activeAlerts]);
    const resolvedAlerts = useMemo(() => alerts.filter(a => a.status !== 'active'), [alerts]);

    const getSeverityBadge = (sev: string) => {
        const map: Record<string, { bg: string; color: string; label: string }> = {
            critical: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'SEV 1' },
            warning:  { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'SEV 2' },
            info:     { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'SEV 3' },
        };
        const s = map[sev] || map.info;
        return (
            <span style={{ padding: '3px 10px', background: s.bg, color: s.color, borderRadius: '20px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.3px' }}>
                {s.label}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const isActive = status === 'active';
        return (
            <span style={{ padding: '3px 10px', background: isActive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', color: isActive ? '#ef4444' : '#10b981', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                {isActive ? 'Active' : 'Resolved'}
            </span>
        );
    };

    const tableColumns: TableColumn[] = [
        {
            key: 'severity',
            label: 'Severity',
            sortable: true,
            width: '90px',
            render: (v) => getSeverityBadge(v),
        },
        {
            key: 'kpiName',
            label: 'KPI / Source',
            sortable: true,
            render: (v, row) => (
                <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>{v || 'Unknown KPI'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>ID: {row.alertId}</div>
                </div>
            ),
        },
        {
            key: 'message',
            label: 'Message',
            render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            width: '100px',
            render: (v) => getStatusBadge(v),
        },
        {
            key: 'alertId',
            label: 'Alert ID',
            width: '140px',
            render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{v}</span>,
        },
    ];

    return (
        <PageLayout
            title="Alert Center"
            subtitle={`Real-time incident queue for ${projectId}`}
            actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: criticalAlerts.length > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', borderRadius: '20px', border: `1px solid ${criticalAlerts.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                    {criticalAlerts.length > 0
                        ? <><ShieldX size={14} color="#ef4444" /><span style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>{criticalAlerts.length} Critical Active</span></>
                        : <><CheckCircle2 size={14} color="#10b981" /><span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>All Systems Nominal</span></>
                    }
                </div>
            }
        >
            <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
                <MonitoringFilterBar lastRefreshed={lastRefreshed} />

                {/* KPI Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    <MetricCard
                        title="SEV 1 — Critical"
                        value={criticalAlerts.length}
                        state={criticalAlerts.length > 0 ? 'critical' : 'healthy'}
                        icon="🔴"
                    />
                    <MetricCard
                        title="SEV 2 — Warning"
                        value={warningAlerts.length}
                        state={warningAlerts.length > 2 ? 'warning' : 'healthy'}
                        icon="🟡"
                    />
                    <MetricCard
                        title="Active Incidents"
                        value={activeAlerts.length}
                        state={activeAlerts.length > 3 ? 'warning' : 'healthy'}
                        icon="🔔"
                    />
                    <MetricCard
                        title="Resolved (Session)"
                        value={resolvedAlerts.length}
                        state="healthy"
                        icon="✅"
                    />
                </div>

                {/* All Incidents Table */}
                <SectionHeader
                    title="Incident Queue"
                    subtitle="All active and recently resolved alerts. Click column headers to sort."
                    icon="🚨"
                    action={
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {alerts.length} total incidents
                        </span>
                    }
                />
                <SortableTable
                    columns={tableColumns}
                    data={alerts}
                    loading={loading}
                    pageSize={12}
                    emptyMessage="No active alerts — all systems nominal"
                />
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="repeat(4, 1fr)"] {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            `}</style>
        </PageLayout>
    );
}
