'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { MetricCard } from '../../../../components/ui/MetricCard';


export default function OrdersPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    const [summaries, setSummaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || !projectId) return;
        setLoading(true);
        apiFetch(`/api/v1/dashboard/summaries?siteId=${projectId}`)
            .then(data => {
                setSummaries(data);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [projectId, token, apiFetch]);

    if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading order metrics...</div>;

    const totalOrders = summaries.find(s => s.kpiName === 'ordersTotal');
    const delayOrders = summaries.find(s => s.kpiName === 'ordersDelayCount');

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Order Processing</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Commerce health and delivery latency monitoring for {projectId}</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <MetricCard 
                    title="Total Orders"
                    value={totalOrders?.value || 0}
                    state={totalOrders?.state || 'stable'}
                    icon="🛍️"
                    trendPct={totalOrders?.trendPct}
                />
                <MetricCard 
                    title="Delayed Processing"
                    value={delayOrders?.value || 0}
                    state={delayOrders?.state || 'stable'}
                    icon="⏳"
                    trendPct={delayOrders?.trendPct}
                />
            </div>

            <div style={{ padding: '40px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Logistics Timeline Placeholder</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>Gantt-style visualization of order processing stages and fulfillment latency hotspots.</p>
            </div>
        </div>
    );
}
