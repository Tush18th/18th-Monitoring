'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { 
  PageLayout, 
  Typography, 
  Card, 
  Badge,
  OperationalTable,
  Column
} from '@kpi-platform/ui';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function KpiAnalyticsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [kpiSummary, setKpiSummary] = useState<any[]>([]);
    const [catalog, setCatalog] = useState<{ available: any[], unavailable: any[] }>({ available: [], unavailable: [] });

    const loadData = useCallback(async () => {
        if (!token || !projectId) return;
        setLoading(true);
        try {
            const [summaryRes, catalogRes] = await Promise.all([
                apiFetch(`/api/v1/tenants/current/projects/${projectId}/kpi/summary`),
                apiFetch(`/api/v1/tenants/current/projects/${projectId}/kpi/catalog`)
            ]);

            setKpiSummary(summaryRes?.data?.kpis || []);
            setCatalog(catalogRes?.data || { available: [], unavailable: [] });
        } catch (err) {
            console.error('Failed to load KPI data', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'BUSINESS': return 'text-success';
            case 'OPERATIONAL': return 'text-primary';
            case 'EXPERIENCE': return 'text-secondary';
            case 'TECHNICAL': return 'text-warning';
            default: return 'text-text-muted';
        }
    };

    const getFreshnessIcon = (status: string) => {
        switch (status) {
            case 'live': return <Wifi size={12} className="text-success" />;
            case 'stale': return <WifiOff size={12} className="text-error" />;
            default: return <Clock size={12} className="text-text-muted" />;
        }
    };

    const catalogColumns: Column<any>[] = [
        {
            key: 'category',
            header: 'Category',
            render: (val) => (
                <Badge variant={val === 'BUSINESS' ? 'success' : val === 'OPERATIONAL' ? 'info' : 'warning'} size="sm">
                    {val}
                </Badge>
            )
        },
        {
            key: 'name',
            header: 'KPI',
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold">{val}</span>
                    <span className="text-[10px] font-mono text-text-muted">{row.key}</span>
                </div>
            )
        },
        {
            key: 'granularities',
            header: 'Granularity',
            render: (val: string[]) => (
                <div className="flex flex-wrap gap-1">
                    {val?.map(g => <span key={g} className="text-[9px] px-1 py-0.5 rounded bg-muted text-text-muted font-mono uppercase">{g}</span>)}
                </div>
            )
        },
        {
            key: 'freshnessSlaMinutes',
            header: 'SLA',
            align: 'right',
            render: (val) => <span className="text-xs font-mono text-text-muted">{val}m</span>
        }
    ];

    return (
        <PageLayout
            title="KPI Analytics Engine"
            subtitle="Canonical data-derived business, operational, and experience intelligence."
            icon={<BarChart3 size={24} />}
        >
            <div className="space-y-6">
                {/* 1. Live KPI Summary Cards */}
                <div>
                    <Typography variant="overline" className="text-text-muted mb-3 block">Live KPI Summary</Typography>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1,2,3].map(i => <Card key={i} className="p-4 h-24 animate-pulse bg-muted" />)}
                        </div>
                    ) : kpiSummary.length === 0 ? (
                        <Card className="p-8 flex flex-col items-center justify-center gap-3">
                            <Activity size={32} className="text-text-muted opacity-40" />
                            <Typography variant="body2" className="text-text-muted">
                                No KPI data yet. Ingest some order events via webhooks to start computing metrics.
                            </Typography>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {kpiSummary.map(kpi => (
                                <Card key={kpi.key} className="p-4 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={14} className={getCategoryColor(kpi.category)} />
                                            <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">
                                                {kpi.name}
                                            </Typography>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {getFreshnessIcon(kpi.freshnessStatus)}
                                            <span className="text-[10px] text-text-muted">{kpi.freshnessStatus}</span>
                                        </div>
                                    </div>
                                    <Typography variant="h2" weight="black" noMargin>
                                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : kpi.value}
                                    </Typography>
                                    <Typography variant="caption" className="text-text-muted text-[10px]">
                                        Last updated: {kpi.lastUpdated ? new Date(kpi.lastUpdated).toLocaleString() : 'Never'}
                                    </Typography>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. KPI Catalog */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <Card className="p-0 overflow-hidden">
                            <div className="p-4 border-b border-border">
                                <Typography variant="h4" noMargin>KPI Catalog</Typography>
                                <Typography variant="caption" className="text-text-muted">
                                    {catalog.available.length} KPIs available for this project.
                                </Typography>
                            </div>
                            <OperationalTable
                                data={catalog.available}
                                columns={catalogColumns}
                                loading={loading}
                                isDense
                            />
                        </Card>
                    </div>

                    <div>
                        <Card className="p-4 border-l-4 border-warning h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle size={16} className="text-warning" />
                                <Typography variant="h4" noMargin>Unavailable KPIs</Typography>
                            </div>
                            {catalog.unavailable.length === 0 ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-success" />
                                    <Typography variant="caption" className="text-success">All KPIs have coverage.</Typography>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {catalog.unavailable.map((u: any) => (
                                        <div key={u.key} className="flex flex-col gap-1 p-2 rounded bg-muted">
                                            <span className="text-xs font-bold font-mono">{u.key}</span>
                                            <span className="text-[10px] text-text-muted">{u.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
