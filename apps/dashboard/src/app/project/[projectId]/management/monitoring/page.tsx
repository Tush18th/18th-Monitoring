'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useParams } from 'next/navigation';
import { PageLayout, Typography, Card, Badge } from '@kpi-platform/ui';
import { 
    ShieldAlert, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Activity,
    Wifi,
    GitMerge,
    BarChart3,
    Clock,
    Bell,
    BellOff
} from 'lucide-react';

type HealthStatus = 'healthy' | 'warning' | 'degraded' | 'critical' | 'failed';
type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertStatus = 'active' | 'acknowledged' | 'resolved';

const healthColors: Record<HealthStatus, string> = {
    healthy: 'text-success',
    warning: 'text-warning',
    degraded: 'text-orange-400',
    critical: 'text-error',
    failed: 'text-error'
};

const healthBg: Record<HealthStatus, string> = {
    healthy: 'border-success',
    warning: 'border-warning',
    degraded: 'border-orange-400',
    critical: 'border-error',
    failed: 'border-error'
};

const severityBadge = (severity: AlertSeverity) => {
    switch (severity) {
        case 'critical': return <Badge variant="error" size="sm">CRITICAL</Badge>;
        case 'warning': return <Badge variant="warning" size="sm">WARNING</Badge>;
        default: return <Badge variant="info" size="sm">INFO</Badge>;
    }
};

const layerIcon = (layer: string) => {
    switch (layer) {
        case 'connector': return <Wifi size={16} />;
        case 'pipeline': return <GitMerge size={16} />;
        case 'kpi': return <BarChart3 size={16} />;
        case 'freshness': return <Clock size={16} />;
        default: return <Activity size={16} />;
    }
};

