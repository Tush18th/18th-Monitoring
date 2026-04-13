'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { MetricCard } from '../../../../components/ui/MetricCard';
import { SyncTrendChart } from '../../../../components/ui/SyncTrendChart';
import { SystemStatusList } from '../../../../components/ui/SystemStatusList';
import { FailedSyncTable } from '../../../../components/ui/FailedSyncTable';
import { SystemConnectivityMap } from '../../../../components/ui/SystemConnectivityMap';
import { CSVImportModal } from '../../../../components/ui/CSVImportModal';
import { Database, Plus } from 'lucide-react';

export default function IntegrationsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch, outageStatus, lastUpdated } = useAuth();
    
    const [summary, setSummary] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [systems, setSystems] = useState<any[]>([]);
    const [failedSyncs, setFailedSyncs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const isExpired = outageStatus === 'expired';

    useEffect(() => {
        if (!token || !projectId) {
            setLoading(false);
            return;
        }
        let isMounted = true;
        setLoading(true);

        Promise.allSettled([
            apiFetch(`/api/v1/dashboard/integrations/summary?siteId=${projectId}`),
            apiFetch(`/api/v1/dashboard/integrations/trends?siteId=${projectId}`),
            apiFetch(`/api/v1/dashboard/integrations/systems?siteId=${projectId}`),
            apiFetch(`/api/v1/dashboard/integrations/failed?siteId=${projectId}`)
        ]).then((results) => {
            if (!isMounted) return;
            const [summ, trend, sys, failed] = results.map(r => r.status === 'fulfilled' ? r.value : null);
            
            setSummary(summ);
            setTrends(Array.isArray(trend) ? trend : []);
            setSystems(Array.isArray(sys) ? sys : []);
            setFailedSyncs(Array.isArray(failed) ? failed : []);
            setLoading(false);
        }).catch(err => {
            if (!isMounted) return;
            console.error('Failed to load integration metrics', err);
            setLoading(false);
        });

        return () => { isMounted = false; };
    }, [projectId, token, apiFetch]);

    if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Probing integration health...</div>;

    // Map system data for the Connectivity Map
    const mapSystems = [
        { name: 'SAP ERP', status: 'Active' as const, latency: '120ms', type: 'source' as const },
        { name: 'Shopify Webhook', status: 'Active' as const, latency: '45ms', type: 'source' as const },
        { name: 'OMS (Primary)', status: 'Active' as const, latency: '82ms', type: 'source' as const },
    ];

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px', position: 'relative' }}>
            {isExpired && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 50,
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    textAlign: 'center',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '30px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '24px',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <AlertCircle size={40} color="var(--accent-red)" />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>Integration State Expired</h2>
                    <p style={{ maxWidth: '400px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '32px' }}>
                        Connectivity to back-office ERP and sync services has been lost for over 24 hours. 
                        Last heartbeat: <strong style={{ color: '#fff' }}>{lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown'}</strong>.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 32px',
                            background: 'var(--accent-red)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        Force Resync Attempt
                    </button>
                </div>
            )}

            <div style={{ opacity: isExpired ? 0.3 : 1 }}>
                <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Integrations & ERP</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>External service health and synchronization success rate for {projectId}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            style={{ padding: '10px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <Database size={16} />
                            Manual Sync
                        </button>
                        <button style={{ padding: '10px 18px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <Plus size={16} />
                            Add Connector
                        </button>
                    </div>
                </header>

                <CSVImportModal 
                    isOpen={isImportModalOpen} 
                    onClose={() => setIsImportModalOpen(false)} 
                    projectId={projectId} 
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <MetricCard title="Sync Success Rate" value={summary?.successRate} unit="%" state={summary?.successRate < 95 ? 'warning' : 'healthy'} icon="🔗" />
                    <MetricCard title="Failures (24h)" value={summary?.failureCount24h} state={summary?.failureCount24h > 10 ? 'critical' : 'healthy'} icon="⚠️" />
                    <MetricCard title="Avg Latency" value={summary?.avgOmsLatency} unit="ms" state="healthy" icon="⏱️" />
                    <MetricCard title="Health Score" value={summary?.healthScore} unit="%" state="healthy" icon="💖" />
                </div>

                <SystemConnectivityMap systems={mapSystems || []} />

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <SyncTrendChart data={trends || []} title="Sync Success Trend (24h)" />
                    <SystemStatusList systems={systems || []} title="Connected Systems" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    <FailedSyncTable data={failedSyncs || []} title="Critical Errors: Integration Sync Failures" />
                </div>
            </div>
        </div>
    );
}
