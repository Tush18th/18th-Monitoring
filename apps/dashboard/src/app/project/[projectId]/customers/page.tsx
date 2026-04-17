'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { UserStatsSummary, DeviceDistribution, BrowserDistribution } from '../../../../components/ui/UserAnalyticsWidgets';
import { PageLayout } from '@kpi-platform/ui';
import { MonitoringFilterBar } from '../../../../components/ui/MonitoringFilterBar';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { SortableTable, TableColumn } from '../../../../components/ui/SortableTable';

export default function CustomersPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!token || !projectId) return;
        try {
            const result = await apiFetch(`/api/v1/dashboard/customers/analytics?siteId=${projectId}`);
            setData(result);
            setError(null);
        } catch (e) {
            console.error('Failed to fetch customer analytics:', e);
            setError('Real-time sync interrupted. Retrying...');
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => {
        fetchData();
        // Polling every 10 seconds for "real-time" feel
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading && !data) {
        return (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div className="spinner" style={{ border: '4px solid var(--border-light)', borderTop: '4px solid var(--accent-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Initializing Customer Analytics...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <PageLayout 
            title="Customer Analytics"
            subtitle={`Real-time visitor insights for ${projectId}`}
            actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }} />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Live Analytics Running</span>
                </div>
            }
        >
            {error && (
                <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                </div>
            )}
            
            <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
                <MonitoringFilterBar lastRefreshed={new Date()} />

            {data ? (
                <>
                    <SectionHeader title="Customer Analytics Summary" subtitle="Aggregate visitor and session metrics" icon="👥" />
                    <UserStatsSummary data={data} />
                    
                    <SectionHeader title="Device & Browser Breakdown" subtitle="Distribution of sessions by device type and browser" icon="📱" style={{ marginTop: '32px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
                        <DeviceDistribution data={data.deviceBreakdown} />
                        <BrowserDistribution data={data.browserBreakdown} />
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <SectionHeader title="Session Log" subtitle="Individual session streams processed this cycle" icon="🧵" />
                        <SortableTable
                            columns={[
                                { key: 'device', label: 'Device', sortable: true },
                                { key: 'browser', label: 'Browser', sortable: true },
                                { key: 'sessions', label: 'Sessions', sortable: true, align: 'right', render: v => <strong>{v ?? '—'}</strong> },
                                { key: 'bounceRate', label: 'Bounce Rate', sortable: true, align: 'right', render: v => v != null ? `${v}%` : '—' },
                            ]}
                            data={[
                                ...(data.deviceBreakdown || []).map((d: any) => ({ id: `d-${d.device || d.name}`, device: d.device || d.name, browser: 'All', sessions: d.count || d.sessions || 0, bounceRate: null })),
                            ]}
                            emptyMessage="No session data for this period"
                            pageSize={8}
                        />
                    </div>
                </>
            ) : (
                <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    No active sessions found for this project.
                </div>
            )}
            </div>
        </PageLayout>
    );
}
