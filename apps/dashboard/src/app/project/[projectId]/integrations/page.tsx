'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { MetricCard } from '../../../../components/ui/MetricCard';

const API = 'http://localhost:4000';

export default function IntegrationsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || !projectId) return;
        setLoading(true);
        apiFetch(`${API}/api/v1/dashboard/summaries?siteId=${projectId}`)
            .then(data => {
                const s = data.find((m: any) => m.kpiName === 'syncSuccessRate');
                setStats(s);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [projectId, token, apiFetch]);

    if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading integration health...</div>;

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Integrations & ERP</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>External service health and synchronization success rate for {projectId}</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <MetricCard 
                    title="Sync Success Rate"
                    value={stats?.value || 100}
                    unit="%"
                    state={stats?.state || 'stable'}
                    icon="🔗"
                    trendPct={stats?.trendPct}
                />
            </div>

            <div style={{ padding: '40px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔌</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Connectivity Map Placeholder</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>Real-time dependency graph showing connectivity status between platform and 3rd party ERP/OMS systems.</p>
            </div>
        </div>
    );
}
