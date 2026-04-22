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
  FilterBar
} from '@kpi-platform/ui';
import { 
  GitMerge, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon,
  Settings2,
  Clock,
  History
} from 'lucide-react';

export default function PipelineMonitorPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const loadData = useCallback(async () => {
        if (!token || !projectId) return;
        setLoading(true);
        try {
            const response = await apiFetch(`/api/v1/tenants/current/projects/${projectId}/pipeline/jobs`);
            setJobs(response?.data?.jobs || []);
        } catch (err) {
            console.error('Failed to load pipeline jobs', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getJobTypeIcon = (type: string) => {
        switch (type) {
            case 'INGESTION': return <GitMerge size={16} className="text-secondary" />;
            case 'TRANSFORMATION': return <Settings2 size={16} className="text-primary" />;
            case 'AGGREGATION': return <History size={16} className="text-info" />;
            default: return <GitMerge size={16} />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RUNNING': return <Badge variant="info" size="sm" icon={<Play size={10} />}>{status}</Badge>;
            case 'COMPLETED': return <Badge variant="success" size="sm" icon={<CheckCircle2 size={10} />}>{status}</Badge>;
            case 'FAILED': return <Badge variant="error" size="sm" icon={<XCircle size={10} />}>{status}</Badge>;
            case 'DEAD_LETTERED': return <Badge variant="error" size="sm" icon={<AlertOctagon size={10} />}>{status}</Badge>;
            case 'QUEUED': return <Badge variant="warning" size="sm" icon={<Clock size={10} />}>{status}</Badge>;
            default: return <Badge variant="neutral" size="sm">{status}</Badge>;
        }
    };

    const columns: Column<any>[] = [
        { 
            key: 'type', 
            header: 'Job Type', 
            render: (val, row) => (
                <div className="flex items-center gap-2">
                    {getJobTypeIcon(val)}
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest">{val}</span>
                        <span className="text-[10px] text-text-muted font-mono">{row.id?.substring(0, 8)}</span>
                    </div>
                </div>
            ) 
        },
        { 
            key: 'startedAt', 
            header: 'Started', 
            render: (val) => val ? <span className="text-xs">{new Date(val).toLocaleTimeString()}</span> : <span className="text-xs opacity-50">Pending</span>
        },
        { 
            key: 'status', 
            header: 'Status', 
            render: (val) => getStatusBadge(val) 
        },
        { 
            key: 'attempts', 
            header: 'Retries',
            align: 'right',
            render: (val, row) => (
                <span className={`text-xs font-mono font-bold ${val > 0 ? 'text-warning' : 'text-text-muted opacity-50'}`}>
                    {val} / {row.maxRetries}
                </span>
            ) 
        }
    ];

    return (
        <PageLayout
            title="Pipeline & Execution Backbone"
            subtitle="Monitor asynchronous streaming workloads, view checkpoints, and manage the dead letter queue."
            icon={<GitMerge size={24} />}
        >
            <div className="space-y-6">
                {/* 1. Header Metrics (Simulated from actual arrays if populated) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 flex flex-col justify-between">
                        <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">Active Jobs</Typography>
                        <div className="flex items-baseline gap-2 mt-1">
                            <Typography variant="h2" weight="black" noMargin>{jobs.filter(j => j.status === 'RUNNING').length}</Typography>
                        </div>
                    </Card>
                    <Card className="p-4 flex flex-col justify-between">
                        <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">Completed (24h)</Typography>
                        <div className="flex items-baseline gap-2 mt-1">
                            <Typography variant="h2" weight="black" noMargin className="text-success">{jobs.filter(j => j.status === 'COMPLETED').length}</Typography>
                        </div>
                    </Card>
                    <Card className="p-4 border-l-4 border-warning">
                        <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">Retrying Process</Typography>
                        <Typography variant="h2" weight="black" noMargin className="text-warning">
                            {jobs.filter(j => j.attempts > 0 && j.status !== 'DEAD_LETTERED' && j.status !== 'COMPLETED').length}
                        </Typography>
                    </Card>
                    <Card className="p-4 border-l-4 border-error">
                        <Typography variant="caption" className="text-text-muted uppercase font-bold tracking-widest">Dead Letter Queue</Typography>
                        <Typography variant="h2" weight="black" noMargin className="text-error">
                             {jobs.filter(j => j.status === 'DEAD_LETTERED').length}
                        </Typography>
                    </Card>
                </div>

                {/* 2. Job Queue List */}
                <Card className="flex flex-col gap-4 p-4">
                     <div className="flex items-center justify-between">
                         <div>
                             <Typography variant="h4" noMargin className="text-text-primary">Pipeline Execution Queue</Typography>
                             <Typography variant="caption" className="text-text-muted">Live view into the execution worker pool across the project footprint.</Typography>
                         </div>
                     </div>

                    <FilterBar
                        searchPlaceholder="Search correlation ID or job..."
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        filters={[
                            {
                                id: 'status',
                                label: 'Status',
                                value: statusFilter,
                                options: [
                                    { label: 'Running', value: 'RUNNING' },
                                    { label: 'Completed', value: 'COMPLETED' },
                                    { label: 'Failed/DLQ', value: 'DEAD_LETTERED' }
                                ]
                            }
                        ]}
                        onFilterChange={(_, val) => setStatusFilter(val)}
                    />

                    <div className="border border-border opacity-90 rounded-md overflow-hidden">
                        <OperationalTable
                            data={jobs}
                            columns={columns}
                            loading={loading}
                            isDense
                            emptyMessage="No pipeline activity in this dimension."
                        />
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
}
