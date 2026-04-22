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
  Column,
  InformationState,
  FilterBar
} from '@kpi-platform/ui';
import { 
  Database, 
  Webhook, 
  Files, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileCode,
  Search,
  Activity
} from 'lucide-react';

export default function IngestionMonitorPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const loadData = useCallback(async () => {
        if (!token || !projectId) return;
        setLoading(true);
        try {
            const response = await apiFetch(`/api/v1/tenants/current/projects/${projectId}/ingestion/events`);
            setEvents(response?.data || []);
        } catch (err) {
            console.error('Failed to load ingestion events', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getModeIcon = (mode: string) => {
        switch (mode) {
            case 'WEBHOOK': return <Webhook size={16} className="text-primary" />;
            case 'POLLING': return <RefreshCw size={16} className="text-secondary" />;
            case 'FILE_IMPORT': return <Files size={16} className="text-info" />;
            default: return <Database size={16} />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'QUEUED':
            case 'COMPLETED': return <Badge variant="success" size="sm">{status}</Badge>;
            case 'REJECTED': 
            case 'FAILED': return <Badge variant="error" size="sm">{status}</Badge>;
            case 'ARCHIVED': return <Badge variant="info" size="sm">{status}</Badge>;
            default: return <Badge variant="warning" size="sm">{status}</Badge>;
        }
    };

    const columns: Column<any>[] = [
        { 
            key: 'mode', 
            header: 'Mode', 
            render: (val) => (
                <div className="flex items-center gap-2">
                    {getModeIcon(val)}
                    <span className="text-xs font-bold">{val}</span>
                </div>
            ) 
        },
        { 
            key: 'receivedAt', 
            header: 'Time', 
            render: (val) => <span className="text-xs font-mono text-text-muted">{new Date(val).toLocaleString()}</span> 
        },
        { 
            key: 'sourceReferenceId', 
            header: 'Source Ref', 
            render: (val) => val ? <code className="text-xs px-1 bg-muted rounded">{val}</code> : <span className="text-text-muted italic">-</span>
        },
        { 
            key: 'validation', 
            header: 'Validation', 
            render: (val) => (
                <div className="flex items-center gap-1">
                    {val?.isValid ? (
                        <CheckCircle2 size={14} className="text-success" />
                    ) : (
                        <XCircle size={14} className="text-error" />
                    )}
                    <span className="text-[10px] uppercase tracking-tighter opacity-70">
                        {val?.isValid ? 'Valid' : 'Blocked'}
                    </span>
                </div>
            ) 
        },
        { 
            key: 'status', 
            header: 'Status', 
            render: (val) => getStatusBadge(val) 
        },
        {
            key: 'artifactId',
            header: 'Raw',
            align: 'right',
            render: (val) => val ? (
                <button 
                  className="p-1 hover:bg-muted rounded text-primary"
                  onClick={() => window.alert(`Fetching artifact: ${val}`)}
                >
                    <FileCode size={16} />
                </button>
            ) : null
        }
    ];

    return (
        <PageLayout
            title="Ingestion Monitor"
            subtitle="Real-time visibility into every data point entering the platform."
            icon={<Activity size={24} />}
        >
            <div className="space-y-6">
                {/* 1. Header Metrics (Simulated) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 flex flex-col justify-between">
                        <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">Intake Volume (24h)</Typography>
                        <div className="flex items-baseline gap-2 mt-1">
                            <Typography variant="h2" weight="black" noMargin>{events.length}</Typography>
                            <Typography variant="caption" className="text-success font-bold">+12%</Typography>
                        </div>
                    </Card>
                    <Card className="p-4 flex flex-col justify-between">
                        <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">Validation Rate</Typography>
                        <div className="flex items-baseline gap-2 mt-1">
                            <Typography variant="h2" weight="black" noMargin>
                                {events.length > 0 ? Math.round((events.filter(e => e.validation?.isValid).length / events.length) * 100) : 100}%
                            </Typography>
                        </div>
                    </Card>
                    <Card className="p-4 border-l-4 border-error">
                        <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">Rejection Queue</Typography>
                        <Typography variant="h2" weight="black" noMargin className="text-error">
                            {events.filter(e => e.status === 'REJECTED').length}
                        </Typography>
                    </Card>
                    <Card className="p-4 border-l-4 border-info">
                        <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">Artifact Archival</Typography>
                        <Typography variant="h2" weight="black" noMargin className="text-info">100%</Typography>
                    </Card>
                </div>

                {/* 2. Filters */}
                <FilterBar
                    searchPlaceholder="Search Source Ref or ID..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={[
                        {
                            id: 'status',
                            label: 'Status',
                            value: statusFilter,
                            options: [
                                { label: 'Queued', value: 'QUEUED' },
                                { label: 'Rejected', value: 'REJECTED' },
                                { label: 'Archived', value: 'ARCHIVED' }
                            ]
                        }
                    ]}
                    onFilterChange={(_, val) => setStatusFilter(val)}
                />

                {/* 3. Event Table */}
                <Card className="p-0 overflow-hidden">
                    <OperationalTable
                        data={events}
                        columns={columns}
                        loading={loading}
                        isDense
                        onRowClick={(row) => console.log('Details for:', row.id)}
                    />
                </Card>
            </div>
        </PageLayout>
    );
}