export default function MonitoringDashboardPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { token, apiFetch } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

    const loadData = useCallback(async () => {
        if (!token || !projectId) return;
        setLoading(true);
        try {
            const [healthRes, alertsRes] = await Promise.all([
                apiFetch(`/api/v1/tenants/current/projects/${projectId}/health/snapshot`),
                apiFetch(`/api/v1/tenants/current/projects/${projectId}/alerts`)
            ]);
            setSnapshot(healthRes?.data?.snapshot);
            setAlerts(alertsRes?.data?.alerts || []);
        } catch (err) {
            console.error('Failed to load monitoring data', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, token, apiFetch]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAcknowledge = async (alertId: string) => {
        await apiFetch(`/api/v1/tenants/current/projects/${projectId}/alerts/${alertId}/acknowledge`, {
            method: 'POST', body: JSON.stringify({ userId: 'current_user' })
        });
        loadData();
    };

    const handleResolve = async (alertId: string) => {
        await apiFetch(`/api/v1/tenants/current/projects/${projectId}/alerts/${alertId}/resolve`, {
            method: 'POST', body: JSON.stringify({ userId: 'current_user' })
        });
        loadData();
    };

    const filteredAlerts = alerts.filter(a => 
        activeTab === 'active' ? ['active', 'acknowledged'].includes(a.status) : a.status === 'resolved'
    );

    const healthStatus: HealthStatus = snapshot?.status || 'healthy';
    const healthScore: number = snapshot?.healthScore ?? 100;

    return (
        <PageLayout
            title="System Monitoring"
            subtitle="Real-time health evaluation, alert management, and operational visibility."
            icon={<ShieldAlert size={24} />}
        >
            <div className="space-y-6">
                {/* 1. Health Score Banner */}
                <Card className={`p-6 border-l-4 ${healthBg[healthStatus]}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`text-5xl font-black ${healthColors[healthStatus]}`}>
                                {healthScore}
                            </div>
                            <div>
                                <Typography variant="overline" className="text-text-muted">System Health Score</Typography>
                                <Typography variant="h3" noMargin className={`uppercase font-black ${healthColors[healthStatus]}`}>
                                    {healthStatus}
                                </Typography>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant={alerts.filter(a => a.status === 'active' && a.severity === 'critical').length > 0 ? 'error' : 'neutral'} size="sm">
                                {alerts.filter(a => a.status === 'active' && a.severity === 'critical').length} Critical
                            </Badge>
                            <Badge variant={alerts.filter(a => a.status === 'active' && a.severity === 'warning').length > 0 ? 'warning' : 'neutral'} size="sm">
                                {alerts.filter(a => a.status === 'active' && a.severity === 'warning').length} Warnings
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* 2. Health Signal Breakdown */}
                {snapshot?.signals && (
                    <div>
                        <Typography variant="overline" className="text-text-muted mb-3 block">Health Signal Breakdown</Typography>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {snapshot.signals.map((signal: any) => (
                                <Card key={signal.name} className={`p-4 border-l-4 ${healthBg[signal.status as HealthStatus]}`}>
                                    <div className={`flex items-center gap-2 mb-2 ${healthColors[signal.status as HealthStatus]}`}>
                                        {layerIcon(signal.layer)}
                                        <span className="text-xs font-bold uppercase tracking-wider">{signal.layer}</span>
                                    </div>
                                    <Typography variant="caption" className="text-text-muted block">{signal.name}</Typography>
                                    <span className={`text-xs font-bold uppercase mt-1 block ${healthColors[signal.status as HealthStatus]}`}>{signal.status}</span>
                                    {signal.detail && <span className="text-[10px] text-text-muted block mt-1">{signal.detail}</span>}
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Alerts Feed */}
                <Card className="p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div>
                            <Typography variant="h4" noMargin>Alert Feed</Typography>
                            <Typography variant="caption" className="text-text-muted">
                                Rule-based alerts with lifecycle management.
                            </Typography>
                        </div>
                        <div className="flex rounded-md overflow-hidden border border-border">
                            {(['active', 'resolved'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 text-xs font-bold uppercase transition-colors ${
                                        activeTab === tab 
                                        ? 'bg-primary text-white' 
                                        : 'bg-surface text-text-muted hover:bg-muted'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <Activity size={24} className="text-text-muted animate-pulse" />
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="p-10 flex flex-col items-center gap-3">
                            <CheckCircle2 size={32} className="text-success opacity-60" />
                            <Typography variant="body2" className="text-text-muted">
                                {activeTab === 'active' ? 'No active alerts. System operating nominally.' : 'No resolved alerts to show.'}
                            </Typography>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredAlerts.map(alert => (
                                <div key={alert.id} className="p-4 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5">
                                            {alert.severity === 'critical' ? (
                                                <XCircle size={18} className="text-error" />
                                            ) : alert.severity === 'warning' ? (
                                                <AlertTriangle size={18} className="text-warning" />
                                            ) : (
                                                <Bell size={18} className="text-info" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {severityBadge(alert.severity)}
                                                {alert.status === 'acknowledged' && <Badge variant="neutral" size="sm">ACK</Badge>}
                                            </div>
                                            <Typography variant="body2" noMargin className="font-medium text-text-primary">
                                                {alert.message}
                                            </Typography>
                                            <Typography variant="caption" className="text-text-muted">
                                                Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                                                {alert.resolvedAt && ` · Resolved: ${new Date(alert.resolvedAt).toLocaleString()}`}
                                            </Typography>
                                        </div>
                                    </div>
                                    
                                    {alert.status === 'active' && (
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleAcknowledge(alert.id)}
                                                className="px-3 py-1.5 text-xs font-bold text-warning border border-warning rounded hover:bg-warning/10 transition"
                                            >
                                                Ack
                                            </button>
                                            <button
                                                onClick={() => handleResolve(alert.id)}
                                                className="px-3 py-1.5 text-xs font-bold text-success border border-success rounded hover:bg-success/10 transition"
                                            >
                                                Resolve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </PageLayout>
    );
}
