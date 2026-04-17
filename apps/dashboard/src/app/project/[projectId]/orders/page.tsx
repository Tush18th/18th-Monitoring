'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { 
    OrderStatsGrid, 
    IntelligentRcaPanel, 
    IngestionControlPanel 
} from '../../../../components/ui/OrderAnalyticsWidgets';
import { PageLayout } from '@kpi-platform/ui';
import { MonitoringFilterBar } from '../../../../components/ui/MonitoringFilterBar';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { SortableTable } from '../../../../components/ui/SortableTable';

export default function OrdersPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    
    const [stats, setStats] = useState<any>(null);
    const [rca, setRca] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!token || !projectId) return;
        try {
            const [s, r, rec, l] = await Promise.all([
                apiFetch(`/api/v1/dashboard/orders/summary?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/orders/rca?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/orders/recommendations?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/orders/integrations/status?siteId=${projectId}`)
            ]);
            setStats(s);
            setRca(r);
            setRecommendations(rec);
            setLogs(l);
        } catch (e) {
            console.error('Failed to sync order intelligence:', e);
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleUpload = async (csv: string) => {
        try {
            await apiFetch(`/api/v1/dashboard/orders/offline/upload?siteId=${projectId}`, {
                method: 'POST',
                body: JSON.stringify({ csv })
            });
            fetchData();
        } catch (e) {
            alert('Upload failed. Check format.');
        }
    };

    const handleSync = async (system: string) => {
        try {
            await apiFetch(`/api/v1/dashboard/orders/integrations/sync?siteId=${projectId}`, {
                method: 'POST',
                body: JSON.stringify({ system })
            });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading && !stats) return <div style={{ padding: '40px' }}>Loading Command Center...</div>;

    return (
        <PageLayout 
            title="Orders Monitoring & Intelligence"
            subtitle="Centralized oversight of online, offline, and integrated system flow"
            actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '12px', height: '12px', background: rca?.status === 'alert' ? 'var(--accent-red)' : '#10b981', borderRadius: '50%', boxShadow: `0 0 10px ${rca?.status === 'alert' ? 'var(--accent-red)' : '#10b981'}` }} />
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>System Status: {rca?.status === 'alert' ? 'CRITICAL' : 'HEALTHY'}</span>
                </div>
            }
        >
            <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
                <MonitoringFilterBar lastRefreshed={new Date()} />

            <SectionHeader title="RCA Intelligence" subtitle="Automated root-cause analysis and actionable recommendations" icon="🧠" />
            <IntelligentRcaPanel rca={rca} recommendations={recommendations} />

            <SectionHeader title="Order Telemetry" subtitle="Aggregated processing KPIs and ingestion stats" icon="📦" style={{ marginTop: '32px' }} />
            <OrderStatsGrid stats={stats} />

            <div style={{ marginTop: '32px', marginBottom: '40px' }}>
                <SectionHeader title="Ingestion Control" subtitle="Manage integrations and offline sync manually" icon="🔌" />
                <IngestionControlPanel onUpload={handleUpload} onSync={handleSync} />
            </div>

            <div style={{ marginTop: '32px' }}>
                <SectionHeader title="Recent Sync History" subtitle="Integration job statuses and outcomes" icon="📝" />
                <SortableTable
                    columns={[
                        { key: 'system', label: 'System', sortable: true, render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
                        { key: 'timestamp', label: 'Time', sortable: true, align: 'right', render: v => <span style={{ color: 'var(--text-secondary)' }}>{v ? new Date(v).toLocaleTimeString() : '—'}</span> },
                        { key: 'status', label: 'Status', sortable: true, align: 'right', render: v => {
                            const isSuccess = v === 'success';
                            return <span style={{ color: isSuccess ? '#10b981' : '#ef4444', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', padding: '4px 10px', background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '20px' }}>{v}</span>;
                        }}
                    ]}
                    data={logs}
                    pageSize={5}
                    emptyMessage="No integration logs found for this period"
                />
            </div>
          </div>
        </PageLayout>
    );
}
