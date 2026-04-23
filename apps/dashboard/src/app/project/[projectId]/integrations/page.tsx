'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { 
  PageLayout, 
  Typography, 
  Card, 
  Badge, 
  FilterBar, 
  InformationState,
  DiagnosticDrawer,
  OperationalTable,
  Column
} from '@kpi-platform/ui';
import { 
  AlertCircle, 
  ArrowRightLeft, 
  Zap, 
  Activity, 
  Clock, 
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';

// Integration specific components
import { IntegrationSummary } from '../../../../components/integrations/IntegrationSummary';
import { ConnectorCard, ConnectorHealth } from '../../../../components/integrations/ConnectorCard';
import { DiagnosticDrawerContent } from '../../../../components/integrations/DiagnosticDrawerContent';
import { SyncTrendChart } from '../../../../components/ui/SyncTrendChart';

export default function IntegrationsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const { token, apiFetch, outageStatus, lastUpdated } = useAuth();
    
    // State
    const [loading, setLoading] = useState(true);
    const [connectors, setConnectors] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({
        total: 0, healthy: 0, degraded: 0, critical: 0, stale: 0, successRate: 0, avgLatency: 0
    });
    const [trends, setTrends] = useState<any[]>([]);
    const [failedSyncs, setFailedSyncs] = useState<any[]>([]);
    
    // UI State
    const [selectedConnector, setSelectedConnector] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const isExpired = outageStatus === 'expired';

    const loadData = useCallback(async () => {
        if (!token || !projectId) return;
        setLoading(true);
        try {
            // Fetch from the new productized endpoint
            const response = await apiFetch(`/api/v1/tenants/current/projects/${projectId}/integrations`);
            const integrations = response?.data || [];
            
            const [summ, trend, failed] = await Promise.all([
                apiFetch(`/api/v1/dashboard/integrations/summary?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/integrations/trends?siteId=${projectId}`),
                apiFetch(`/api/v1/dashboard/integrations/failed?siteId=${projectId}`)
            ]);
            
            const mappedConnectors = integrations.map((s: any) => ({
                id: s.id,
                name: s.label,
                provider: s.providerId || 'External Service',
                type: s.family || s.category || 'REST API',
                status: (s.healthStatus?.toLowerCase() === 'healthy' ? 'healthy' : s.healthStatus?.toLowerCase() || 'degraded') as ConnectorHealth,
                healthScore: s.healthScore || 100,
                lastSync: s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleTimeString() : 'Never synced',
                lastWebhook: s.lastWebhookAt ? new Date(s.lastWebhookAt).toLocaleTimeString() : 'No activity',
                metrics: {
                metrics: {
                    syncSuccess: s.healthScore || 100,
                    webhookLatency: s.avgLatency ? `${s.avgLatency}ms` : summ.avgOmsLatency ? `${summ.avgOmsLatency}ms` : 'N/A',
                    freshness: (s.healthScore > 90 ? 'fresh' : s.healthScore > 70 ? 'delayed' : 'stale') as any
                },
                dimensions: {
                    connectivity: s.status === 'ACTIVE',
                    auth: true,
                    sync: (s.healthScore || 100) > 50,
                    webhook: !!s.lastWebhookAt
                }
            }));

            setConnectors(mappedConnectors);
            setSummary({
                total: mappedConnectors.length,
                healthy: mappedConnectors.filter((c:any) => c.status === 'healthy').length,
                degraded: mappedConnectors.filter((c:any) => c.status === 'degraded').length,
                critical: mappedConnectors.filter((c:any) => c.status === 'critical').length,
                stale: mappedConnectors.filter((c:any) => c.status === 'stale').length,
                successRate: summ.successRate ?? 100,
                avgLatency: summ.avgOmsLatency || 420
            });
            setTrends(trend);
            setFailedSyncs(failed);
        } catch (err) {
            console.error('Failed to load integration metrics', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInspect = (connector: any) => {
        setSelectedConnector(connector);
        setIsDrawerOpen(true);
    };

    const handleAction = async (action: string) => {
        if (!selectedConnector) return;
        
        if (action === 'resync') {
            try {
                await apiFetch(`/api/v1/tenants/current/projects/${projectId}/integrations/${selectedConnector.id}/sync`, {
                    method: 'POST'
                });
                loadData();
            } catch (e) {
                console.error('Action failed', e);
            }
        }
    };

    const filteredConnectors = useMemo(() => {
        return connectors.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  c.provider.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !filterStatus || c.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [connectors, searchQuery, filterStatus]);

    const failedColumns: Column<any>[] = [
        { key: 'system', header: 'System', render: (val) => <span className="font-bold">{val}</span> },
        { 
            key: 'error', 
            header: 'Failure Reason', 
            render: (val) => <span className="text-error font-medium">{val}</span> 
        },
        { key: 'timestamp', header: 'Time', render: (val) => new Date(val).toLocaleString() },
        { 
            key: 'actions', 
            header: '', 
            align: 'right',
            render: () => (
                <button className="p-1 hover:bg-muted rounded">
                    <MoreHorizontal size={16} />
                </button>
            ) 
        }
    ];

    return (
        <PageLayout
            title="Integrations Command Center"
            subtitle="Deep operational visibility and control over all connector health and activity."
            icon={<ArrowRightLeft size={24} />}
        >
            <div className="space-y-6">
                {/* 1. Global Integration Health Header */}
                <IntegrationSummary stats={summary} loading={loading} />

                {/* 2. Critical Alerts & Anomalies / Insights */}
                {summary.critical > 0 && (
                    <Card className="bg-error-bg border-error/20 p-4 flex items-center gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                            <AlertCircle size={24} />
                        </div>
                        <div className="flex-1">
                            <Typography variant="h3" weight="bold" noMargin className="text-error-text text-sm">
                                Critical System Failure Detected
                            </Typography>
                            <Typography variant="caption" className="text-error-text opacity-80">
                                {summary.critical} connectors are currently offline or failing critical heartbeats.
                            </Typography>
                        </div>
                        <Badge variant="error" size="sm">ACTION REQUIRED</Badge>
                    </Card>
                )}

                {/* 3. Unified Filter Bar */}
                <FilterBar 
                    searchPlaceholder="Search system name or provider..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={[
                        {
                            id: 'status',
                            label: 'Status',
                            value: filterStatus,
                            options: [
                                { label: 'Healthy', value: 'healthy' },
                                { label: 'Degraded', value: 'degraded' },
                                { label: 'Critical', value: 'critical' },
                                { label: 'Stale', value: 'stale' }
                            ]
                        }
                    ]}
                    onFilterChange={(_, val) => setFilterStatus(val)}
                    activeFilterCount={filterStatus ? 1 : 0}
                    onClearFilters={() => { setFilterStatus(''); setSearchQuery(''); }}
                />

                {/* 4. Connector Grid */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-text-muted" />
                            <Typography variant="h3" weight="bold" noMargin className="text-base">
                                Connector Reliability Matrix
                            </Typography>
                        </div>
                        <Typography variant="caption" className="text-text-muted">
                            Showing {filteredConnectors.length} of {connectors.length} total
                        </Typography>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1,2,3].map(i => <Card key={i} className="h-64 animate-pulse bg-muted" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredConnectors.map(connector => (
                                <ConnectorCard 
                                    key={connector.id}
                                    {...connector}
                                    onInspect={() => handleInspect(connector)}
                                />
                            ))}
                            {filteredConnectors.length === 0 && (
                                <div className="col-span-full">
                                    <InformationState type="filtered-empty" />
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* 5. Activity & Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sync Success Trend */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <RefreshCw size={18} className="text-text-muted" />
                            <Typography variant="h3" weight="bold" noMargin className="text-base">
                                Synchronization Confidence
                            </Typography>
                        </div>
                        <SyncTrendChart data={trends} height={240} />
                    </Card>

                    {/* Critical Failure Logs */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-subtle bg-muted flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={18} className="text-error" />
                                <Typography variant="h3" weight="bold" noMargin className="text-base">
                                    Critical Failure Audit
                                </Typography>
                            </div>
                            <Badge variant="error" size="sm">{failedSyncs.length} ERRORS</Badge>
                        </div>
                        <OperationalTable 
                            columns={failedColumns} 
                            data={failedSyncs} 
                            isDense
                            isEmpty={failedSyncs.length === 0}
                            emptyTitle="No critical failures"
                        />
                    </Card>
                </div>
            </div>

            {/* Diagnostic Side Panel */}
            <DiagnosticDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={selectedConnector?.name || 'Connector Details'}
                subtitle={`${selectedConnector?.provider} • Last activity ${selectedConnector?.lastSync}`}
                width="520px"
            >
                <DiagnosticDrawerContent 
                    connector={selectedConnector}
                    syncHistory={[
                        { timestamp: new Date().toISOString(), type: 'Scheduled', status: 'success', records: 142 },
                        { timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'Scheduled', status: 'success', records: 89 },
                        { timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'Manual', status: 'error', records: 0 },
                    ]}
                    webhookActivity={[
                        { id: 'wh_91283', event: 'order.created', status: 'processed' },
                        { id: 'wh_91282', event: 'inventory.updated', status: 'processed' },
                        { id: 'wh_91281', event: 'order.cancelled', status: 'error' },
                    ]}
                    onAction={handleAction}
                />
            </DiagnosticDrawer>
        </PageLayout>
    );
}
